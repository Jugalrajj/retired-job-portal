import { Navigate } from "react-router-dom";
import useAuthStore from "../context/useAuthStore";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  
  // If no user is logged in, redirect to the unified auth page
  if (!user) return <Navigate to="/auth" />; 
  
  return children;
};

export default ProtectedRoute;