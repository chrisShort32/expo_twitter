import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, Button, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

// For debugging AsyncStorage
const logAsyncStorageContent = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`${key}:`, value);
    }
  } catch (error) {
    console.error('Error logging AsyncStorage content:', error);
  }
};

export default function App() {
  const [userInfo, setUserInfo] = useState(null)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
      
  const config = {
    androidClientId: "147860164272-03ohggm1cdmhbdbsmf2sgpcjct437q3k.apps.googleusercontent.com",
    iosClientId: "147860164272-glutj0lulf23chdf7icsd237q2c679m0.apps.googleusercontent.com",
    webClientId: "147860164272-03ohggm1cdmhbdbsmf2sgpcjct437q3k.apps.googleusercontent.com",
  };
  
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    checkLocalUser();
    // Log AsyncStorage content for debugging
    logAsyncStorageContent();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      console.log("Google auth success response:", response);
      setToken(response.authentication.accessToken);
      getUserInfo(response.authentication.accessToken);
    }
  }, [response]);

  const checkLocalUser = async () => {
    try {
      console.log("Checking for local user...");
      const user = await getLocalUser();
      if (user) {
        console.log("Found local user:", user);
        setUserInfo(user);
      } else {
        console.log("No local user found");
      }
    } catch (error) {
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Attempting Google sign in...");
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error("Error signing in with Google:", error);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getLocalUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      console.log("Raw user data from AsyncStorage:", data);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const getUserInfo = async (token) => {
    // no token
    if (!token) {
      console.log("No token provided to getUserInfo");
      return;
    }

    // token
    try {
      console.log("Fetching user info with token");
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      
      if (!response.ok) {
        console.error("Google API response not OK:", response.status, response.statusText);
        return;
      }
      
      const user = await response.json();
      console.log("Received user info from Google:", user);
      
      // store user info in aysncstorage
      user.auth_type = "google"; // Add auth type for Google users
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  // New functions for email/password authentication

  // Validates email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Sign in with email and password
  const signInWithEmailPassword = async () => {
    console.log("Attempting email/password sign in with:", { email });
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!email || !password) {
        console.log("Missing email or password");
        Alert.alert("Error", "Please enter both email and password");
        return;
      }

      if (!isValidEmail(email)) {
        console.log("Invalid email format");
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      // Check if user exists in AsyncStorage (simulating a database)
      const storedUsers = await AsyncStorage.getItem("emailUsers");
      console.log("Retrieved emailUsers from AsyncStorage:", storedUsers);
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (users[email] && users[email].password === password) {
        // Successfully authenticated
        console.log("Authentication successful for:", email);
        const user = {
          name: users[email].name || email.split('@')[0],
          email: email,
          auth_type: "email"
        };
        
        console.log("Setting user data in AsyncStorage:", user);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        setUserInfo(user);
        setEmail('');
        setPassword('');
        
        Alert.alert("Success", "You have successfully signed in!");
      } else {
        console.log("Invalid credentials. Available users:", Object.keys(users));
        Alert.alert("Error", "Invalid email or password");
      }
    } catch (error) {
      console.error("Error signing in with email/password:", error);
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password (for demo purposes)
  const signUpWithEmailPassword = async () => {
    console.log("Attempting to sign up with:", { email });
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!email || !password) {
        console.log("Missing email or password for signup");
        Alert.alert("Error", "Please enter both email and password");
        return;
      }

      if (!isValidEmail(email)) {
        console.log("Invalid email format for signup");
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      if (password.length < 6) {
        console.log("Password too short for signup");
        Alert.alert("Error", "Password must be at least 6 characters long");
        return;
      }

      // Check if user already exists
      const storedUsers = await AsyncStorage.getItem("emailUsers");
      console.log("Retrieved emailUsers for signup:", storedUsers);
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (users[email]) {
        console.log("Email already registered:", email);
        Alert.alert("Error", "Email already registered. Please sign in.");
        return;
      }
      
      // Create new user
      users[email] = {
        password: password,
        name: email.split('@')[0] // Simple way to extract a name from email
      };
      
      console.log("Storing updated users in AsyncStorage:", users);
      await AsyncStorage.setItem("emailUsers", JSON.stringify(users));
      
      // Auto-login after signup
      const user = {
        name: users[email].name,
        email: email,
        auth_type: "email"
      };
      
      console.log("Setting new user in AsyncStorage for auto-login:", user);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
      setEmail('');
      setPassword('');
      
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password functionality
  const handleForgotPassword = () => {
    console.log("Showing password reset form");
    setShowResetForm(true);
  };

  const sendPasswordResetEmail = async () => {
    console.log("Attempting to reset password for:", resetEmail);
    try {
      setIsLoading(true);
      
      if (!resetEmail || !isValidEmail(resetEmail)) {
        console.log("Invalid reset email");
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      // Check if the user exists
      const storedUsers = await AsyncStorage.getItem("emailUsers");
      console.log("Retrieved emailUsers for password reset:", storedUsers);
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (!users[resetEmail]) {
        console.log("No account found for reset email:", resetEmail);
        Alert.alert("Error", "No account found with this email");
        return;
      }
      
      // In a real app, you would send a reset link or code via email
      // For demo purposes, we'll reset the password to a default value
      const newPassword = "resetpass";
      users[resetEmail].password = newPassword;
      
      console.log("Updating user password in AsyncStorage");
      await AsyncStorage.setItem("emailUsers", JSON.stringify(users));
      
      Alert.alert(
        "Password Reset", 
        `For demonstration purposes, your password has been reset to: ${newPassword}`
      );
      
      setShowResetForm(false);
      setResetEmail('');
    } catch (error) {
      console.error("Error resetting password:", error);
      Alert.alert("Error", "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      // clear asyncStorage
      await AsyncStorage.removeItem("user");
      setUserInfo(null);
      setEmail('');
      setPassword('');
      setResetEmail('');
      setShowResetForm(false);
    } catch (error) {
      console.error ("Error logging out:", error);
    }
  };

  // Print debug info
  console.log("Current state:", { 
    isUserLoggedIn: !!userInfo, 
    email, 
    password: password ? "***" : "", 
    isLoading, 
    showResetForm 
  });

  return (
    <View style={styles.container}>
      <Image source = {require("./assets/y_logo.png")} style={styles.image}></Image>

      {userInfo ? (
        <>
          <Text style={styles.welcomeText}>Welcome, {userInfo.name}</Text>
          <Text style={styles.emailText}>{userInfo.email}</Text>
          <Text style={styles.authTypeText}>
            Logged in via: {userInfo.auth_type === 'email' ? 'Email' : 'Google'}
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : showResetForm ? (
        // Password Reset Form
        <>
          <Text style={styles.titleText}>Reset Your Password</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.TextInput}
              placeholder="Enter your email"
              placeholderTextColor="#003f5c"
              onChangeText={(email) => setResetEmail(email)}
              value={resetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            /> 
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.loginButton} onPress={sendPasswordResetEmail} disabled={isLoading}>
              <Text style={styles.loginText}>{isLoading ? "Processing..." : "Reset Password"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowResetForm(false)}>
              <Text style={styles.cancelText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Login Form
        <>
        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email"
            placeholderTextColor="#003f5c"
            onChangeText={(email) => setEmail(email)}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          /> 
        </View>
        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Password"
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            value={password}
          />
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgot_button}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => {
              console.log("Login button pressed");
              signInWithEmailPassword();
            }} 
            disabled={isLoading}
          >
            <Text style={styles.loginText}>{isLoading ? "Processing..." : "Login"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={() => {
              console.log("Sign up button pressed");
              signUpWithEmailPassword();
            }} 
            disabled={isLoading}
          >
            <Text style={styles.signupText}>{isLoading ? "Processing..." : "Sign Up"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            console.log("Google sign in button pressed");
            signInWithGoogle();
          }}
          disabled={isLoading}
        >
          <Image source={require("./assets/google_icon.png")} style={styles.googleLogo}></Image>
          <Text style={styles.googleButtonText}>
            {isLoading ? "Processing..." : "Sign In with Google"}
          </Text>
        </TouchableOpacity>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  image :{
    marginBottom: 40,
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },

  inputView: {
    backgroundColor: "#FFC0CB",
    borderRadius: 25,
    width: 300,
    height: 50,
    marginBottom: 20,
    justifyContent: "center",
  },

  TextInput: {
    height: 50,
    flex: 1,
    padding: 10,
    marginLeft: 20,
    fontSize: 16,
  },

  forgot_button: {
    height: 30,
    marginBottom: 20,
    color: "#1DA1F2",
    fontWeight: "bold",
    textDecorationLine: "underline"
  },

  buttonContainer: {
    width: 300,
    marginVertical: 10,
  },

  loginButton: {
    width: "100%",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#1DA1F2",
  },
  
  loginText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18
  },

  signupButton: {
    width: "100%",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    backgroundColor: "#14171A",
  },
  
  signupText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#14171A",
  },

  emailText: {
    fontSize: 16,
    marginBottom: 20,
    color: "#657786",
  },

  authTypeText: {
    fontSize: 14,
    marginBottom: 20,
    color: "#AAB8C2",
  },

  logoutButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#1DA1F2",
    borderRadius: 25,
    width: 200,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#AAB8C2",
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    width: 300,
    height: 50,
  },

  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },

  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },

  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#657786',
    marginVertical: 10,
  },

  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#14171A',
  },
});
