import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Scan, Bug, AlertCircle, HelpCircle, Users, CheckCircle2, Sparkles, Settings } from "lucide-react-native";
import { useProfiles } from "../contexts/profiles";
import { ALLERGENS } from "../constants/allergens";

export default function HomeScreen() {
  const router = useRouter();
  const { profiles, selectedProfileIds, setSelectedProfileIds } = useProfiles();

  const handleHowToUse = () => {
    router.push("/how-to-use");
  };

  const toggleProfile = async (profileId: string) => {
    try {
      console.log("[HomeScreen] Toggling profile:", profileId);
      if (selectedProfileIds.includes(profileId)) {
        await setSelectedProfileIds(selectedProfileIds.filter((id) => id !== profileId));
      } else {
        await setSelectedProfileIds([...selectedProfileIds, profileId]);
      }
      console.log("[HomeScreen] Profile toggled successfully");
    } catch (error) {
      console.error("[HomeScreen] Error toggling profile:", error);
    }
  };

  const handleScan = () => {
    if (profiles.length === 0) {
      Alert.alert(
        "No Profiles Found",
        "You need to create at least one profile with allergens before scanning. Would you like to create one now?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Profile", onPress: () => router.push("/profiles") }
        ]
      );
      return;
    }
    
    if (selectedProfileIds.length === 0) {
      Alert.alert(
        "No Profiles Selected",
        "Please select at least one profile to scan for. Tap on a profile chip above to select it.",
        [{ text: "OK" }]
      );
      return;
    }
    
    router.push("/scan-v2");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>AlphaGo</Text>
            <Text style={styles.tagline}>Allergen-Safe Scanning</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Settings size={24} color="#065f46" />
          </TouchableOpacity>
        </View>

        {profiles.length > 0 && (
          <View style={styles.profileSection}>
            <View style={styles.profileSectionHeader}>
              <Text style={styles.profileSectionTitle}>Shopping For:</Text>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => router.push("/profiles")}
              >
                <Users size={16} color="#10b981" />
                <Text style={styles.manageButtonText}>Manage Profiles</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilesScroll}>
              {profiles.map((profile) => {
                const isSelected = selectedProfileIds.includes(profile.id);
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profileChip,
                      isSelected && styles.profileChipSelected,
                    ]}
                    onPress={() => toggleProfile(profile.id)}
                  >
                    {isSelected && (
                      <CheckCircle2 size={16} color="#10b981" strokeWidth={2.5} />
                    )}
                    <Text style={[
                      styles.profileChipText,
                      isSelected && styles.profileChipTextSelected,
                    ]}>
                      {profile.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {selectedProfileIds.length > 0 && (
              <View style={styles.allergenSummary}>
                <Text style={styles.allergenSummaryTitle}>Scanning for:</Text>
                <View style={styles.allergenTags}>
                  {Array.from(new Set(
                    profiles
                      .filter(p => selectedProfileIds.includes(p.id))
                      .flatMap(p => p.allergens)
                  )).map((allergenId) => {
                    const allergen = ALLERGENS.find(a => a.id === allergenId);
                    return allergen ? (
                      <View key={allergenId} style={styles.allergenTag}>
                        <Text style={styles.allergenTagText}>{allergen.name}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleScan}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Scan size={32} color="#fff" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Scan Item</Text>
              <Text style={styles.buttonSubtitle}>
                Check if a product is safe
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/report-bug")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.secondaryIconCircle]}>
              <Bug size={28} color="#10b981" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonTitle, styles.secondaryButtonTitle]}>
                Report Bug
              </Text>
              <Text style={[styles.buttonSubtitle, styles.secondaryButtonSubtitle]}>
                Let us know if something isn&apos;t working
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/report-product")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.secondaryIconCircle]}>
              <AlertCircle size={28} color="#10b981" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonTitle, styles.secondaryButtonTitle]}>
                Report Product Not Safe
              </Text>
              <Text style={[styles.buttonSubtitle, styles.secondaryButtonSubtitle]}>
                Help us improve our database
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.betaButton}
            onPress={() => router.push("/beta-info")}
            activeOpacity={0.7}
          >
            <Sparkles size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.betaText}>Beta Program</Text>
            <View style={styles.betaPill}>
              <Text style={styles.betaPillText}>NEW</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.howToUseButton}
            onPress={handleHowToUse}
            activeOpacity={0.7}
          >
            <HelpCircle size={16} color="#3b82f6" />
            <Text style={styles.howToUseText}>How to Use</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            Helping you stay safe with Alpha-Gal Syndrome
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
    paddingTop: 32,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    paddingHorizontal: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
  logo: {
    fontSize: 48,
    fontWeight: "800" as const,
    color: "#065f46",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "500" as const,
  },
  profileSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#d1fae5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#065f46",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#d1fae5",
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#10b981",
  },
  profilesScroll: {
    marginBottom: 12,
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  profileChipSelected: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  profileChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  profileChipTextSelected: {
    color: "#065f46",
  },
  allergenSummary: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  allergenSummaryTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6b7280",
    marginBottom: 8,
  },
  allergenTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  allergenTag: {
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  allergenTagText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  buttonContainer: {
    gap: 16,
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: "#10b981",
    paddingVertical: 28,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryIconCircle: {
    backgroundColor: "#d1fae5",
  },
  buttonTextContainer: {
    flex: 1,
    gap: 4,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  secondaryButtonTitle: {
    color: "#065f46",
  },
  buttonSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500" as const,
  },
  secondaryButtonSubtitle: {
    color: "#6b7280",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  betaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#fbbf24",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  betaText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#d97706",
  },
  betaPill: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  betaPillText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  howToUseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  howToUseText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2563eb",
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
