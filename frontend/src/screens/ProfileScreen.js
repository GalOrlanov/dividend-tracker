import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Button, TextInput, Avatar, Divider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import authService from "../services/auth";
import { showMessage } from "react-native-flash-message";

const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
        name: userData.user?.name || "",
        email: userData.user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      showMessage({
        message: "Error",
        description: "Failed to load profile",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      showMessage({
        message: "Error",
        description: "Name is required",
        type: "danger",
      });
      return;
    }

    try {
      // TODO: Implement profile update API call
      showMessage({
        message: "Success",
        description: "Profile updated successfully",
        type: "success",
      });
      setEditing(false);
      await loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage({
        message: "Error",
        description: "Failed to update profile",
        type: "danger",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showMessage({
        message: "Error",
        description: "All password fields are required",
        type: "danger",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showMessage({
        message: "Error",
        description: "New passwords do not match",
        type: "danger",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      showMessage({
        message: "Error",
        description: "Password must be at least 6 characters",
        type: "danger",
      });
      return;
    }

    try {
      // TODO: Implement password change API call
      showMessage({
        message: "Success",
        description: "Password changed successfully",
        type: "success",
      });
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage({
        message: "Error",
        description: "Failed to change password",
        type: "danger",
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action cannot be undone. All your data will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // TODO: Implement account deletion
          showMessage({
            message: "Not Implemented",
            description: "Account deletion feature is not yet implemented",
            type: "info",
          });
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    card: {
      backgroundColor: colors.surface,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    profileHeader: {
      alignItems: "center",
      paddingVertical: 24,
    },
    avatar: {
      backgroundColor: colors.primary,
      marginBottom: 16,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.surface,
      marginBottom: 16,
    },
    inputLabel: {
      color: colors.text,
    },
    button: {
      marginBottom: 12,
    },
    dangerButton: {
      borderColor: colors.error,
      marginTop: 16,
    },
    dangerButtonText: {
      color: colors.error,
    },
    divider: {
      backgroundColor: colors.divider,
      marginVertical: 16,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 16,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text size={80} label={user?.name?.charAt(0)?.toUpperCase() || "U"} style={styles.avatar} />
            <Text style={styles.profileName}>{user?.name || "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email || "user@example.com"}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Stocks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>$2,450</Text>
              <Text style={styles.statLabel}>Annual Income</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3.2%</Text>
              <Text style={styles.statLabel}>Avg Yield</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Profile Information */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <Button mode="text" onPress={() => setEditing(!editing)} textColor={colors.primary}>
              {editing ? "Cancel" : "Edit"}
            </Button>
          </View>

          <TextInput
            label="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
            disabled={!editing}
            labelStyle={styles.inputLabel}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            style={styles.input}
            mode="outlined"
            disabled={!editing}
            keyboardType="email-address"
            labelStyle={styles.inputLabel}
          />

          {editing && (
            <Button mode="contained" onPress={handleSaveProfile} style={styles.button}>
              Save Changes
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Change Password */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <TextInput
            label="Current Password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            labelStyle={styles.inputLabel}
          />

          <TextInput
            label="New Password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            labelStyle={styles.inputLabel}
          />

          <TextInput
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            labelStyle={styles.inputLabel}
          />

          <Button mode="contained" onPress={handleChangePassword} style={styles.button}>
            Change Password
          </Button>
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Implement data export
              showMessage({
                message: "Coming Soon",
                description: "Data export feature will be available soon",
                type: "info",
              });
            }}
            style={styles.button}
            icon="download"
          >
            Export Data
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Implement data import
              showMessage({
                message: "Coming Soon",
                description: "Data import feature will be available soon",
                type: "info",
              });
            }}
            style={styles.button}
            icon="upload"
          >
            Import Data
          </Button>

          <Divider style={styles.divider} />

          <Button mode="outlined" onPress={handleDeleteAccount} style={styles.dangerButton} labelStyle={styles.dangerButtonText} icon="delete">
            Delete Account
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default ProfileScreen;
