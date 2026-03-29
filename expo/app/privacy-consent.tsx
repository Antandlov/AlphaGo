import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, Check } from "lucide-react-native";
import { useState } from "react";

interface PrivacyConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function PrivacyConsentScreen({ onAccept, onDecline }: PrivacyConsentProps) {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);

  const handleAccept = () => {
    console.log("[PrivacyConsent] User accepted consent with analytics:", analyticsConsent, "location:", locationConsent);
    onAccept();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        testID="privacy-consent-scroll"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#10b981" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.subtitle}>
            We respect your privacy and comply with GDPR and CCPA regulations
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What We Collect</Text>
            <Text style={styles.sectionText}>
              • <Text style={styles.bold}>Allergy Profiles:</Text> Stored securely on your device using encryption
              {"\n"}• <Text style={styles.bold}>Scan History:</Text> Saved locally on your device only
              {"\n"}• <Text style={styles.bold}>Camera Access:</Text> Only used for scanning ingredient labels
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What We Do Not Collect</Text>
            <Text style={styles.sectionText}>
              ✓ No personal health information sent to cloud servers
              {"\n"}✓ No user tracking or profiling
              {"\n"}✓ No sale of your data to third parties
              {"\n"}✓ No unnecessary permissions
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.optionalTitle}>Optional Data Collection (You Choose)</Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAnalyticsConsent(!analyticsConsent)}
            activeOpacity={0.7}
            testID="analytics-consent-checkbox"
            accessibilityLabel="Analytics consent checkbox"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: analyticsConsent }}
          >
            <View style={[styles.checkbox, analyticsConsent && styles.checkboxChecked]}>
              {analyticsConsent && <Check size={16} color="#fff" strokeWidth={3} />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Anonymous Usage Analytics</Text>
              <Text style={styles.checkboxDescription}>
                Help us improve the app by sharing anonymous usage data (crash reports, feature usage). No personal information.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setLocationConsent(!locationConsent)}
            activeOpacity={0.7}
            testID="location-consent-checkbox"
            accessibilityLabel="Location consent checkbox"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: locationConsent }}
          >
            <View style={[styles.checkbox, locationConsent && styles.checkboxChecked]}>
              {locationConsent && <Check size={16} color="#fff" strokeWidth={3} />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Location Data (Anonymized)</Text>
              <Text style={styles.checkboxDescription}>
                Help identify regional allergen trends. Only city-level data is collected and anonymized (hashed).
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Your Rights:</Text> You can change these preferences anytime in Settings. You have the right to access, export, or delete your data at any time.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
            testID="accept-privacy-button"
            accessibilityLabel="Accept and continue"
            accessibilityRole="button"
          >
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={onDecline}
            activeOpacity={0.7}
            testID="decline-privacy-button"
            accessibilityLabel="Decline"
            accessibilityRole="button"
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#065f46",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  content: {
    gap: 24,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
  bold: {
    fontWeight: "600" as const,
    color: "#065f46",
  },
  divider: {
    height: 1,
    backgroundColor: "#d1fae5",
    marginVertical: 8,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#d1fae5",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#065f46",
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  footer: {
    marginTop: 32,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: "#10b981",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  footerNote: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
});
