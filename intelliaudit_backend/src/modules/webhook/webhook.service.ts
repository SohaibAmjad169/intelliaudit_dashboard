import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FieldNotesService } from '../field-notes/services/field-notes.service';
import { PhotoAnalysisPrismaService } from '../equipment/analysis/photo-analysis-prisma.service';
import { HttpService } from '@nestjs/axios';
import { CognitoFormsWebhookDto, PhotoDto } from './dto/cognito-forms-webhook.dto'; 
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ProjectStatus } from '../projects/project.entity'; 

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldNotesService: FieldNotesService,
    private readonly photoAnalysisService: PhotoAnalysisPrismaService,
    private readonly httpService: HttpService,
  ) {}

  async handleCognitoWebhook(payload: CognitoFormsWebhookDto): Promise<{ message: string; projectId: string }> {
    this.logger.log(`Received Cognito Forms webhook for Form: ${payload.Form?.Name}, Entry: ${payload.Entry?.Number}`);

    const projectId = await this.findOrCreateProject(payload);
    if (!projectId) {
        this.logger.error(`Could not find or create project for webhook payload. Address: ${payload.Address?.FullAddress}, Entry: ${payload.Entry?.Number}`);
        throw new InternalServerErrorException('Could not associate webhook data with a project.');
    }
    this.logger.log(`Associated webhook with Project ID: ${projectId}`);

    const rawNotes = this.aggregateFieldNotes(payload);
    this.processDataInBackground(projectId, rawNotes, payload)
        .catch(err => {
             this.logger.error(`Error during background processing for project ${projectId}: ${err.message}`, err.stack);
        });

    this.logger.log(`Webhook accepted for Project ID: ${projectId}. Processing initiated in background.`);
    return { message: 'Webhook received and processing initiated.', projectId };
  }


  private async processDataInBackground(projectId: string, rawNotes: string, payload: CognitoFormsWebhookDto): Promise<void> {
      this.logger.log(`[Background Processing Project: ${projectId}] Starting...`);
      try {
          this.logger.log(`[Background Processing Project: ${projectId}] Updating raw_notes...`);
          await this.prisma.projects.update({
              where: { id: projectId },
              data: { raw_notes: rawNotes },
          });
          this.logger.log(`[Background Processing Project: ${projectId}] Raw notes updated.`);

          this.logger.log(`[Background Processing Project: ${projectId}] Triggering Field Notes Service...`);
          await this.fieldNotesService.processAllFieldNotes({ projectId, notes: rawNotes });
          this.logger.log(`[Background Processing Project: ${projectId}] Field Notes Service processing complete.`);

          const photosToProcess = this.extractPhotos(payload);
          this.logger.log(`[Background Processing Project: ${projectId}] Extracted ${photosToProcess.length} photos from payload.`);

          if (photosToProcess.length > 0) {
              this.logger.log(`[Background Processing Project: ${projectId}] Downloading photos...`);
              const files = await this.downloadPhotos(photosToProcess);
              this.logger.log(`[Background Processing Project: ${projectId}] Downloaded ${files.length} photos.`);

              if (files.length > 0) {
                  this.logger.log(`[Background Processing Project: ${projectId}] Triggering Photo Analysis Service...`);
                  await this.photoAnalysisService.processPhotos(files, projectId);
                  this.logger.log(`[Background Processing Project: ${projectId}] Photo Analysis Service processing complete.`);
              }
          }
          this.logger.log(`[Background Processing Project: ${projectId}] Processing finished successfully.`);

      } catch (error) {
          this.logger.error(`[Background Processing Project: ${projectId}] Error during processing: ${error.message}`, error.stack);
      }
  }


  private async findOrCreateProject(payload: CognitoFormsWebhookDto): Promise<string | null> {
    const address = payload.Address?.FullAddress;
    if (!address) {
        this.logger.warn('Cannot find or create project: FullAddress is missing in the payload.');
        return null; 
    }

    try {
        let project = await this.prisma.projects.findFirst({
            where: {
                OR: [
                    { building_address: address },
                    { property_address: address }
                ]
             },
             orderBy: { 
                 updated_at: 'desc'
             }
        });

        if (project) {
            this.logger.log(`Found existing project ID ${project.id} by address: ${address}`);
            return project.id;
        }

        this.logger.log(`No existing project found for address: ${address}. Creating new project...`);
        const newProjectData = {
            name: payload.BuildingName || payload.Address?.Line1 || `Project ${payload.Entry?.Number || Date.now()}`,
            building_address: address,
            property_address: address, 
            property_city: payload.Address?.City,
            property_state: payload.Address?.State,
            property_postal_code: payload.Address?.PostalCode,
            building_type: payload.BuildingUseType || 'Unknown', 
            property_primary_function: payload.BuildingUseType || 'Unknown',
            total_units: payload.OfUnits || null,
            building_floors: payload.OfFloors || null,
            property_gross_floor_area: payload.GrossFloorArea ? parseInt(payload.GrossFloorArea, 10) : null,
            status: ProjectStatus.ACTIVE 
        };

        if (isNaN(newProjectData.property_gross_floor_area ?? NaN)) newProjectData.property_gross_floor_area = null;
        if (isNaN(newProjectData.total_units ?? NaN)) newProjectData.total_units = null;
        if (isNaN(newProjectData.building_floors ?? NaN)) newProjectData.building_floors = null;


        const createdProject = await this.prisma.projects.create({
            data: newProjectData,
        });
        this.logger.log(`Created new project with ID: ${createdProject.id}`);
        return createdProject.id;

    } catch (error) {
        this.logger.error(`Error finding or creating project for address ${address}: ${error.message}`, error.stack);
        return null; 
    }
  }


  private aggregateFieldNotes(payload: CognitoFormsWebhookDto): string {
    let notes = `Form Name: ${payload.Form?.Name || 'N/A'}\n`;
    notes += `Submission Date: ${payload.Date || 'N/A'}\n`;
    notes += `Auditor: ${payload.Name?.FirstAndLast || 'N/A'}\n`;
    notes += `Email: ${payload.YourEmailAddress || 'N/A'}\n`;
    notes += `Client Email: ${payload.ClientEmailAddress || 'N/A'}\n`;
    notes += `Project/Client Ref: ${payload.Project || 'N/A'}\n`;
    notes += `\n--- Building Info ---\n`;
    notes += `Address: ${payload.Address?.FullAddress || 'N/A'}\n`;
    notes += `Building Use Type: ${payload.BuildingUseType || 'N/A'}\n`;
    notes += `Gross Floor Area: ${payload.GrossFloorArea || 'N/A'} sqft\n`;
    notes += `Number of Units: ${payload.OfUnits || 'N/A'}\n`;
    notes += `Number of Bedrooms: ${payload.OfBedrooms || 'N/A'}\n`;
    notes += `Number of Bathrooms: ${payload.OfBathrooms || 'N/A'}\n`;
    notes += `Number of Floors: ${payload.OfFloors || 'N/A'}\n`;
    notes += `Building Dimensions: L=${payload.BuildingLength2 || 'N/A'}, W=${payload.BuildingWidth2 || 'N/A'}\n`;
    notes += `Elevators Present: ${payload.AreThereElevatorsAtTheProperty ? 'Yes' : 'No'}\n`;
    notes += `Maintenance Dept: ${payload.DoesBuildingHaveMaintenanceDepartment ? 'Yes' : 'No'}\n`;
    notes += `Different HVAC/Lighting Hours: ${payload.AreHVACLightingHoursDifferentThanOperatingHours ? 'Yes' : 'No'}\n`;
    if (payload.Comments) notes += `Comments 1: ${payload.Comments}\n`;
    if (payload.Comments2) notes += `Comments 2: ${payload.Comments2}\n`;

    notes += `\n--- Utilities ---\n`;
    notes += `Sources Present: ${(payload.WhichOfTheseSourcesArePresent || []).join(', ')}\n`;
    notes += `Tenant Pays: ${(payload.WhichOfTheseUtilitesDoTenantsPay || []).join(', ')}\n`;
    notes += `Owner Supplied Appliances: ${(payload.WhichOfTheseAppliancesAreSupplisedByTheOwner || []).join(', ')}\n`;

    const formatSection = (title: string, items: any[] | undefined, formatter: (item: any) => string) => {
      if (items && items.length > 0 && items.some(item => Object.keys(item).length > 1)) { // Check if items have more than just 'Id'
        notes += `\n--- ${title} ---\n`;
        items.forEach((item, index) => {
          const itemDetails = formatter(item);
          if (itemDetails) { 
             notes += `${index + 1}. ${itemDetails}\n`;
          }
        });
      }
    };

    formatSection('Plumbing Fixtures', payload.PlumbingFixtures, item =>
        item.FixtureType ? `Type: ${item.FixtureType}, Qty: ${item.Quantity || 'N/A'}, GPM: ${item.GallonsPerMinuteGPM || 'N/A'}, Temp: ${item.HotWaterTemperature || 'N/A'}°F, Loc: ${item.Location || 'N/A'}${item.Comments ? ', Comments: ' + item.Comments : ''}` : ''
    );
    formatSection('Boilers/Water Heaters', payload.BoilersWaterHeaters, item =>
        item.TypeOfEquipment ? `Type: ${item.TypeOfEquipment}, Make: ${item.Make || 'N/A'}, Model: ${item.Model || 'N/A'}, Qty: ${item.NumberOfUnits || 'N/A'}, Input: ${item.FuelInput || 'N/A'}, Source: ${item.PowerSource || 'N/A'}, Loc: ${item.Location || 'N/A'}${item.Comments ? ', Comments: ' + item.Comments : ''}` : ''
    );
     formatSection('Heating & Cooling', payload.HeatingCooling, item =>
        item.DistributionEquipmentType ? `Type: ${item.DistributionEquipmentType}, Qty: ${item.Quantity || 'N/A'}, Cooling: ${item.CoolingSource || 'N/A'}, Heating: ${item.HeatingSource || 'N/A'} (${item.HeatingFuel || 'N/A'}), Loc: ${item.Location || 'N/A'}${item.Comments ? ', Comments: ' + item.Comments : ''}` : ''
    );
    formatSection('Plug Loads/Appliances', payload.PlugLoadsAppliances, item =>
        item.DescriptionOfAppliance ? `Desc: ${item.DescriptionOfAppliance}, Qty: ${item.Quantity || 'N/A'}, Power: ${item.PowerWattsOrTherms || 'N/A'}, Hours: ${item.RunHours || 'N/A'}, Fuel: ${item.FuelType || 'N/A'}, Loc: ${item.Location || 'N/A'}${item.Comments ? ', Comments: ' + item.Comments : ''}` : ''
    );
    formatSection('Lighting', payload.Lighting2, item =>
        item.LightingType2 ? `Type: ${item.LightingType2}, Watts: ${item.WattsPerLamp || 'N/A'}W, Lamps/Fix: ${item.LampsPerFixture || 'N/A'}, Qty Fix: ${item.NumberOfFixtures || 'N/A'}, Loc: ${item.Location || 'N/A'}, Ctrl: ${item.OccupancyControlTypeSchedule || 'N/A'}` : ''
    );

    notes += `\n--- End of Form Data ---\n`;
    return notes;
  }


  private extractPhotos(payload: CognitoFormsWebhookDto): { url: string, name: string }[] {
    const photos: { url: string, name: string }[] = [];
    const photoFields: (keyof CognitoFormsWebhookDto)[] = [
      'BuildingPhoto', 'IrrigationPhotos', 'DoorPhotos', 'LightingPhotos',
    ];
     const repeatingSectionPhotoFields = [
      { key: 'PlumbingFixtures', photoKey: 'PlumbingFixturePhotos'},
      { key: 'BoilersWaterHeaters', photoKey: 'WaterHeaterBoilerPhotos'},
      { key: 'HeatingCooling', photoKey: 'HeatingCoolingPhotos'},
      { key: 'HeatingCooling', photoKey: 'HeatingCoolingUnitsPhotos'},
      { key: 'PlugLoadsAppliances', photoKey: 'PlugLoadPhotos'},
    ] as const; 


    photoFields.forEach(fieldKey => {
        const photoArray = payload[fieldKey] as PhotoDto[] | undefined;
        if (photoArray && Array.isArray(photoArray)) {
            photoArray.forEach(p => {
                if (p.Url && p.Name) {
                    photos.push({ url: p.Url, name: p.Name });
                }
            });
        }
    });

    repeatingSectionPhotoFields.forEach(sectionInfo => {
        const sectionArray = payload[sectionInfo.key] as any[] | undefined;
        if (sectionArray && Array.isArray(sectionArray)) {
            sectionArray.forEach(item => {
                const photoArray = item[sectionInfo.photoKey] as PhotoDto[] | undefined;
                if (photoArray && Array.isArray(photoArray)) {
                     photoArray.forEach(p => {
                        if (p.Url && p.Name) {
                            photos.push({ url: p.Url, name: p.Name });
                        }
                    });
                }
            });
        }
    });


    this.logger.log(`Extracted ${photos.length} photo URLs/names from payload.`);
    return photos;
  }


  private async downloadPhotos(photos: { url: string, name: string }[]): Promise<Express.Multer.File[]> {
    const downloadedFiles: Express.Multer.File[] = [];

    for (const photo of photos) {
        if (!photo.url) {
            this.logger.warn(`Skipping photo download: URL is missing for ${photo.name}`);
            continue;
        }
        try {
            this.logger.debug(`Downloading photo: ${photo.name} from ${photo.url}`);
            const response: AxiosResponse<Buffer> = await firstValueFrom(
                this.httpService.get(photo.url, { responseType: 'arraybuffer' })
            );

            if (response.status === 200 && response.data) {
                const contentType = response.headers['content-type'] || 'application/octet-stream';
                const mimetype = contentType.split(';')[0].trim();

                const file: Express.Multer.File = {
                    fieldname: 'file', 
                    originalname: photo.name || `downloaded_${Date.now()}`, 
                    encoding: 'binary', 
                    mimetype: mimetype,
                    buffer: response.data,
                    size: response.data.length,
                    stream: require('stream').Readable.from(response.data),
                    destination: '',
                    filename: photo.name || `downloaded_${Date.now()}`, 
                    path: '', 
                };
                downloadedFiles.push(file);
                 this.logger.debug(`Successfully downloaded ${photo.name} (${(file.size / 1024).toFixed(1)} KB, type: ${file.mimetype})`);
            } else {
                this.logger.warn(`Failed to download photo ${photo.name}: Status ${response.status}`);
            }
        } catch (error) {
            this.logger.error(`Error downloading photo ${photo.name} from ${photo.url}: ${error.message}`);
        }
    }

    return downloadedFiles;
  }
}