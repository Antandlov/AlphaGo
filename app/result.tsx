import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, CheckCircle2, XCircle, AlertTriangle, Check } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useScanHistory } from "../contexts/scan-history";
import { ALLERGENS } from "../constants/allergens";
import * as Haptics from "expo-haptics";

export default function ResultScreen() {
  const router = useRouter();
  const { scanId } = useLocalSearchParams();
  const { history } = useScanHistory();
  const [showDetails, setShowDetails] = useState(false);

  const scan = history.find((s) => s.id === scanId);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scan) {
      if (Platform.OS !== "web") {
        if (scan.status === "safe") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (scan.status === "unsafe") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => setShowDetails(true), 200);
      });
    }
  }, [scan, scaleAnim, fadeAnim, checkmarkRotate]);

  if (!scan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Scan not found</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const unsafeIngredients = scan.ingredients.filter(
    (i) => i.isAllergen || i.isMammalBased
  );
  const cautionIngredients = scan.ingredients.filter(
    (i) => !i.isAllergen && !i.isMammalBased && i.requiresCaution
  );
  const safeIngredients = scan.ingredients.filter(
    (i) => !i.isAllergen && !i.isMammalBased && !i.requiresCaution
  );

  const rotation = checkmarkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
  });

  const getBackgroundStyle = () => {
    switch (scan.status) {
      case "safe":
        return styles.safeBackground;
      case "caution":
        return styles.cautionBackground;
      case "unsafe":
        return styles.unsafeBackground;
      default:
        return styles.safeBackground;
    }
  };

  const getIconColor = () => {
    switch (scan.status) {
      case "safe":
        return "#065f46";
      case "caution":
        return "#92400e";
      case "unsafe":
        return "#7f1d1d";
      default:
        return "#065f46";
    }
  };

  const getIcon = () => {
    switch (scan.status) {
      case "safe":
        return <CheckCircle2 size={120} color="#10b981" strokeWidth={2} />;
      case "caution":
        return <AlertTriangle size={120} color="#f59e0b" strokeWidth={2} />;
      case "unsafe":
        return <XCircle size={120} color="#ef4444" strokeWidth={2} />;
      default:
        return <CheckCircle2 size={120} color="#10b981" strokeWidth={2} />;
    }
  };

  const getTitle = () => {
    switch (scan.status) {
      case "safe":
        return "Safe to Consume";
      case "caution":
        return "Caution Required";
      case "unsafe":
        return "Not Safe";
      default:
        return "Safe to Consume";
    }
  };

  const getSubtitle = () => {
    switch (scan.status) {
      case "safe":
        return "No allergens detected";
      case "caution":
        return `${cautionIngredients.length} ${cautionIngredients.length === 1 ? "ingredient" : "ingredients"} may contain allergens - verify source`;
      case "unsafe":
        return `${unsafeIngredients.length} ${unsafeIngredients.length === 1 ? "ingredient" : "ingredients"} with allergens found`;
      default:
        return "No allergens detected";
    }
  };

  const getAllergenNames = (allergenIds?: string[]) => {
    if (!allergenIds || allergenIds.length === 0) return [];
    return allergenIds
      .map(id => ALLERGENS.find(a => a.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const getTitleColor = () => {
    switch (scan.status) {
      case "safe":
        return styles.safeText;
      case "caution":
        return styles.cautionText;
      case "unsafe":
        return styles.unsafeText;
      default:
        return styles.safeText;
    }
  };

  return (
    <View style={[styles.container, getBackgroundStyle()]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={() => router.back()}
          >
            <X size={28} color={getIconColor()} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.resultIcon,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
              opacity: fadeAnim,
            },
          ]}
        >
          {getIcon()}
        </Animated.View>

        <Animated.View style={[styles.resultContent, { opacity: fadeAnim }]}>
          <Text style={[styles.resultTitle, getTitleColor()]}>
            {getTitle()}
          </Text>

          {scan.productName && (
            <Text style={styles.productName}>{scan.productName}</Text>
          )}

          <Text style={styles.resultSubtitle}>
            {getSubtitle()}
          </Text>

          {showDetails && (
            <Animated.View
              style={[
                styles.detailsContainer,
                { opacity: fadeAnim, transform: [{ translateY: 0 }] },
              ]}
            >
              {unsafeIngredients.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <XCircle size={20} color="#ef4444" />
                    <Text style={styles.sectionTitle}>Unsafe - Avoid These</Text>
                  </View>
                  {unsafeIngredients.map((ingredient, index) => {
                    const allergenNames = getAllergenNames(ingredient.allergenIds);
                    return (
                      <View key={index} style={styles.ingredientCard}>
                        <View style={styles.ingredientRow}>
                          <X size={20} color="#ef4444" strokeWidth={3} />
                          <View style={styles.ingredientContent}>
                            <Text style={styles.ingredientName}>
                              {ingredient.name}
                            </Text>
                            {allergenNames.length > 0 && (
                              <View style={styles.allergenBadges}>
                                {allergenNames.map((name, idx) => (
                                  <View key={idx} style={styles.allergenBadge}>
                                    <Text style={styles.allergenBadgeText}>{name}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {ingredient.category && (
                              <Text style={styles.ingredientCategory}>
                                {ingredient.category}
                              </Text>
                            )}
                            {ingredient.explanation && (
                              <Text style={styles.ingredientExplanation}>
                                {ingredient.explanation}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {unsafeIngredients.length > 0 && (
                    <View style={styles.explanationBox}>
                      <Text style={styles.explanationTitle}>Why These Are Unsafe:</Text>
                      <Text style={styles.explanationText}>
                        These ingredients contain allergens you&apos;re sensitive to. Always avoid products containing these ingredients to prevent allergic reactions.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {cautionIngredients.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Caution - Verify Source</Text>
                  </View>
                  {cautionIngredients.map((ingredient, index) => {
                    const allergenNames = getAllergenNames(ingredient.allergenIds);
                    return (
                      <View key={index} style={styles.cautionCard}>
                        <View style={styles.ingredientRow}>
                          <AlertTriangle size={20} color="#f59e0b" strokeWidth={2.5} />
                          <View style={styles.ingredientContent}>
                            <Text style={styles.ingredientName}>
                              {ingredient.name}
                            </Text>
                            {allergenNames.length > 0 && (
                              <View style={styles.allergenBadges}>
                                {allergenNames.map((name, idx) => (
                                  <View key={idx} style={[styles.allergenBadge, styles.cautionAllergenBadge]}>
                                    <Text style={styles.cautionAllergenBadgeText}>{name}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {ingredient.category && (
                              <Text style={styles.ingredientCategory}>
                                {ingredient.category}
                              </Text>
                            )}
                            {ingredient.explanation && (
                              <Text style={styles.ingredientExplanation}>
                                {ingredient.explanation}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {cautionIngredients.length > 0 && (
                    <View style={styles.cautionExplanationBox}>
                      <Text style={styles.explanationTitle}>Why Caution Is Needed:</Text>
                      <Text style={styles.explanationText}>
                        These ingredients can be safe if from plant/vegan sources, but may contain allergens depending on their source. Contact the manufacturer to verify before consuming.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {safeIngredients.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Safe Ingredients</Text>
                  </View>
                  {safeIngredients.map((ingredient, index) => (
                    <View key={index} style={styles.safeIngredientCard}>
                      <View style={styles.ingredientRow}>
                        <Check size={20} color="#10b981" strokeWidth={3} />
                        <Text style={styles.safeIngredientName}>
                          {ingredient.name}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <SafeAreaView style={styles.bottomSafeArea} edges={["bottom"]}>
        <TouchableOpacity
          style={[styles.doneButton, scan.status === "safe" ? styles.safeDoneButton : scan.status === "caution" ? styles.cautionDoneButton : styles.unsafeDoneButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeBackground: {
    backgroundColor: "#f0fdf4",
  },
  cautionBackground: {
    backgroundColor: "#fffbeb",
  },
  unsafeBackground: {
    backgroundColor: "#fef2f2",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  closeIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  resultIcon: {
    alignSelf: "center",
    marginBottom: 32,
  },
  resultContent: {
    gap: 8,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: "800" as const,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  safeText: {
    color: "#065f46",
  },
  cautionText: {
    color: "#92400e",
  },
  unsafeText: {
    color: "#991b1b",
  },
  productName: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#374151",
    textAlign: "center",
    marginTop: 4,
  },
  resultSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  detailsContainer: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  ingredientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cautionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  safeIngredientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  ingredientContent: {
    flex: 1,
    gap: 4,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  safeIngredientName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
    flex: 1,
  },
  ingredientCategory: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6b7280",
    textTransform: "capitalize" as const,
  },
  ingredientExplanation: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  explanationBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  cautionExplanationBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  explanationText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  allergenBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  allergenBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  allergenBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#dc2626",
    textTransform: "uppercase" as const,
  },
  cautionAllergenBadge: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  cautionAllergenBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#d97706",
    textTransform: "uppercase" as const,
  },
  bottomSafeArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doneButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  safeDoneButton: {
    backgroundColor: "#10b981",
  },
  cautionDoneButton: {
    backgroundColor: "#f59e0b",
  },
  unsafeDoneButton: {
    backgroundColor: "#ef4444",
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
  },
  closeButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
