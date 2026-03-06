import User from "../models/User.model.js";

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.bio = req.body.bio || user.bio;

      if (req.file) {
        user.photoUrl = req.file.path.replace(/\\/g, "/");
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          role: updatedUser.role,
          photoUrl: updatedUser.photoUrl,
          preferences: updatedUser.preferences,
          companyId: updatedUser.companyId,
          isCompanyAdmin: updatedUser.isCompanyAdmin
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Change Password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Set new password (pre-save hook in User model will hash it automatically)
    user.password = newPassword;

    // --- REMOVED THE INVALID 'jobseeker' FIX ---
    
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update Notification Preferences
// @route   PUT /api/users/preferences
// @access  Private
export const updateUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Get new preferences
      const newPrefs = req.body.preferences || {};
      
      // 2. Initialize if missing
      if (!user.preferences) user.preferences = {};

      // 3. Update specific fields
      if (newPrefs.emailAlerts !== undefined) {
          user.preferences.emailAlerts = newPrefs.emailAlerts;
      }
      if (newPrefs.smsAlerts !== undefined) {
          user.preferences.smsAlerts = newPrefs.smsAlerts;
      }

      // 4. Force Mongoose to acknowledge the change
      user.markModified('preferences');

      // --- REMOVED THE INVALID 'jobseeker' FIX ---

      const updatedUser = await user.save();

      res.json({
        success: true,
        preferences: updatedUser.preferences
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};