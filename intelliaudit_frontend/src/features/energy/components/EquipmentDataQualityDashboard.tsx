import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress, 
  Grid, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  MergeType as MergeIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { equipmentConsolidationService, CompletenessCheckResult, CompletenessResult } from '@/services/equipment/equipment-consolidation';

// Helper function to get color based on completeness score
const getCompletenessColor = (score: number): string => {
  if (score >= 0.8) return 'success.main';
  if (score >= 0.5) return 'warning.main';
  return 'error.main';
};

// Helper function to get icon based on completeness score
const getCompletenessIcon = (score: number) => {
  if (score >= 0.8) return <CheckCircleIcon color="success" />;
  if (score >= 0.5) return <WarningIcon color="warning" />;
  return <ErrorIcon color="error" />;
};

const EquipmentDataQualityDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [completenessData, setCompletenessData] = useState<CompletenessCheckResult | null>(null);
  const [equipmentWithGaps, setEquipmentWithGaps] = useState<any[]>([]);
  const [consolidationInProgress, setConsolidationInProgress] = useState<boolean>(false);
  const [consolidationResult, setConsolidationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (projectId) {
      loadCompletenessData();
    }
  }, [projectId]);

  // Load completeness data
  const loadCompletenessData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentConsolidationService.checkEquipmentCompleteness(projectId!);
      setCompletenessData(data);
      
      // If there are equipment with critical gaps, load them
      if (data.equipmentWithCriticalGaps > 0) {
        const gapsData = await equipmentConsolidationService.getEquipmentWithCriticalGaps(projectId!);
        setEquipmentWithGaps(gapsData);
      } else {
        setEquipmentWithGaps([]);
      }
    } catch (err: any) {
      setError(`Error loading equipment data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run deduplication
  const handleDeduplication = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await equipmentConsolidationService.deduplicateEquipment(projectId!);
      setSuccessMessage(`Deduplication complete: ${result.mergedDuplicates} duplicates merged out of ${result.totalProcessed} total records.`);
      // Reload completeness data after deduplication
      await loadCompletenessData();
    } catch (err: any) {
      setError(`Error during deduplication: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run enrichment for all equipment with critical gaps
  const handleEnrichment = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await equipmentConsolidationService.enrichProjectEquipment(projectId!);
      setSuccessMessage(`Enrichment complete: ${result.successfullyEnriched} items enriched successfully out of ${result.totalProcessed}.`);
      // Reload completeness data after enrichment
      await loadCompletenessData();
    } catch (err: any) {
      setError(`Error during enrichment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run the complete consolidation workflow
  const handleConsolidation = async () => {
    setConsolidationInProgress(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await equipmentConsolidationService.consolidateProjectEquipment(projectId!);
      setConsolidationResult(result);
      setSuccessMessage('Equipment consolidation workflow completed successfully.');
      // Reload completeness data after consolidation
      await loadCompletenessData();
    } catch (err: any) {
      setError(`Error during consolidation: ${err.message}`);
    } finally {
      setConsolidationInProgress(false);
    }
  };

  // Enrich a specific equipment item
  const handleEnrichEquipment = async (equipmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await equipmentConsolidationService.enrichEquipmentData(equipmentId);
      setSuccessMessage('Equipment data enriched successfully.');
      // Reload completeness data after enrichment
      await loadCompletenessData();
    } catch (err: any) {
      setError(`Error enriching equipment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render equipment category breakdown
  const renderCategoryBreakdown = () => {
    if (!completenessData || !completenessData.equipmentResults.length) return null;

    // Group equipment by category
    const categories: Record<string, CompletenessResult[]> = {};
    completenessData.equipmentResults.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {Object.entries(categories).map(([category, items]) => {
          // Calculate category completeness
          const categoryCompleteness = items.reduce((sum, item) => sum + item.completenessScore, 0) / items.length;
          const criticalGaps = items.filter(item => item.hasCriticalGaps).length;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={category}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{category}</Typography>
                    {getCompletenessIcon(categoryCompleteness)}
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Completeness: {Math.round(categoryCompleteness * 100)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={categoryCompleteness * 100} 
                      color={
                        categoryCompleteness >= 0.8 ? "success" : 
                        categoryCompleteness >= 0.5 ? "warning" : "error"
                      }
                      sx={{ mt: 1, mb: 2 }}
                    />
                  </Box>
                  
                  <Typography variant="body2">
                    {items.length} items • {criticalGaps} with critical gaps
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Render equipment with critical gaps
  const renderEquipmentWithGaps = () => {
    if (!equipmentWithGaps.length) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Equipment with Critical Data Gaps
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Equipment Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Missing Critical Fields</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipmentWithGaps.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.equipment_type || 'Unknown'}</TableCell>
                  <TableCell>{item.category || 'Uncategorized'}</TableCell>
                  <TableCell>{item.manufacturer || 'Unknown'}</TableCell>
                  <TableCell>{item.model || 'Unknown'}</TableCell>
                  <TableCell>
                    {item.missing_critical_fields ? 
                      JSON.parse(item.missing_critical_fields).map((field: string) => (
                        <Chip 
                          key={field} 
                          label={field} 
                          size="small" 
                          color="error" 
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )) : 'None'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Enrich this equipment">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEnrichEquipment(item.id)}
                        disabled={loading}
                      >
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {equipmentWithGaps.length > 10 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Showing 10 of {equipmentWithGaps.length} items with critical gaps
          </Typography>
        )}
      </Box>
    );
  };

  // Render consolidation results
  const renderConsolidationResults = () => {
    if (!consolidationResult) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Consolidation Results
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">Deduplication</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`${consolidationResult.deduplicationResults.mergedDuplicates} duplicates merged`}
                      secondary={`Out of ${consolidationResult.deduplicationResults.totalProcessed} total records`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">Enrichment</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`${consolidationResult.enrichmentResults.successfullyEnriched} items enriched`}
                      secondary={`Out of ${consolidationResult.enrichmentResults.totalProcessed} with critical gaps`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">Final Completeness</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getCompletenessIcon(consolidationResult.finalCompletenessResults.overallCompleteness)}
                  <Typography variant="h4" sx={{ ml: 1 }}>
                    {Math.round(consolidationResult.finalCompletenessResults.overallCompleteness * 100)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {consolidationResult.finalCompletenessResults.equipmentWithCriticalGaps} items still have critical gaps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Equipment Data Quality Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Equipment Completeness
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" sx={{ py: 2 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : completenessData ? (
                <>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={completenessData.overallCompleteness * 100} 
                      size={80}
                      sx={{ color: getCompletenessColor(completenessData.overallCompleteness) }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h6" component="div" color="text.secondary">
                        {Math.round(completenessData.overallCompleteness * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary={`${completenessData.totalEquipment} Total Equipment Items`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={`${completenessData.equipmentWithCriticalGaps} Items with Critical Gaps`}
                        secondary={`${Math.round((completenessData.equipmentWithCriticalGaps / completenessData.totalEquipment) * 100)}% of total`}
                      />
                    </ListItem>
                  </List>
                </>
              ) : (
                <Typography>No data available</Typography>
              )}
              
              <Button 
                startIcon={<RefreshIcon />}
                onClick={loadCompletenessData}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Data Consolidation Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<MergeIcon />}
                    fullWidth
                    onClick={handleDeduplication}
                    disabled={loading || !completenessData}
                  >
                    Deduplicate Equipment
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<BuildIcon />}
                    fullWidth
                    onClick={handleEnrichment}
                    disabled={loading || !completenessData || completenessData?.equipmentWithCriticalGaps === 0}
                  >
                    Enrich Missing Data
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AnalyticsIcon />}
                    fullWidth
                    onClick={handleConsolidation}
                    disabled={loading || consolidationInProgress || !completenessData}
                  >
                    Run Full Consolidation
                  </Button>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                The consolidation workflow will deduplicate equipment, check completeness, enrich missing data, 
                and generate AI-based energy analysis to fill any remaining critical gaps.
              </Typography>
              
              {consolidationInProgress && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Consolidation in progress... This may take a few minutes.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Category Breakdown */}
      {renderCategoryBreakdown()}
      
      {/* Equipment with Critical Gaps */}
      {renderEquipmentWithGaps()}
      
      {/* Consolidation Results */}
      {renderConsolidationResults()}
    </Box>
  );
};

export default EquipmentDataQualityDashboard;
