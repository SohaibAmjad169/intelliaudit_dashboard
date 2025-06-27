import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AppLayoutProps {
  children?: React.ReactNode;
  publicView?: boolean;
  passwordView?: boolean;
}

export default function AppLayout({
  children,
  publicView,
  passwordView,
}: AppLayoutProps) {
  const { resolvedTheme } = useTheme();
  const { sidebarContent } = useSidebar();

  // Update the document class when the theme changes
  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Password view state
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [verify, setVerify] = useState(true);

  useEffect(() => {
    if (passwordView) {
      setVerify(false);
      setIsOpen(true);
    }
  }, [passwordView]);

  const submit = async () => {
    if (password === "Intelliaudit") {
      setVerify(true);
      setIsOpen(false);
    } else {
      setIsPasswordValid(false);
    }
  };

  return (
    <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
      {/* Sidebar Component - Full height */}

      {verify && (
        <>
          <div className="h-screen">
            <Sidebar sidebarContent={sidebarContent} publicView={publicView} />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col flex-1">
            {/* Header Component - Sticky to the top */}
            {/* If publicView is true, do not render the header */}
            {!publicView && <Header className="sticky top-0 z-50 w-full" />}

            {/* Main Content */}
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col bg-background dark:bg-background overflow-auto"
            >
              {/* Content Container */}
              <div className="flex-1 w-full mx-auto bg-background dark:bg-background">
                {/* Content */}
                <div className="h-full">{children || <Outlet />}</div>
              </div>
            </motion.main>
          </div>
        </>
      )}

      {/* Password Submit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          hideCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={submit}
            >
              Submit
            </Button>
          </div>

          {!isPasswordValid && (
            <p className="text-red-500 text-sm mt-2">
              Invalid password. Please try again.
            </p>
          )}

          {/* <DialogFooter className="sm:justify-start mt-4">
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={openReport}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
