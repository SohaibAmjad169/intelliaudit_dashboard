export interface PortfolioManagerDesignMetrics {
  propertyId: string;
  metrics: {
    // Design metrics
    designEnergyCost: number;
    designTotalGHGEmissions: number;
    designScore: number;
    designSiteTotal: number;
    designSiteIntensity: number;
    designSourceTotal: number;
    designSourceIntensity: number;
    
    // Design targets
    designTargetEnergyCost: number;
    designTargetTotalGHGEmissions: number;
    designTargetScore: number;
    designTargetSiteTotal: number;
    designTargetSiteIntensity: number;
    designTargetSourceTotal: number;
    designTargetSourceIntensity: number;
    
    // Median benchmarks
    medianEnergyCost: number;
    medianTotalGHGEmissions: number;
    medianScore: number;
    medianSiteTotal: number;
    medianSiteIntensity: number;
    medianSourceTotal: number;
    medianSourceIntensity: number;
  };
} 