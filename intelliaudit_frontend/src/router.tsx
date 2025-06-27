import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { RequireAuth } from "./components/auth/RequireAuth";
import LoginPage from "./pages/auth/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
// Static import for the details page
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
// Import energy analysis
import { EnergyAnalysisPage } from "./components/energy-analysis";
import EndUseBreakdownPage from "./pages/EndUseBreakdownPage";

// Lazy load pages
const ProjectListPage = React.lazy(
  () => import("./pages/projects/ProjectListPage")
);
const ShareableReportPage = React.lazy(
  () => import("./pages/reports/ShareableReportPage")
);
const PhotoMetadataPage = React.lazy(() => import("./pages/PhotoMetadataPage"));

// Loading component for lazy-loaded routes
const RouteLoading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
  </div>
);

// Define error boundary props and state types
type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

// Error boundary for lazy-loaded components
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Loading error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <h2 className="text-lg font-medium mb-2">Failed to load page</h2>
          <p className="text-muted-foreground text-center mb-4">
            There was an error loading this page. Please try refreshing or
            contact support.
          </p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// New shareable UI routes
import { shareableRoutes } from "./shareables/routes";

// Router configuration
export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/reports/share/:reportId",
    element: (
      <React.Suspense fallback={<RouteLoading />}>
        {/* Shareable report page - no auth required */}
        <ShareableReportPage />
      </React.Suspense>
    ),
  },

  // Public shareable routes (new UI)
  shareableRoutes,

  // Protected routes
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: "/",
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "/projects",
        element: (
          <ErrorBoundary>
            <React.Suspense fallback={<RouteLoading />}>
              <ProjectListPage />
            </React.Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: "/projects/:projectId",
        element: (
          <ErrorBoundary>
            <ProjectDetailsPage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/projects/:projectId/photo-metadata",
        element: (
          <ErrorBoundary>
            <React.Suspense fallback={<RouteLoading />}>
              <PhotoMetadataPage />
            </React.Suspense>
          </ErrorBoundary>
        ),
      },
      // Add energy analysis route
      {
        path: "/projects/:projectId/energy-analysis",
        element: (
          <ErrorBoundary>
            <React.Suspense fallback={<RouteLoading />}>
              <EnergyAnalysisPage />
            </React.Suspense>
          </ErrorBoundary>
        ),
      },
      // Add end-use breakdown route
      {
        path: "/projects/:projectId/end-use-breakdown",
        element: (
          <ErrorBoundary>
            <EndUseBreakdownPage />
          </ErrorBoundary>
        ),
      },
    ],
  },
  // 404 route
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

// Use this function when using the router with RouterProvider directly
export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
