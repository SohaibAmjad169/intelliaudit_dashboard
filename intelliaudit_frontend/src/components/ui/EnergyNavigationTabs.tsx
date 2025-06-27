import React, { useState } from "react";
import {
  CheckSquare,
  Zap,
  BarChart3,
  Droplet,
  Image,
  ClipboardList,
  LineChart,
  Database,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  children?: MenuItem[];
}

interface TabbedMenuProps {
  items: MenuItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  publicView?: boolean;
}

export const TabbedMenu: React.FC<TabbedMenuProps> = ({
  items,
  activeTab,
  onTabChange,
  publicView = false
}) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [localActiveTab, setLocalActiveTab] = useState<string>("");

  const handleMenuClick = (menuId: string) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menuId);
    }
  };

  const handleTabClick = (tabId: string) => {
    setLocalActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const isActive = (id: string) => {
    return activeTab ? activeTab === id : localActiveTab === id;
  };

  return (
    <div className="flex flex-col">
      {/* Top row - menu headers */}
      <div className="flex flex-wrap gap-4">
        {items.map((menu) => (
          <div key={menu.id} className="flex-1 min-w-[300px]">
            {/* Parent Menu Button */}
            <button
              onClick={() => handleMenuClick(menu.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all ${
                expandedMenu === menu.id
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center">
                <menu.icon className={`mr-2 h-4 w-4 ${menu.color}`} />
                {menu.name}
              </div>
              {expandedMenu === menu.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom row - expanded content (full width) */}
      {expandedMenu && (
        <div className="mt-4 w-full">
          {items.map((menu) => (
            expandedMenu === menu.id && menu.children && (
              <div key={menu.id} className="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                {menu.children.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${
                      isActive(tab.id)
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <tab.icon className={`mr-2 h-4 w-4 ${tab.color}`} />
                    {tab.name}
                  </button>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Usage Example remains the same
export const EnergyNavigationTabs: React.FC<{
  projectId: string;
  publicView?: boolean;
  activeTab?: string;
  onTabChange?: (id: string) => void;
}> = ({ projectId, publicView, activeTab, onTabChange }) => {
  const menuItems: MenuItem[] = [
    {
      id: "reporting",
      name: "Reporting",
      icon: CheckSquare,
      color: "text-green-500",
      children: [
        { id: "summary", name: "Summary", icon: CheckSquare, color: "text-green-500" },
        { id: "energy", name: "Equipment", icon: Zap, color: "text-yellow-500" },
        { id: "energy-overview", name: "Energy", icon: BarChart3, color: "text-red-500" },
        { id: "water", name: "Water", icon: Droplet, color: "text-blue-500" },
        { id: "photos-overview", name: "Photos", icon: Image, color: "text-purple-500" },
        { id: "eco", name: "Conditions", icon: ClipboardList, color: "text-emerald-500" },
        { id: "ecms", name: "Measures", icon: LineChart, color: "text-orange-500" },
        { id: "appendices", name: "Appendices", icon: LineChart, color: "text-orange-500" },
      ]
    },
    ...(!publicView ? [{
      id: "utilities",
      name: "Utilities",
      icon: Database,
      color: "text-indigo-500",
      children: [
        { id: "photo-metadata", name: "Photo Metadata", icon: Database, color: "text-indigo-500" },
        { id: "energy-analysis", name: "Energy Analysis", icon: BarChart3, color: "text-orange-500" }
      ]
    }] : [])
  ];

  return (
    <TabbedMenu 
      items={menuItems} 
      publicView={publicView}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
};