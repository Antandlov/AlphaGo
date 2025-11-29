import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, XCircle, Trash2, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useScanHistory } from "../contexts/scan-history";

export default function HistoryScreen() {
  const router = useRouter();
  const { history, deleteScan, clearHistory } = useScanHistory();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Clock size={64} color="#d1d5db" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptyText}>
            Your scan history will appear here after you scan your first product
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.statsText}>
            {history.length} {history.length === 1 ? "scan" : "scans"} total
          </Text>
          {history.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearHistory}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.historyList}>
          {history.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.historyCard}
              onPress={() => router.push({ pathname: "/result", params: { scanId: scan.id } })}
            >
              <View style={styles.historyCardLeft}>
                <View
                  style={[
                    styles.statusIcon,
                    scan.isSafe ? styles.safeIcon : styles.unsafeIcon,
                  ]}
                >
                  {scan.isSafe ? (
                    <CheckCircle2 size={24} color="#10b981" strokeWidth={2.5} />
                  ) : (
                    <XCircle size={24} color="#ef4444" strokeWidth={2.5} />
                  )}
                </View>

                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {scan.productName || "Ingredient Scan"}
                  </Text>
                  <Text style={styles.historySubtitle}>
                    {scan.ingredients.length}{" "}
                    {scan.ingredients.length === 1 ? "ingredient" : "ingredients"}{" "}
                    analyzed
                  </Text>
                  <Text style={styles.historyTime}>{formatDate(scan.timestamp)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteScan(scan.id);
                }}
              >
                <Trash2 size={20} color="#9ca3af" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statsText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500" as const,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#ef4444",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  safeIcon: {
    backgroundColor: "#d1fae5",
  },
  unsafeIcon: {
    backgroundColor: "#fee2e2",
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  historySubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  historyTime: {
    fontSize: 13,
    color: "#9ca3af",
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
