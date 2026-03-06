import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../context/useAuthStore';

const RequireAuth = ({ allowedRoles }) => {
  const { user, loading } = useAuthStore();

  if (loading) return <div>Loading...</div>;

  // 1. Check if user is logged in
  if (!user || !user.user) {
    return <Navigate to="/auth/seeker" replace />;
  } 

  const userRole = user.user.role;

  // 2. PERMISSION LOGIC FIX
  // We check if the user's role exists in allowedRoles.
  // CRITICAL FIX: If the route allows 'employer', we MUST also allow 'recruiter'.
  const isAuthorized = allowedRoles.some(role => {
    // Direct Match (e.g., seeker === seeker)
    if (role === userRole) return true;
    
    // Inheritance: Recruiter counts as Employer for routing purposes
    if (role === 'employer' && userRole === 'recruiter') return true;
    
    return false;
  });

  // 3. Redirect if not authorized
  if (allowedRoles && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;