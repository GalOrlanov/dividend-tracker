import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Card, Title, Text, HelperText, ActivityIndicator } from "react-native-paper";
import DatePicker from "react-native-date-picker";
import { dividendAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";

const AddDividendScreen = ({ navigation, route }) => {
  const editingDividend = route.params?.dividend;
  const stockData = route.params?.stock;

  const [formData, setFormData] = useState({
    symbol: "",
    companyName: "",
    shares: "",
    dividendPerShare: "",
    exDate: new Date(),
    paymentDate: new Date(),
    frequency: "quarterly",
    sector: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showExDatePicker, setShowExDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  useEffect(() => {
    if (editingDividend) {
      setFormData({
        symbol: editingDividend.symbol || "",
        companyName: editingDividend.companyName || "",
        shares: editingDividend.shares?.toString() || "",
        dividendPerShare: editingDividend.dividendPerShare?.toString() || "",
        exDate: new Date(editingDividend.exDate) || new Date(),
        paymentDate: new Date(editingDividend.paymentDate) || new Date(),
        frequency: editingDividend.frequency || "quarterly",
        sector: editingDividend.sector || "",
        notes: editingDividend.notes || "",
      });
    } else if (stockData) {
      setFormData((prev) => ({
        ...prev,
        symbol: stockData.symbol || "",
        companyName: stockData.companyName || "",
        dividendPerShare: stockData.dividendPerShare?.toString() || "",
        frequency: stockData.frequency || "quarterly",
        sector: stockData.sector || "",
      }));
    }
  }, [editingDividend, stockData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.shares || parseFloat(formData.shares) <= 0) {
      newErrors.shares = "Shares must be greater than 0";
    }

    if (!formData.dividendPerShare || parseFloat(formData.dividendPerShare) <= 0) {
      newErrors.dividendPerShare = "Dividend per share must be greater than 0";
    }

    if (formData.exDate >= formData.paymentDate) {
      newErrors.paymentDate = "Payment date must be after ex-dividend date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const dividendData = {
        ...formData,
        shares: parseFloat(formData.shares),
        dividendPerShare: parseFloat(formData.dividendPerShare),
        exDate: formData.exDate.toISOString(),
        paymentDate: formData.paymentDate.toISOString(),
      };

      if (editingDividend) {
        await dividendAPI.updateDividend(editingDividend._id, dividendData);
        showMessage({
          message: "Success",
          description: "Dividend updated successfully",
          type: "success",
        });
      } else {
        await dividendAPI.createDividend(dividendData);
        showMessage({
          message: "Success",
          description: "Dividend added successfully",
          type: "success",
        });
      }

      navigation.goBack();
    } catch (error) {
      showMessage({
        message: "Error",
        description: error.response?.data?.error || "Failed to save dividend",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingDividend) return;

    Alert.alert("Delete Dividend", `Are you sure you want to delete the dividend for ${editingDividend.symbol}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await dividendAPI.deleteDividend(editingDividend._id);
            showMessage({
              message: "Success",
              description: "Dividend deleted successfully",
              type: "success",
            });
            navigation.goBack();
          } catch (error) {
            showMessage({
              message: "Error",
              description: "Failed to delete dividend",
              type: "danger",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const calculateTotal = () => {
    const shares = parseFloat(formData.shares) || 0;
    const dividendPerShare = parseFloat(formData.dividendPerShare) || 0;
    return (shares * dividendPerShare).toFixed(2);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{editingDividend ? "Edit Dividend" : "Add New Dividend"}</Title>

          {/* Symbol */}
          <TextInput
            label="Stock Symbol"
            value={formData.symbol}
            onChangeText={(text) => setFormData({ ...formData, symbol: text.toUpperCase() })}
            style={styles.input}
            error={!!errors.symbol}
            disabled={loading}
          />
          {errors.symbol && <HelperText type="error">{errors.symbol}</HelperText>}

          {/* Company Name */}
          <TextInput
            label="Company Name"
            value={formData.companyName}
            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            style={styles.input}
            error={!!errors.companyName}
            disabled={loading}
          />
          {errors.companyName && <HelperText type="error">{errors.companyName}</HelperText>}

          {/* Shares */}
          <TextInput
            label="Number of Shares"
            value={formData.shares}
            onChangeText={(text) => setFormData({ ...formData, shares: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.shares}
            disabled={loading}
          />
          {errors.shares && <HelperText type="error">{errors.shares}</HelperText>}

          {/* Dividend Per Share */}
          <TextInput
            label="Dividend Per Share ($)"
            value={formData.dividendPerShare}
            onChangeText={(text) => setFormData({ ...formData, dividendPerShare: text })}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.dividendPerShare}
            disabled={loading}
          />
          {errors.dividendPerShare && <HelperText type="error">{errors.dividendPerShare}</HelperText>}

          {/* Total Dividend Display */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Dividend:</Text>
            <Text style={styles.totalAmount}>${calculateTotal()}</Text>
          </View>

          {/* Ex-Dividend Date */}
          <Button mode="outlined" onPress={() => setShowExDatePicker(true)} style={styles.dateButton} disabled={loading}>
            Ex-Dividend Date: {formData.exDate.toLocaleDateString()}
          </Button>

          {/* Payment Date */}
          <Button mode="outlined" onPress={() => setShowPaymentDatePicker(true)} style={styles.dateButton} disabled={loading} error={!!errors.paymentDate}>
            Payment Date: {formData.paymentDate.toLocaleDateString()}
          </Button>
          {errors.paymentDate && <HelperText type="error">{errors.paymentDate}</HelperText>}

          {/* Frequency */}
          <TextInput label="Frequency" value={formData.frequency} onChangeText={(text) => setFormData({ ...formData, frequency: text })} style={styles.input} disabled={loading} />

          {/* Sector */}
          <TextInput label="Sector (Optional)" value={formData.sector} onChangeText={(text) => setFormData({ ...formData, sector: text })} style={styles.input} disabled={loading} />

          {/* Notes */}
          <TextInput
            label="Notes (Optional)"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            style={styles.input}
            multiline
            numberOfLines={3}
            disabled={loading}
          />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={handleSubmit} style={styles.submitButton} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : editingDividend ? "Update Dividend" : "Add Dividend"}
            </Button>

            {editingDividend && (
              <Button mode="outlined" onPress={handleDelete} style={styles.deleteButton} disabled={loading} textColor="#F44336">
                Delete
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showExDatePicker}
        date={formData.exDate}
        mode="date"
        onConfirm={(date) => {
          setFormData({ ...formData, exDate: date });
          setShowExDatePicker(false);
        }}
        onCancel={() => setShowExDatePicker(false)}
      />

      <DatePicker
        modal
        open={showPaymentDatePicker}
        date={formData.paymentDate}
        mode="date"
        onConfirm={(date) => {
          setFormData({ ...formData, paymentDate: date });
          setShowPaymentDatePicker(false);
        }}
        onCancel={() => setShowPaymentDatePicker(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1976D2",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
  },
  dateButton: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
  },
  submitButton: {
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: "#F44336",
  },
});

export default AddDividendScreen;
