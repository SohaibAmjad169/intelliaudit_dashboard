import React from 'react';
import { Route, Routes } from 'react-router-dom';
import EnergyAnalysisPage from './pages/EnergyAnalysisPage';
import EndUseBreakdownPage from '../../pages/EndUseBreakdownPage';

/**
 * Routes for the energy analysis feature
 */
export const EnergyAnalysisRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/projects/:projectId/energy-analysis" element={<EnergyAnalysisPage />} />
      <Route path="/projects/:projectId/end-use-breakdown" element={<EndUseBreakdownPage />} />
    </Routes>
  );
};

/**
 * Energy analysis route paths for use in navigation
 */
export const energyAnalysisPaths = {
  energyAnalysis: (projectId: string) => `/projects/${projectId}/energy-analysis`,
  endUseBreakdown: (projectId: string) => `/projects/${projectId}/end-use-breakdown`,
}; 