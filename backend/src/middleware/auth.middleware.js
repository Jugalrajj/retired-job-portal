import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// =========================================================
// 1. PROTECT - Verifies JWT and Populates req.user
// =========================================================
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token ID
      // 🔥 UPDATED: Populate 'parentUser' so we can check the Main Employer's subscription later
      req.user = await User.findById(decoded.id)
        .select("-password")
        .populate("parentUser");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// =========================================================
// 2. AUTHORIZE - Role-Based Access Control (RBAC)
// =========================================================
// Usage: router.get('/admin-only', protect, authorize('admin'), controller)
// Usage: router.get('/shared', protect, authorize('admin', 'employer'), controller)
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

// =========================================================
// 3. CHECK PERMISSION - Granular Team Permissions
// =========================================================
// Usage: router.post('/post-job', protect, authorize('employer'), checkPermission('post_jobs'), postJob)
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;

    // 1. Super Admins bypass all checks
    if (user.role === 'admin') {
      return next();
    }

    // 2. Company Owners (Main Employer Account) have all permissions by default
    if (user.isCompanyAdmin) {
      return next();
    }

    // 3. Check if the team member has the specific permission
    if (user.permissions && user.permissions.includes(requiredPermission)) {
      return next();
    }

    // 4. If none of the above, deny access
    return res.status(403).json({ 
      message: "You do not have the required permission to perform this action." 
    });
  };
};

// =========================================================
// 4. CHECK SUBSCRIPTION - Shared Access Logic
// =========================================================
// This middleware ensures that either the user OR their parent has a valid plan.
// Usage: router.get('/talent-pool', protect, checkSubscription, checkPermission('view_talent_pool'), getTalentPool)
export const checkSubscription = (req, res, next) => {
  const user = req.user;

  // 1. Identify the Subscription Holder
  // If I have a parentUser, use their data. Otherwise, use my data.
  const accountHolder = user.parentUser ? user.parentUser : user;

  // 2. Check Plan Status
  // (Assuming 'free' users might be restricted from certain premium routes)
  // You can customize the plans allowed here (e.g., must be 'pro' or 'enterprise')
  const validPlans = ["starter", "pro", "enterprise"];
  
  if (accountHolder.plan && validPlans.includes(accountHolder.plan)) {
    // Also check expiry if you have logic for that
    if (accountHolder.subscriptionExpiry && new Date(accountHolder.subscriptionExpiry) < new Date()) {
       return res.status(403).json({ message: "Subscription has expired." });
    }
    return next();
  }

  // If you want to allow free users but just restrict specific actions, handle that inside the controller.
  // Otherwise, return 403 here for premium-only routes.
  return res.status(403).json({ 
    message: "This feature requires an active subscription." 
  });
};

// =========================================================
// 5. ADMIN - Specific Middleware for Admin Access
// =========================================================
// Usage: router.post('/category', protect, admin, createCategory)
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};