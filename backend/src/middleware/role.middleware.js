// Check if user has the required primary role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
       return res.status(401).json({ message: "User role not found" });
    }

    // 1. Direct Match
    if (roles.includes(userRole)) {
      return next();
    }

    // 2. CRITICAL FIX: Allow 'recruiter' if 'employer' is in the allowed list
    if (userRole === 'recruiter' && roles.includes('employer')) {
      return next();
    }

    // 3. Deny Access
    return res.status(403).json({ 
      message: `Role (${userRole}) is not allowed to access this resource` 
    });
  };
};

// Check if an Employer/Team Member has specific permissions
export const checkPermission = (permission) => {
  return (req, res, next) => {
    // 1. Company Admins have ALL permissions automatically
    if (req.user.isCompanyAdmin) {
      return next();
    }

    // 2. Safety check: Ensure permissions array exists
    const userPermissions = req.user.permissions || [];

    // 3. Check if specific permission exists
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: "You do not have permission to perform this action" 
      });
    }
    next();
  };
};