import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
