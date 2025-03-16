import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, Button } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [userInfo, setUserInfo] = useState(null)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
      
  const config = {
    androidClientId: "147860164272-03ohggm1cdmhbdbsmf2sgpcjct437q3k.apps.googleusercontent.com",
    iosClientId: "147860164272-glutj0lulf23chdf7icsd237q2c679m0.apps.googleusercontent.com",
    webClientId: "147860164272-03ohggm1cdmhbdbsmf2sgpcjct437q3k.apps.googleusercontent.com",
  };
  
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    signInWithGoogle();
  }, [response, token]);

  const signInWithGoogle = async () => {
    try {
      // try to get user info from aysncstorage
      const user = await getLocalUser();
      if (!user) {
        if (response?.type === "success") {
          setToken(response.authentication.accessToken);
          getUserInfo(response.authentication.accessToken);
        }
      } else {
        setUserInfo(user);
      } 
    } catch (error) {
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };
  
  const getLocalUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (!data) return null;
    return JSON.parse(data);
  };

  const getUserInfo = async (token) => {
    // no token
    if (!token) return;

    // token
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      const user = await response.json();
      // store user info in aysncstorage
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error(
        "Failed to fetch user data:",
        response.status,
        response.statusText
      );
    }
    
  };



  const logout = async () => {
    try {
      // clear asyncStorage
      await AsyncStorage.removeItem("user");
      setUserInfo(null);
    } catch (error) {
      console.error ("Error logging out:", error);
    }
  };

  console.log(JSON.stringify(userInfo));
  
  return (
    <View style={styles.container}>
      <Image source = {require("./assets/y_logo.png")} style={styles.image}></Image>

      {userInfo ? (
        <>
          <Text style={styles.welcomeText}>Welcome, {userInfo.name}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email     "
            placeholderTextColor="#003f5c"
            onChangeText={(email) => setEmail(email)}
          /> 
        </View>
        <View style={styles.inputView}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
        </View>

        <TouchableOpacity>
          <Text style={styles.forgot_button}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Login</Text>
       </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
        >
          <Image source={require("./assets/google_icon.png")}></Image>
          <Text style={styles.googleButtonText}>Sign In with Google</Text>
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
  },

  image :{
    marginBottom: 40

  },

  inputView: {
    backgroundColor: "#FFC0CB",
    borderRadius: 25,
    width: 300,
    height: 40,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",

  },

  TextInput: {
    height: 40,
    flex: 1,
    padding: 10,
    marginLeft: 20

  },

  forgot_button: {
    height: 30,
    marginBottom: 30,
    textDecorationLine: "underline"

  },

  loginButton: {
    width: 300,
    borderRadius: 25,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    backgroundColor: "#FF1493"

  },
  
  loginText: {
    fontWeight: "bold",
    fontSize: 18
  },

  welcomeText: {
    fontSize: 20,
    marginBottom: 20,
  },

  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#FF1493",
    borderRadius: 25,
  },

  logoutText: {
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
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    width: 300,
    height: 40,
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

});
