import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Globe, FileText, HelpCircle, Info, Sparkles, ChevronRight, X } from "lucide-react-native";
import { useI18n } from "../contexts/i18n";
import { LANGUAGES } from "../types/i18n";

export default function SettingsScreen() {
  const router = useRouter();
  const { language, t } = useI18n();

  const currentLanguage = LANGUAGES.find((lang) => lang.code === language);

  const handleLanguageChange = () => {
    router.push("/language-selection");
  };

  const handleViewTerms = () => {
    router.push("/terms-of-service");
  };

  const handleHowToUse = () => {
    router.push("/how-to-use");
  };

  const handleBetaProgram = () => {
    router.push("/beta-info");
  };

  const handleAbout = () => {
    Alert.alert(
      "About AlphaGo",
      "AlphaGo is an allergen and ingredient scanner app designed to help people with Alpha-Gal Syndrome and other allergies stay safe.\n\nVersion: 1.0.0 (Beta)\n\nFor support or questions, please use the Report Bug feature on the home screen.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings || "Settings"}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color="#065f46" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.preferences || "Preferences"}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLanguageChange}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#dbeafe" }]}>
                <Globe size={20} color="#3b82f6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t.language || "Language"}</Text>
                <Text style={styles.settingSubtitle}>
                  {currentLanguage?.flag} {currentLanguage?.nativeName}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.support || "Support & Information"}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleHowToUse}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#ddd6fe" }]}>
                <HelpCircle size={20} color="#7c3aed" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t.howToUse || "How to Use"}</Text>
                <Text style={styles.settingSubtitle}>
                  {t.howToUseDescription || "Learn how to scan items"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleBetaProgram}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#fef3c7" }]}>
                <Sparkles size={20} color="#f59e0b" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t.betaProgram || "Beta Program"}</Text>
                <Text style={styles.settingSubtitle}>
                  {t.betaProgramDescription || "Early access & updates"}
                </Text>
              </View>
            </View>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>NEW</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal || "Legal"}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleViewTerms}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#e5e7eb" }]}>
                <FileText size={20} color="#6b7280" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>
                  {t.termsOfServiceTitle}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {t.termsDescription || "View terms & disclaimer"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#d1fae5" }]}>
                <Info size={20} color="#10b981" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t.about || "About AlphaGo"}</Text>
                <Text style={styles.settingSubtitle}>
                  {t.aboutDescription || "App version & information"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t.settingsFooter || "AlphaGo - Allergen-Safe Scanning"}
          </Text>
          <Text style={styles.footerVersion}>Version 1.0.0 (Beta)</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#065f46",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTextContainer: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500" as const,
  },
  betaBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  betaBadgeText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6b7280",
    textAlign: "center",
  },
  footerVersion: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});
