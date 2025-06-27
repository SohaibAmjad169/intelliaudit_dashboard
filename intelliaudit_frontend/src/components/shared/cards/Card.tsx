import React from 'react';
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { cn } from '@/utils';

interface CardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  onClick,
}) => {
  return (
    <ShadcnCard 
      className={cn(
        onClick && "cursor-pointer hover:shadow-md transition-shadow", 
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      {children && (
        <CardContent className={contentClassName}>
          {children}
        </CardContent>
      )}
      {footer && (
        <CardFooter className={footerClassName}>
          {footer}
        </CardFooter>
      )}
    </ShadcnCard>
  );
}; 