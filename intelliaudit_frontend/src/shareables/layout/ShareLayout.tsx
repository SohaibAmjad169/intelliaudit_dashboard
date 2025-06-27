import React, { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const ShareLayout: React.FC = () => {
  // Grab the :projectId param once so we can build sidebar links
  const { projectId } = useParams<{ projectId: string }>();

  // Hide any existing chat widget / toast viewport in public share view
  useEffect(() => {
    // Inject CSS to hide chat widgets and other overlay elements
    const style = document.createElement('style');
    style.textContent = `
      /* Hide chat widgets and overlays */
      .intercom-frame,
      .intercom-launcher,
      [id*="intercom"],
      [class*="intercom"],
      .crisp-client,
      [id*="crisp"],
      [class*="crisp"],
      .zendesk-widget,
      [id*="zendesk"],
      [class*="zendesk"],
      [data-testid*="chat"],
      [class*="chat-widget"],
      [id*="chat-widget"],
      [class*="helpdesk"],
      [id*="helpdesk"],
      .drift-frame,
      [id*="drift"],
      [class*="drift"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Ensure body doesn't scroll horizontally on mobile */
      body {
        overflow-x: hidden;
      }

      /* Responsive adjustments */
      @media (max-width: 1024px) {
        .mobile-content-padding {
          padding-left: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!projectId) {
    return <div className="p-6">Project ID not found</div>;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar projectId={projectId} />

      {/* Main content */}
      <main className="flex-1 overflow-auto mobile-content-padding lg:pl-0">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}; 