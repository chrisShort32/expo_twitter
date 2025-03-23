import AsyncStorage from '@react-native-async-storage/async-storage';

// Simulate API requests with AsyncStorage
// In a real app, these would be HTTP requests to your backend

/**
 * Login a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User data or error
 */
export const loginUser = async (email, password) => {
  try {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get users from "database"
    const storedUsers = await AsyncStorage.getItem("emailUsers");
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    
    // Check if credentials are valid
    if (users[email] && users[email].password === password) {
      // Create user session
      const userData = {
        id: users[email].id || Date.now().toString(),
        name: users[email].name || email.split('@')[0],
        email: email,
        auth_type: "email",
        token: `token-${Date.now()}`, // Simulate JWT token
      };
      
      // Store user session
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      
      return { success: true, user: userData };
    }
    
    return { 
      success: false, 
      error: "Invalid email or password" 
    };
  } catch (error) {
    console.error("Login API error:", error);
    return { 
      success: false, 
      error: "An error occurred during login" 
    };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - New user data or error
 */
export const registerUser = async (userData) => {
  try {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { email, password, name } = userData;
    
    // Get existing users
    const storedUsers = await AsyncStorage.getItem("emailUsers");
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    
    // Check if user already exists
    if (users[email]) {
      return { 
        success: false, 
        error: "Email already registered" 
      };
    }
    
    // Create new user
    const userId = Date.now().toString();
    users[email] = {
      id: userId,
      password,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    };
    
    // Save to "database"
    await AsyncStorage.setItem("emailUsers", JSON.stringify(users));
    
    // Create session for new user
    const newUserData = {
      id: userId,
      name: users[email].name,
      email,
      auth_type: "email",
      token: `token-${Date.now()}`, // Simulate JWT token
    };
    
    // Store user session
    await AsyncStorage.setItem("user", JSON.stringify(newUserData));
    
    return { success: true, user: newUserData };
  } catch (error) {
    console.error("Registration API error:", error);
    return { 
      success: false, 
      error: "An error occurred during registration" 
    };
  }
};

/**
 * Reset a user's password
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Success or error message
 */
export const resetPassword = async (email) => {
  try {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get users from "database"
    const storedUsers = await AsyncStorage.getItem("emailUsers");
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    
    // Check if email exists
    if (!users[email]) {
      return { 
        success: false, 
        error: "No account found with this email" 
      };
    }
    
    // In a real app, we would send an email with a reset link
    // For demo purposes, we'll reset the password to a default value
    const newPassword = "resetpass";
    users[email].password = newPassword;
    
    // Save to "database"
    await AsyncStorage.setItem("emailUsers", JSON.stringify(users));
    
    return { 
      success: true, 
      message: `Password has been reset to: ${newPassword}` 
    };
  } catch (error) {
    console.error("Password reset API error:", error);
    return { 
      success: false, 
      error: "An error occurred during password reset" 
    };
  }
};

/**
 * Log out the current user
 * @returns {Promise<Object>} - Success or error message
 */
export const logoutUser = async () => {
  try {
    // Clear user session
    await AsyncStorage.removeItem("user");
    
    return { success: true };
  } catch (error) {
    console.error("Logout API error:", error);
    return { 
      success: false, 
      error: "An error occurred during logout" 
    };
  }
};

/**
 * Get the current logged in user
 * @returns {Promise<Object>} - User data or null
 */
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

/**
 * Verify if a user's auth token is valid
 * @param {string} token - Auth token
 * @returns {Promise<boolean>} - Token validity
 */
export const verifyToken = async (token) => {
  try {
    // In a real app, this would validate the token with your backend
    // For demo purposes, we'll just check if there's a user session
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return false;
    
    const user = JSON.parse(userData);
    return user.token === token;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}; 