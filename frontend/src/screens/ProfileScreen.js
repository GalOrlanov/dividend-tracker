import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Card, Title, Paragraph, TextInput, Button, Avatar, Divider, List } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import authService from "../services/auth";
import { showMessage } from "react-native-flash-message";

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData.user);
      setFormData({
        name: userData.user.name || "",
        email: userData.user.email || "",
        avatar: userData.user.avatar || "",
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      showMessage({
        message: "Error",
        description: "Failed to load profile data",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.name.trim()) {
        showMessage({
          message: "Error",
          description: "Name is required",
          type: "danger",
        });
        return;
      }

      await authService.updateProfile(formData.name, formData.avatar);
      setEditing(false);
      await loadUserProfile(); // Reload to get updated data

      showMessage({
        message: "Success",
        description: "Profile updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage({
        message: "Error",
        description: error.message || "Failed to update profile",
        type: "danger",
      });
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showMessage({
          message: "Error",
          description: "All password fields are required",
          type: "danger",
        });
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showMessage({
          message: "Error",
          description: "New passwords do not match",
          type: "danger",
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showMessage({
          message: "Error",
          description: "New password must be at least 6 characters",
          type: "danger",
        });
        return;
      }

      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showMessage({
        message: "Success",
        description: "Password changed successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage({
        message: "Error",
        description: error.message || "Failed to change password",
        type: "danger",
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          showMessage({
            message: "Coming Soon",
            description: "Account deletion will be available in the next update",
            type: "info",
          });
        },
      },
    ]);
  };

  const renderProfileHeader = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={user?.name?.charAt(0)?.toUpperCase() || "U"} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Title style={styles.profileName}>{user?.name || "User"}</Title>
            <Paragraph style={styles.profileEmail}>{user?.email || "user@example.com"}</Paragraph>
            <Paragraph style={styles.profileDate}>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderProfileForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Profile Information</Title>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <MaterialIcons name={editing ? "close" : "edit"} size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        <TextInput label="Name" value={formData.name} onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))} disabled={!editing} style={styles.input} mode="outlined" />

        <TextInput
          label="Email"
          value={formData.email}
          disabled={true} // Email cannot be changed
          style={styles.input}
          mode="outlined"
        />

        {editing && (
          <View style={styles.editButtons}>
            <Button mode="outlined" onPress={() => setEditing(false)} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSaveProfile} style={styles.saveButton}>
              Save Changes
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderPasswordSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Change Password</Title>

        <TextInput
          label="Current Password"
          value={passwordData.currentPassword}
          onChangeText={(text) => setPasswordData((prev) => ({ ...prev, currentPassword: text }))}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="New Password"
          value={passwordData.newPassword}
          onChangeText={(text) => setPasswordData((prev) => ({ ...prev, newPassword: text }))}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Confirm New Password"
          value={passwordData.confirmPassword}
          onChangeText={(text) => setPasswordData((prev) => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        <Button mode="contained" onPress={handleChangePassword} style={styles.changePasswordButton}>
          Change Password
        </Button>
      </Card.Content>
    </Card>
  );

  const renderAccountStats = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Account Statistics</Title>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.portfolioCount || 0}</Text>
            <Text style={styles.statLabel}>Stocks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.dividendCount || 0}</Text>
            <Text style={styles.statLabel}>Dividends</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "N/A"}</Text>
            <Text style={styles.statLabel}>Last Login</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAccountActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Account Actions</Title>

        <List.Item
          title="Export My Data"
          description="Download all your portfolio and dividend data"
          left={(props) => <List.Icon {...props} icon="download" />}
          onPress={() => {
            showMessage({
              message: "Coming Soon",
              description: "Data export will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Delete Account"
          description="Permanently delete your account and all data"
          left={(props) => <List.Icon {...props} icon="delete" color="#d32f2f" />}
          onPress={handleDeleteAccount}
        />
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderProfileHeader()}
      {renderProfileForm()}
      {renderPasswordSection()}
      {renderAccountStats()}
      {renderAccountActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#2196F3",
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  profileDate: {
    fontSize: 14,
    color: "#999",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  changePasswordButton: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

export default ProfileScreen;
