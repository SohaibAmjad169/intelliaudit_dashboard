import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb as BreadcrumbPrimitive,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/utils';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  /** The label to display */
  label: string;
  /** The URL to navigate to */
  href?: string;
  /** Whether this is the current page */
  isCurrent?: boolean;
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  /** The items to display in the breadcrumb */
  items: BreadcrumbItem[];
  /** Additional class name for the breadcrumb */
  className?: string;
  /** Custom separator between items */
  separator?: React.ReactNode;
}

/**
 * Breadcrumb component for navigation
 * 
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Product Details', isCurrent: true },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
}: BreadcrumbProps) {
  return (
    <BreadcrumbPrimitive className={cn('', className)}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.isCurrent ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {item.icon}
                  {item.label}
                </BreadcrumbPage>
              ) : item.href ? (
                <BreadcrumbLink asChild className="flex items-center gap-1">
                  <Link to={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink className="flex items-center gap-1">
                  {item.icon}
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbPrimitive>
  );
} 