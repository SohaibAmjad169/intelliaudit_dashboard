import React from "react";
import {
  Droplet,
  Zap,
  Image,
  LineChart,
  ClipboardList,
  BarChart3,
  Database,
  CalculatorIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalculateOutlined, Checklist } from "@mui/icons-material";

interface EnergyNavigationProps {
  projectId: string;
  projectSlug: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  publicView?: boolean;
}

export const EnergyNavigation: React.FC<EnergyNavigationProps> = ({
  projectId,
  projectSlug,
  currentPath,
  onNavigate,
  publicView,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isOnEnergyAnalysisPage = location.pathname.includes("/energy-analysis");

  const handleRegularNavigation = (path: string) => {
    onNavigate(path);

    if (isOnEnergyAnalysisPage) {
      const basePath = publicView
        ? `/share/projects/${projectId}`
        : `/projects/${projectId}`;
      navigate(basePath);
    }
  };

  const handleEnergyAnalysisNavigation = () => {
    onNavigate("energy-analysis");
  };

  return (
    <nav className="space-y-1.5">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 rounded-sm">
        REPORTING
      </div>

      {/* Executive Summary */}
      <button
        onClick={() => handleRegularNavigation("summary")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "summary"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <Checklist className="mr-2 h-4 w-4 text-green-500" />
        Summary
      </button>

      {/* Energy Analysis */}
      <button
        onClick={() => handleRegularNavigation("energy-overview")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "energy-overview"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <BarChart3 className="mr-2 h-4 w-4 text-red-500" />
        Energy Audit
      </button>

      {/* Water */}
      <button
        onClick={() => handleRegularNavigation("water")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "water"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <Droplet className="mr-2 h-4 w-4 text-blue-500" />
        Water Audit
      </button>

      {/* RCx Audit */}
      <button
        onClick={() => handleRegularNavigation("eco")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "eco"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <ClipboardList className="mr-2 h-4 w-4 text-indigo-500" />
        RCx Audit
      </button>

      {/* Equipment - First step */}
      <button
        onClick={() => handleRegularNavigation("energy")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "energy"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <Zap className="mr-2 h-4 w-4 text-yellow-500" />
        Equipment
      </button>

      {/* Photos */}
      <button
        onClick={() => handleRegularNavigation("photos-overview")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "photos-overview"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <Image className="mr-2 h-4 w-4 text-purple-500" />
        Photos
      </button>

      {/* ECMs - Final step */}
      <button
        onClick={() => handleRegularNavigation("ecms")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "ecms"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <CalculatorIcon className="mr-2 h-4 w-4 text-orange-500" />
        Measures
      </button>

      {/* Appendices */}
      <button
        onClick={() => handleRegularNavigation("appendices")}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          currentPath === "appendices"
            ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <LineChart className="mr-2 h-4 w-4 text-blue-500" />
        Appendices
      </button>

      {/* Header */}
      {!publicView && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 rounded-sm">
          {/* utilities section */}
          UTILITIES
        </div>
      )}

      {/* Detailed Energy Analysis */}
      {!publicView && (
        <Link
          to={`/projects/${projectId}/energy-analysis`}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            location.pathname.includes("/energy-analysis")
              ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <BarChart3 className="mr-2 h-4 w-4 text-orange-500" />
          Detailed Energy Analysis
        </Link>
      )}

      {/* Photo Metadata */}
      {!publicView && (
        <button
          onClick={() => handleRegularNavigation("photo-metadata")}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            currentPath === "photo-metadata"
              ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:translate-x-1 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <Database className="mr-2 h-4 w-4 text-indigo-500" />
          Photo Metadata
        </button>
      )}
    </nav>
  );
};
