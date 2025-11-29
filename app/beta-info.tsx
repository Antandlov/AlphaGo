import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { MessageSquare, Share2, ExternalLink, Sparkles, Bug } from "lucide-react-native";
import Svg, { Rect } from "react-native-svg";
import { useAnalytics } from "../contexts/analytics";

const APP_URL = "exp://192.168.1.1:8081";
const QR_CODE_SIZE = 200;

function QRCodeComponent({ value, size }: { value: string; size: number }) {
  const generateQRMatrix = (text: string) => {
    const matrixSize = 21;
    const matrix: boolean[][] = Array(matrixSize)
      .fill(null)
      .map(() => Array(matrixSize).fill(false));

    for (let i = 0; i < text.length; i++) {
      const x = (i * 7) % matrixSize;
      const y = Math.floor((i * 7) / matrixSize) % matrixSize;
      matrix[y][x] = true;
    }

    matrix[0][0] = matrix[0][6] = matrix[6][0] = true;
    matrix[matrixSize - 1][0] = matrix[matrixSize - 1][6] = matrix[matrixSize - 7][0] = true;
    matrix[0][matrixSize - 1] = matrix[0][matrixSize - 7] = matrix[6][matrixSize - 1] = true;

    return matrix;
  };

  const matrix = generateQRMatrix(value);
  const moduleSize = size / matrix.length;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect width={size} height={size} fill="white" />
      {matrix.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          return (
            <Rect
              key={`${x}-${y}`}
              x={x * moduleSize}
              y={y * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="black"
            />
          );
        })
      )}
    </Svg>
  );
}

export default function BetaInfoScreen() {
  const router = useRouter();
  const { trackEvent, getEvents, getCrashes } = useAnalytics();
  const [eventCount, setEventCount] = useState(0);
  const [crashCount, setCrashCount] = useState(0);

  useEffect(() => {
    trackEvent("beta_info_opened");

    const loadStats = async () => {
      const events = await getEvents();
      const crashes = await getCrashes();
      setEventCount(events.length);
      setCrashCount(crashes.length);
    };

    loadStats();
  }, [trackEvent, getEvents, getCrashes]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join the AlphaGo beta! Help test our allergen scanning app for Alpha-Gal Syndrome.\n\nScan the QR code I'm sharing or contact me for access to the app.`,
        title: "Join AlphaGo Beta",
      });
      trackEvent("beta_link_shared");
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
      trackEvent("beta_link_copied");
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Beta Testing",
          headerStyle: {
            backgroundColor: "#10b981",
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
            <View style={styles.iconContainer}>
              <Sparkles size={40} color="#fbbf24" fill="#fbbf24" />
            </View>
            <Text style={styles.title}>Beta Testing Program</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>EARLY ACCESS</Text>
            </View>
            <Text style={styles.subtitle}>
              Share AlphaGo with friends and family to help us test and improve!
            </Text>
          </View>

          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Share QR Code</Text>
            <Text style={styles.sectionSubtitle}>
              Share this with friends & family to test the app
            </Text>
            <View style={styles.qrContainer}>
              <QRCodeComponent value={APP_URL} size={QR_CODE_SIZE} />
            </View>
          </View>

          <View style={styles.linkSection}>
            <Text style={styles.sectionTitle}>Share with Beta Testers</Text>
            <Text style={styles.sectionSubtitle}>
              Use the share button below to invite friends and family
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.shareButton]}
                onPress={handleShare}
              >
                <Share2 size={20} color="#fff" />
                <Text style={styles.buttonText}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.openButton]}
                onPress={handleCopyLink}
              >
                <ExternalLink size={20} color="#10b981" />
                <Text style={styles.openButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Beta Tester Actions</Text>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                trackEvent("feedback_button_clicked");
                router.push("/beta-feedback");
              }}
            >
              <View style={styles.actionIconContainer}>
                <MessageSquare size={24} color="#10b981" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Submit Feedback</Text>
                <Text style={styles.actionSubtitle}>
                  Share your thoughts and suggestions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                trackEvent("report_bug_button_clicked");
                router.push("/report-bug");
              }}
            >
              <View style={styles.actionIconContainer}>
                <Bug size={24} color="#10b981" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Report Bug</Text>
                <Text style={styles.actionSubtitle}>
                  Let us know if something isn&apos;t working
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Debug Stats</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Events Tracked:</Text>
                <Text style={styles.statValue}>{eventCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Crashes Reported:</Text>
                <Text style={styles.statValue}>{crashCount}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Why Beta Testing?</Text>
            <Text style={styles.infoText}>
              Your participation helps us identify issues, improve features, and ensure
              AlphaGo works perfectly for everyone with Alpha-Gal Syndrome.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
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
    padding: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#065f46",
  },
  betaBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  betaBadgeText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  qrSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  linkSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  linkBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  linkText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButton: {
    backgroundColor: "#10b981",
  },
  openButton: {
    backgroundColor: "#d1fae5",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  openButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#10b981",
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#d1fae5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  statsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
    color: "#6b7280",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#065f46",
  },
  infoSection: {
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#1e40af",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e3a8a",
    lineHeight: 20,
  },
});
