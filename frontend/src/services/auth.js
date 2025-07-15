import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

class AuthService {
  // Store token in AsyncStorage
  async setToken(token) {
    await AsyncStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Get token from AsyncStorage
  async getToken() {
    return await AsyncStorage.getItem("token");
  }

  // Remove token from AsyncStorage
  async removeToken() {
    await AsyncStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      await this.removeToken();
      return false;
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        name,
      });

      if (response.data.token) {
        await this.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        await this.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  }

  // Google OAuth login
  async googleLogin(googleId, email, name, avatar) {
    try {
      const response = await api.post("/auth/google", {
        googleId,
        email,
        name,
        avatar,
      });

      if (response.data.token) {
        await this.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Google login failed" };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get user data" };
    }
  }

  // Update user profile
  async updateProfile(name, avatar) {
    try {
      const response = await api.put("/auth/profile", {
        name,
        avatar,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update profile" };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to change password" };
    }
  }

  // Logout
  async logout() {
    await this.removeToken();
  }
}

// Initialize auth service
const authService = new AuthService();

// Set up token in API headers if it exists (async)
const initializeAuth = async () => {
  const token = await authService.getToken();
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Initialize auth on module load
initializeAuth();

export default authService;
