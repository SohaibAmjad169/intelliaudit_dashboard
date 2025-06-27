import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { equipment_analysis } from '@prisma/client';

@Injectable()
export class EquipmentDeduplicationService {
  private readonly logger = new Logger(EquipmentDeduplicationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find and merge duplicate equipment entries for a project
   * Prioritizes field notes data over photo analysis
   */
  async deduplicateProjectEquipment(projectId: string) {
    
    try {
      // Get all equipment for the project
      const allEquipment = await this.prisma.equipment_analysis.findMany({
        where: { project_id: projectId },
        orderBy: [
          // Prioritize field notes over photo analysis
          { source_type: 'asc' }, 
          // Newer entries over older ones
          { created_at: 'desc' }
        ]
      });
      
      
      // Group equipment by potential duplicates
      const equipmentGroups = this.groupPotentialDuplicates(allEquipment);
      
      let mergedCount = 0;
      let keptCount = 0;
      
      // Process each group
      for (const group of Object.values(equipmentGroups)) {
        if (group.length <= 1) {
          keptCount += group.length;
          continue; // No duplicates to merge
        }
        
        // Sort by priority (field_notes first, then photo_analysis)
        group.sort((a, b) => {
          // Prioritize field_notes over photo_analysis
          if (a.source_type === 'field_notes' && b.source_type !== 'field_notes') return -1;
          if (a.source_type !== 'field_notes' && b.source_type === 'field_notes') return 1;
          
          // If same source type, prioritize newer entries
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Keep the first item (highest priority) as the primary record
        const primaryRecord = group[0];
        const duplicates = group.slice(1);
        
        // Merge data from duplicates into the primary record
        const mergedData = this.mergeEquipmentData(primaryRecord, duplicates);
        
        // Update the primary record with merged data
        await this.prisma.equipment_analysis.update({
          where: { id: primaryRecord.id },
          data: mergedData
        });
        
        // Mark duplicates as merged
        for (const duplicate of duplicates) {
          try {
            // Mark as duplicate first
            await this.prisma.equipment_analysis.update({
              where: { id: duplicate.id },
              data: {
                is_duplicate: true
              }
            });
            
            // Use raw SQL to update the merged_into_id field
            // This bypasses the TypeScript type checking
            await this.prisma.$executeRaw`
              UPDATE equipment_analysis 
              SET merged_into_id = ${primaryRecord.id} 
              WHERE id = ${duplicate.id}
            `;
            
          } catch (error) {
            this.logger.warn(`Error updating duplicate ${duplicate.id}: ${error.message}`);
          }
        }
        
        mergedCount += duplicates.length;
        keptCount++;
      }
      
      
      return {
        totalProcessed: allEquipment.length,
        uniqueRecords: keptCount,
        mergedDuplicates: mergedCount
      };
    } catch (error) {
      this.logger.error(`Error during equipment deduplication: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Group equipment items that are potential duplicates
   * Uses location, equipment type, and manufacturer/model to identify duplicates
   */
  private groupPotentialDuplicates(equipment: equipment_analysis[]) {
    const groups: Record<string, any[]> = {};
    
    for (const item of equipment) {
      // Create a key based on identifying characteristics
      const location = typeof item.location === 'string' ? item.location : JSON.stringify(item.location);
      const key = [
        item.equipment_type || '',
        item.manufacturer || '',
        item.model || '',
        location || '',
        item.category || ''
      ].join('|').toLowerCase();
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(item);
    }
    
    return groups;
  }
  
  /**
   * Merge data from duplicate records into a primary record
   * Prioritizes non-null values from the primary record
   */
  private mergeEquipmentData(primary: equipment_analysis, duplicates: equipment_analysis[]) {
    const mergedData: any = { ...primary };
    
    // Track photo references from all duplicates
    const allPhotos = primary.photos ? JSON.parse(primary.photos as string) : [];
    
    // Fields that should be arrays or combined
    for (const duplicate of duplicates) {
      // Merge photos
      if (duplicate.photos) {
        const duplicatePhotos = JSON.parse(duplicate.photos as string);
        allPhotos.push(...duplicatePhotos);
      }
      
      // For each field in the duplicate
      for (const [field, value] of Object.entries(duplicate)) {
        // Skip certain fields
        if (['id', 'created_at', 'updated_at', 'project_id', 'photos'].includes(field)) {
          continue;
        }
        
        // If primary doesn't have this value but duplicate does, use the duplicate's value
        if ((mergedData[field] === null || mergedData[field] === undefined) && value !== null && value !== undefined) {
          mergedData[field] = value;
        }
      }
    }
    
    // Deduplicate photos by URL
    const uniquePhotos = Array.from(
      new Map(allPhotos.map((photo: any) => [photo.url, photo])).values()
    );
    
    mergedData.photos = JSON.stringify(uniquePhotos);
    
    return mergedData;
  }
}
