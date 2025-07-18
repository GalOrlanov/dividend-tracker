import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { Card, Title, Paragraph, Button, List, Divider, RadioButton, Text as PaperText } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { ThemeType } from "../config/theme";
import authService from "../services/auth";

const SettingsScreen = ({ navigation, route }) => {
  const { colors, isDark, themeType, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const onLogout = route.params?.onLogout;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  const handleThemeChange = (newThemeType) => {
    setTheme(newThemeType);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action cannot be undone. All your data will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // TODO: Implement account deletion
          Alert.alert("Not Implemented", "Account deletion feature is not yet implemented.");
        },
      },
    ]);
  };

  const handleExportData = () => {
    // TODO: Implement data export
    Alert.alert("Export Data", "Data export feature is not yet implemented.");
  };

  const handleImportData = () => {
    // TODO: Implement data import
    Alert.alert("Import Data", "Data import feature is not yet implemented.");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
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
    listItem: {
      backgroundColor: colors.surface,
    },
    listItemText: {
      color: colors.text,
    },
    listItemDescription: {
      color: colors.textSecondary,
    },
    radioButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    radioButtonText: {
      color: colors.text,
      marginLeft: 8,
      fontSize: 16,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    switchLabel: {
      color: colors.text,
      fontSize: 16,
    },
    dangerButton: {
      borderColor: colors.error,
    },
    dangerButtonText: {
      color: colors.error,
    },
    logoutButton: {
      marginTop: 16,
      borderColor: colors.error,
    },
    logoutButtonText: {
      color: colors.error,
    },
    versionText: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: 24,
      fontSize: 12,
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Theme</Title>
            <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>Choose your preferred theme</Paragraph>

            <RadioButton.Group onValueChange={handleThemeChange} value={themeType}>
              <View style={styles.radioButton}>
                <RadioButton value={ThemeType.LIGHT} color={colors.primary} />
                <Text style={styles.radioButtonText}>Light</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton value={ThemeType.DARK} color={colors.primary} />
                <Text style={styles.radioButtonText}>Dark</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton value={ThemeType.SYSTEM} color={colors.primary} />
                <Text style={styles.radioButtonText}>System</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Push Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textDisabled}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Dividend Reminders</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textDisabled}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Market Updates</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textDisabled}
              />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock" color={colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => navigation.navigate("Profile")}
              titleStyle={styles.listItemText}
              descriptionStyle={styles.listItemDescription}
            />
            <Divider style={{ backgroundColor: colors.divider }} />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Biometric Authentication</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={biometricEnabled ? colors.primary : colors.textDisabled}
              />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Export Data"
              description="Download your portfolio data"
              left={(props) => <List.Icon {...props} icon="download" color={colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={handleExportData}
              titleStyle={styles.listItemText}
              descriptionStyle={styles.listItemDescription}
            />
            <Divider style={{ backgroundColor: colors.divider }} />
            <List.Item
              title="Import Data"
              description="Import portfolio data from file"
              left={(props) => <List.Icon {...props} icon="upload" color={colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={handleImportData}
              titleStyle={styles.listItemText}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Profile"
              description="View and edit your profile"
              left={(props) => <List.Icon {...props} icon="account" color={colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => navigation.navigate("Profile")}
              titleStyle={styles.listItemText}
              descriptionStyle={styles.listItemDescription}
            />
            <Divider style={{ backgroundColor: colors.divider }} />
            <List.Item
              title="Delete Account"
              description="Permanently delete your account"
              left={(props) => <List.Icon {...props} icon="delete" color={colors.error} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={handleDeleteAccount}
              titleStyle={[styles.listItemText, { color: colors.error }]}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Logout Button */}
      <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton} labelStyle={styles.logoutButtonText} icon="logout">
        Logout
      </Button>

      {/* Version Info */}
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

export default SettingsScreen;
