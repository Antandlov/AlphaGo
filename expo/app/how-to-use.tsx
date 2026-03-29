import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Scan, Users, CheckCircle, History, AlertCircle, FileText, X } from "lucide-react-native";
import { useState } from "react";
import { useI18n } from "../contexts/i18n";

export default function HowToUseScreen() {
  const { tosText, t } = useI18n();
  const [showTos, setShowTos] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "How to Use",
          headerStyle: {
            backgroundColor: "#3b82f6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to AlphaGo!</Text>
            <Text style={styles.subtitle}>
              Your personal allergen scanning companion
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Users size={32} color="#3b82f6" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create Profiles</Text>
                <Text style={styles.stepDescription}>
                  Start by creating profiles for each family member. Add their specific allergies so AlphaGo can check products for them.
                </Text>
                <Text style={styles.stepTip}>
                  💡 Tip: You can create multiple profiles and switch between them when shopping.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <CheckCircle size={32} color="#10b981" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Active Profiles</Text>
                <Text style={styles.stepDescription}>
                  On the home screen, tap the profile button or icon to select who you&apos;re shopping for. You can select multiple profiles at once.
                </Text>
                <Text style={styles.stepTip}>
                  💡 Tip: Selected profiles will have a green checkmark.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Scan size={32} color="#8b5cf6" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Scan Products</Text>
                <Text style={styles.stepDescription}>
                  Press the &quot;Scan Item&quot; button, take a photo of the ingredients list or barcode, and AlphaGo will analyze it for allergens.
                </Text>
                <Text style={styles.stepTip}>
                  💡 Tip: Make sure the ingredients are clearly visible and well-lit.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <History size={32} color="#f59e0b" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Review Results</Text>
                <Text style={styles.stepDescription}>
                  Get instant feedback on whether the product is safe. AlphaGo will highlight any allergens found and provide detailed information.
                </Text>
                <Text style={styles.stepTip}>
                  💡 Tip: Check your scan history to review past scans.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <AlertCircle size={32} color="#ef4444" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Report Issues</Text>
                <Text style={styles.stepDescription}>
                  Found a problem or incorrect result? Use the &quot;Report Bug&quot; or &quot;Report Product Not Safe&quot; buttons to help us improve.
                </Text>
                <Text style={styles.stepTip}>
                  💡 Tip: Your feedback helps make AlphaGo better for everyone.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About Alpha-Gal Syndrome</Text>
            <Text style={styles.infoText}>
              Alpha-Gal Syndrome (AGS) is an allergy to galactose-alpha-1,3-galactose, a sugar molecule found in most mammals. AlphaGo helps identify mammalian ingredients in products to keep you safe.
            </Text>
          </View>

          <View style={styles.safetySection}>
            <Text style={styles.safetyTitle}>⚠️ Important Safety Note</Text>
            <Text style={styles.safetyText}>
              AlphaGo is a helpful tool, but always verify ingredients yourself. If you&apos;re unsure about a product, consult with your healthcare provider or avoid the product.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.tosButton}
            onPress={() => setShowTos(true)}
            activeOpacity={0.7}
          >
            <FileText size={24} color="#6366f1" />
            <View style={styles.tosButtonTextContainer}>
              <Text style={styles.tosButtonTitle}>{t.termsOfService.viewTerms}</Text>
              <Text style={styles.tosButtonSubtitle}>View full legal terms and disclaimer</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showTos}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTos(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.termsOfService.title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTos(false)}
              activeOpacity={0.7}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.modalTosText}>{tosText}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    gap: 20,
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#dbeafe",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stepIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#fff",
  },
  stepContent: {
    gap: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1e40af",
  },
  stepDescription: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  stepTip: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic" as const,
    marginTop: 4,
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  infoSection: {
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1e40af",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#1e3a8a",
    lineHeight: 22,
  },
  safetySection: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#dc2626",
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
  },
  tosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#c7d2fe",
  },
  tosButtonTextContainer: {
    flex: 1,
    gap: 4,
  },
  tosButtonTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#4338ca",
  },
  tosButtonSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6366f1",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
  },
  modalTosText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "monospace",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
