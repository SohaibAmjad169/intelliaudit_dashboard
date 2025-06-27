import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

interface NavigationProps {
  currentPath: string;
}

export const MainNavigation = ({ currentPath }: NavigationProps) => {
  const navigationItems = [
    {
      to: '/projects',
      icon: LayoutDashboard,
      label: 'Projects',
    }
  ];

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const isActive = currentPath === item.to || 
          (item.to !== '/projects' && currentPath.startsWith(item.to));
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${
              isActive 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}; 