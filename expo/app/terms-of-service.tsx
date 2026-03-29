import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../contexts/i18n";
import { CheckSquare, Square, AlertTriangle } from "lucide-react-native";

interface TermsOfServiceScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function TermsOfServiceScreen({ onAccept, onDecline }: TermsOfServiceScreenProps) {
  const { tosText, t, acceptTos } = useI18n();
  const [agreed, setAgreed] = useState<boolean>(false);

  const handleDecline = useCallback(() => {
    console.log("[ToS] User declined Terms of Service");
    Alert.alert(
      "Decline Terms",
      "You must agree to the Terms of Service to use this app. The app will now close.",
      [
        {
          text: "Go Back",
          style: "cancel",
        },
        {
          text: "Exit App",
          style: "destructive",
          onPress: () => {
            onDecline?.();
            BackHandler.exitApp();
          },
        },
      ]
    );
  }, [onDecline]);

  useEffect(() => {
    const handleBackPress = () => {
      handleDecline();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => backHandler.remove();
  }, [handleDecline]);

  const handleAccept = async () => {
    if (!agreed) {
      Alert.alert(
        t.termsOfService.title,
        "Please check the box to agree to the Terms of Service and Disclaimer.",
        [{ text: "OK" }]
      );
      return;
    }

    console.log("[ToS] User accepted Terms of Service");
    await acceptTos();
    onAccept?.();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <AlertTriangle size={40} color="#ef4444" />
        <Text style={styles.title}>{t.termsOfService.title}</Text>
        <Text style={styles.subtitle}>Please read carefully</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.textContainer}>
          <Text style={styles.tosText}>{tosText}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          {agreed ? (
            <CheckSquare size={28} color="#10b981" strokeWidth={2.5} />
          ) : (
            <Square size={28} color="#6b7280" strokeWidth={2} />
          )}
          <Text style={[styles.checkboxText, agreed && styles.checkboxTextAgreed]}>
            {t.termsOfService.agree}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, !agreed && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={!agreed}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.acceptButtonText, !agreed && styles.buttonTextDisabled]}>
              {t.termsOfService.continue}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.declineButtonText]}>
              {t.termsOfService.decline}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#1f2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6b7280",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  textContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tosText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
    fontFamily: "monospace",
  },
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
    lineHeight: 20,
  },
  checkboxTextAgreed: {
    color: "#065f46",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  declineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  acceptButtonText: {
    color: "#fff",
  },
  buttonTextDisabled: {
    color: "#9ca3af",
  },
  declineButtonText: {
    color: "#6b7280",
  },
});
