import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

const CLIENT_ID = "338573289308-ovqmoo12skk745rplp1vplk3q1cdunsn.apps.googleusercontent.com";
// Use the backend OAuth redirect URL instead of Expo proxy
const REDIRECT_URI = `${API_BASE_URL}/api/auth/google/callback`;

class GoogleAuthService {
  static async signIn() {
    try {
      // Use the backend OAuth flow
      const authUrl = `${API_BASE_URL}/api/auth/google`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type !== "success" || !result.url) {
        return { success: false, error: "Google Sign-In cancelled or failed." };
      }

      // Parse the URL to get the token and user data
      const url = new URL(result.url);
      const token = url.searchParams.get("token");
      const userData = url.searchParams.get("user");

      if (!token || !userData) {
        return { success: false, error: "No authentication data received." };
      }

      // Decode the user data
      const user = JSON.parse(decodeURIComponent(userData));

      // Store the authentication data
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      return {
        success: true,
        user: user,
        accessToken: token,
      };
    } catch (error) {
      console.error("Google Sign-In error:", error);
      return { success: false, error: error.message };
    }
  }

  static async signOut() {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async isSignedIn() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return false;
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}

export default GoogleAuthService;
