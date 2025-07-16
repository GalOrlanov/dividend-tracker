import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { Card, Title, Paragraph, List, Divider, Button, Avatar, IconButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import authService from "../services/auth";
import { showMessage } from "react-native-flash-message";

const SettingsScreen = ({ navigation, route }) => {
  const { onLogout } = route.params || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoRefresh: true,
    showDividendAlerts: true,
    showPriceAlerts: true,
    currency: "USD",
    language: "English",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData.user);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  const renderProfileSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <TouchableOpacity onPress={navigateToProfile} style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Avatar.Text size={60} label={user?.name?.charAt(0)?.toUpperCase() || "U"} style={styles.avatar} />
            <View style={styles.profileText}>
              <Title style={styles.profileName}>{user?.name || "User"}</Title>
              <Paragraph style={styles.profileEmail}>{user?.email || "user@example.com"}</Paragraph>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Notifications</Title>
        <List.Item
          title="Push Notifications"
          description="Receive notifications about dividends and updates"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting("notifications")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.notifications ? "#2196F3" : "#f4f3f4"}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Dividend Alerts"
          description="Get notified about upcoming dividend payments"
          left={(props) => <List.Icon {...props} icon="cash-multiple" />}
          right={() => (
            <Switch
              value={settings.showDividendAlerts}
              onValueChange={() => toggleSetting("showDividendAlerts")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.showDividendAlerts ? "#2196F3" : "#f4f3f4"}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Price Alerts"
          description="Get notified about significant price changes"
          left={(props) => <List.Icon {...props} icon="trending-up" />}
          right={() => (
            <Switch
              value={settings.showPriceAlerts}
              onValueChange={() => toggleSetting("showPriceAlerts")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.showPriceAlerts ? "#2196F3" : "#f4f3f4"}
            />
          )}
        />
      </Card.Content>
    </Card>
  );

  const renderAppSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>App Settings</Title>
        <List.Item
          title="Dark Mode"
          description="Use dark theme for the app"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={settings.darkMode}
              onValueChange={() => toggleSetting("darkMode")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.darkMode ? "#2196F3" : "#f4f3f4"}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Auto Refresh"
          description="Automatically refresh portfolio data"
          left={(props) => <List.Icon {...props} icon="refresh" />}
          right={() => (
            <Switch
              value={settings.autoRefresh}
              onValueChange={() => toggleSetting("autoRefresh")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.autoRefresh ? "#2196F3" : "#f4f3f4"}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Currency"
          description={settings.currency}
          left={(props) => <List.Icon {...props} icon="currency-usd" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Implement currency selection
            showMessage({
              message: "Coming Soon",
              description: "Currency selection will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Language"
          description={settings.language}
          left={(props) => <List.Icon {...props} icon="translate" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Implement language selection
            showMessage({
              message: "Coming Soon",
              description: "Language selection will be available in the next update",
              type: "info",
            });
          }}
        />
      </Card.Content>
    </Card>
  );

  const renderDataSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Data & Privacy</Title>
        <List.Item
          title="Export Data"
          description="Download your portfolio data"
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
          title="Backup Settings"
          description="Backup your app settings and preferences"
          left={(props) => <List.Icon {...props} icon="cloud-upload" />}
          onPress={() => {
            showMessage({
              message: "Coming Soon",
              description: "Backup functionality will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {
            showMessage({
              message: "Privacy Policy",
              description: "Privacy policy will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          description="Read our terms of service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          onPress={() => {
            showMessage({
              message: "Terms of Service",
              description: "Terms of service will be available in the next update",
              type: "info",
            });
          }}
        />
      </Card.Content>
    </Card>
  );

  const renderSupportSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Support</Title>
        <List.Item
          title="Help & FAQ"
          description="Get help and find answers to common questions"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          onPress={() => {
            showMessage({
              message: "Coming Soon",
              description: "Help section will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Contact Support"
          description="Get in touch with our support team"
          left={(props) => <List.Icon {...props} icon="message" />}
          onPress={() => {
            showMessage({
              message: "Coming Soon",
              description: "Contact support will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="Rate App"
          description="Rate us on the App Store"
          left={(props) => <List.Icon {...props} icon="star" />}
          onPress={() => {
            showMessage({
              message: "Coming Soon",
              description: "App rating will be available in the next update",
              type: "info",
            });
          }}
        />
        <Divider />
        <List.Item
          title="About"
          description="App version and information"
          left={(props) => <List.Icon {...props} icon="information" />}
          onPress={() => {
            Alert.alert(
              "About Dividend Tracker",
              "Version 1.0.2\n\nA comprehensive dividend tracking app to help you manage your investment portfolio and track dividend income.\n\n© 2025 Dividend Tracker"
            );
          }}
        />
      </Card.Content>
    </Card>
  );

  const renderLogoutSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton} textColor="#d32f2f" buttonColor="transparent">
          Logout
        </Button>
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
      {renderProfileSection()}
      {renderNotificationSettings()}
      {renderAppSettings()}
      {renderDataSettings()}
      {renderSupportSection()}
      {renderLogoutSection()}
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    backgroundColor: "#2196F3",
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logoutButton: {
    borderColor: "#d32f2f",
    marginTop: 8,
  },
});

export default SettingsScreen;
