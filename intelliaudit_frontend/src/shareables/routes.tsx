import React from "react";
import { RouteObject } from "react-router-dom";
import { ShareLayout } from "./layout/ShareLayout";
import { OverviewPage } from "./overview/OverviewPage";
import { EnergyAuditPage } from "./energy/EnergyAuditPage";
import { WaterAuditPage } from "./water/WaterAuditPage";
import { RcxAuditPage } from "./rcx/RcxAuditPage";
import { AppendicesPage } from "./appendices/AppendicesPage";
import { NextStepsPage } from "./next-steps/NextStepsPage";

export const shareableRoutes: RouteObject = {
  path: '/share/projects/:projectId',
  element: <ShareLayout />,
  children: [
    {
      index: true,
      element: <OverviewPage />,
    },
    {
      path: 'energy',
      element: <EnergyAuditPage />,
    },
    {
      path: 'water',
      element: <WaterAuditPage />,
    },
    {
      path: 'rcx',
      element: <RcxAuditPage />,
    },
    {
      path: 'appendices',
      element: <AppendicesPage />,
    },
    {
      path: 'next-steps',
      element: <NextStepsPage />,
    },
  ],
}; 