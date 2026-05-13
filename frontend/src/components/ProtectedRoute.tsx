import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // 1. Si pas de token -> redirection login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si le rôle n'est pas autorisé -> redirection vers une page neutre ou login
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Si tout est ok -> on affiche la page demandée (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;