import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, History, Zap, ShoppingCart, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useScanHistory } from "../contexts/scan-history";
import { useIngredientDatabase } from "../contexts/ingredient-database";
import { useProductDatabase } from "../contexts/product-database";
import { useProfiles } from "../contexts/profiles";
import { useI18n } from "../contexts/i18n";
import { useScanCache } from "../contexts/scan-cache";
import { useShoppingList } from "../contexts/shopping-list";
import { useTheme } from "../contexts/theme";
import { ScanResult, SafetyStatus } from "../types/scan";
import { DATABASE_CONFIG } from "../constants/database-config";
import { IngredientDatabase } from "../types/database";
import { ALLERGENS } from "../constants/allergens";

const IngredientSchema = z.object({
  name: z.string(),
  isMammalBased: z.boolean(),
  category: z.string().optional(),
  explanation: z.string().optional(),
  requiresCaution: z.boolean().optional(),
  allergenIds: z.array(z.string()).optional(),
  isAllergen: z.boolean().optional(),
});

const AnalysisSchema = z.object({
  productName: z.string().optional(),
  ingredients: z.array(IngredientSchema),
  overallSafety: z.enum(["safe", "unsafe", "caution"]),
});

interface SessionStats {
  safe: number;
  unsafe: number;
  caution: number;
}

export default function ScanV2Screen() {
  const [facing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ safe: 0, unsafe: 0, caution: 0 });
  const [showBatchCart, setShowBatchCart] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { addScan } = useScanHistory();
  const { findIngredient, batchAddIngredients, logUpdate } = useIngredientDatabase();
  const { findProduct } = useProductDatabase();
  const { getCombinedAllergens } = useProfiles();
  const { language, t } = useI18n();
  const { addToCache, getFromCache } = useScanCache();
  const { theme, isDarkMode } = useTheme();
  const { list: shoppingList } = useShoppingList();
  
  const scanIndicatorOpacity = useRef(new Animated.Value(0.3)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const cartScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanIndicatorOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scanIndicatorOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scanIndicatorOpacity]);

  useEffect(() => {
    if (showBatchCart) {
      Animated.spring(cartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      cartScale.setValue(0);
    }
  }, [showBatchCart, cartScale]);

  const triggerFlash = useCallback((status: SafetyStatus) => {
    const colors = {
      safe: "#10b981",
      caution: "#f59e0b",
      unsafe: "#ef4444",
    };
    
    setFlashColor(colors[status]);
    
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFlashColor(null);
    });

    if (Platform.OS !== "web") {
      if (status === "unsafe") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (status === "caution") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [flashOpacity]);

  const speakVerdict = useCallback((status: SafetyStatus, productName?: string) => {
    let message = "";
    if (status === "safe") {
      message = `Safe. ${productName || "Product"} is safe to consume`;
    } else if (status === "caution") {
      message = `Caution. Check ${productName || "product"} carefully`;
    } else {
      message = `Unsafe. ${productName || "Product"} contains allergens`;
    }

    if (Platform.OS !== "web") {
      Speech.speak(message, {
        language: "en",
        rate: 1.0,
      });
    }
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const cacheKey = imageUri.substring(0, 100);
      const cached = getFromCache(cacheKey);
      
      if (cached) {
        console.log("[Scan] Using cached result");
        return {
          fromCache: true,
          analysis: {
            productName: cached.productName,
            ingredients: cached.ingredients,
            overallSafety: cached.status,
          },
        };
      }

      const MAX_RETRIES = 2;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[Scan] Starting analysis (attempt ${attempt}/${MAX_RETRIES})`);

          const combinedAllergens = getCombinedAllergens();
          const selectedAllergenInfo = combinedAllergens
            .map((id) => ALLERGENS.find((a) => a.id === id))
            .filter(Boolean);
          const userLanguage = language || "en";

          let allergenContext = "";
          selectedAllergenInfo.forEach((allergen) => {
            if (allergen) {
              allergenContext += `\n\n${allergen.name.toUpperCase()} ALLERGY:\n`;
              allergenContext += `Description: ${allergen.description}\n`;
              allergenContext += `Common ingredients to avoid: ${allergen.commonIngredients.join(", ")}\n`;
              allergenContext += `Caution ingredients (verify source): ${allergen.cautionIngredients.join(", ")}\n`;
            }
          });

          const languageNames: Record<string, string> = {
            en: "English",
            es: "Spanish",
            hi: "Hindi",
            ar: "Arabic",
            pt: "Portuguese",
            bn: "Bengali",
            ru: "Russian",
          };

          const response = await generateText({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `${allergenContext}

IMPORTANT INSTRUCTIONS:
1. Extract ALL ingredients from the image, regardless of language
2. Translate each ingredient to English for allergen checking
3. Check against the allergen lists above
4. Translate all output to ${languageNames[userLanguage]}

Respond with ONLY valid JSON:
{
  "productName": "product name in ${languageNames[userLanguage]}",
  "ingredients": [
    {
      "name": "ingredient name in ${languageNames[userLanguage]}",
      "isMammalBased": false,
      "category": "category in ${languageNames[userLanguage]}",
      "explanation": "explanation in ${languageNames[userLanguage]}",
      "requiresCaution": false,
      "allergenIds": ["allergen ids"],
      "isAllergen": false
    }
  ],
  "overallSafety": "safe" or "unsafe" or "caution"
}`,
                  },
                  {
                    type: "image",
                    image: imageUri,
                  },
                ],
              },
            ],
          });

          let jsonText = response.trim();
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }

          const parsed = JSON.parse(jsonText);
          const analysis = AnalysisSchema.parse(parsed);

          if (DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
            const newIngredients: IngredientDatabase[] = analysis.ingredients.map(
              (ing: z.infer<typeof IngredientSchema>) => ({
                name: ing.name,
                safetyStatus: ing.isMammalBased ? "unsafe" : ing.requiresCaution ? "caution" : "safe",
                category: ing.category,
                explanation: ing.explanation,
                lastUpdated: Date.now(),
              })
            );

            const unknownIngredients = newIngredients.filter(
              (ing: IngredientDatabase) => !findIngredient(ing.name)
            );

            if (unknownIngredients.length > 0) {
              batchAddIngredients(unknownIngredients);
              logUpdate({
                timestamp: Date.now(),
                ingredientsAdded: unknownIngredients.length,
                ingredientsUpdated: newIngredients.length - unknownIngredients.length,
                productsAdded: 0,
                source: "ai-scan",
              });
            }
          }

          return { fromCache: false, analysis };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[Scan] ERROR (attempt ${attempt}/${MAX_RETRIES}):`, error);

          if (error instanceof Error) {
            if (error.message.includes("ERR_NGROK") || error.message.includes("3200")) {
              throw new Error(
                "🔌 AI service is offline\n\nMake sure you're running through the Rork platform with internet connection."
              );
            }
            if (
              error.message.includes("fetch") ||
              error.message.includes("network") ||
              error.message.includes("Failed to fetch")
            ) {
              if (attempt < MAX_RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
                continue;
              }
              throw new Error("❌ Network connection failed\n\nCheck your internet and try again.");
            }
          }

          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            continue;
          }

          throw lastError || new Error("Failed to analyze image");
        }
      }

      throw lastError || new Error("Failed to analyze image after multiple attempts");
    },
    onSuccess: (result) => {
      const { analysis } = result;
      
      const scanResult: ScanResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        status: analysis.overallSafety,
        isSafe: analysis.overallSafety === "safe",
        ingredients: analysis.ingredients,
        productName: analysis.productName,
        imageUri: capturedImage || undefined,
        scannedForAllergens: getCombinedAllergens(),
      };

      addScan(scanResult);

      if (!result.fromCache) {
        const cacheKey = capturedImage?.substring(0, 100) || Date.now().toString();
        addToCache(cacheKey, scanResult);
      }

      setSessionStats((prev) => ({
        ...prev,
        [analysis.overallSafety]: prev[analysis.overallSafety] + 1,
      }));

      triggerFlash(analysis.overallSafety);
      speakVerdict(analysis.overallSafety, analysis.productName);

      if (!showBatchCart && (sessionStats.safe + sessionStats.unsafe + sessionStats.caution) === 0) {
        setShowBatchCart(true);
      }

      setTimeout(() => {
        router.push({
          pathname: "/result",
          params: { scanId: scanResult.id },
        });
      }, 600);
    },
    onError: (error) => {
      console.error("[Analysis Error]:", error);

      let userMessage = "Failed to analyze the image. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes("ERR_NGROK") ||
          error.message.includes("3200") ||
          error.message.includes("AI service")
        ) {
          userMessage =
            error.message +
            "\n\nTip: Make sure you're running through the Rork platform with internet connection.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          userMessage = error.message;
        } else {
          userMessage = "Failed to analyze the image. Please try again.\n\nError: " + error.message;
        }
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert("Analysis Failed", userMessage, [{ text: "OK" }]);
    },
  });

  const handleRequestPermission = async () => {
    console.log("[Camera] Requesting permission");
    setIsRequestingPermission(true);
    try {
      const result = await requestPermission();

      if (!result || !result.granted) {
        if (Platform.OS === "web") {
          Alert.alert(
            "Camera Access Denied",
            "To use the scanner:\n\n1. Click the camera icon in your browser\n2. Select 'Allow'\n3. Try again"
          );
        } else {
          Alert.alert(
            "Camera Permission Required",
            "Enable camera access in your device settings to scan ingredients."
          );
        }
      }
    } catch (error) {
      console.error("[Camera] Error:", error);
      Alert.alert("Error", "Failed to request camera permission. Please try again.");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && !analyzeMutation.isPending) {
      try {
        console.log("[Camera] Taking picture");
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
          skipProcessing: false,
        });

        if (photo && photo.base64) {
          const base64Image = `data:image/jpeg;base64,${photo.base64}`;
          setCapturedImage(base64Image);
          analyzeMutation.mutate(base64Image);
        }
      } catch (error) {
        console.error("[Camera] Failed to capture:", error);
      }
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContent}>
          <Camera size={80} color={theme.primary} strokeWidth={1.5} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            {t.cameraAccessRequired}
          </Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            {t.cameraAccessDescription}
          </Text>
          {Platform.OS === "web" && (
            <Text style={[styles.webNote, { color: theme.primary }]}>
              📷 Your browser will ask for camera access. Click &ldquo;Allow&rdquo; when prompted.
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: theme.primary },
              isRequestingPermission && styles.permissionButtonDisabled,
            ]}
            onPress={handleRequestPermission}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.permissionButtonText}>{t.grantPermission}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backToHomeButton, { backgroundColor: theme.secondary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backToHomeButtonText, { color: theme.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalScans = sessionStats.safe + sessionStats.unsafe + sessionStats.caution;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} autofocus="on" enableTorch={false}>
        {flashColor && (
          <Animated.View
            style={[
              styles.flashOverlay,
              {
                backgroundColor: flashColor,
                opacity: flashOpacity,
              },
            ]}
          />
        )}

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <X size={24} color="#fff" />
            </TouchableOpacity>

            {analyzeMutation.isPending && (
              <Animated.View
                style={[
                  styles.scanningIndicator,
                  {
                    opacity: scanIndicatorOpacity,
                  },
                ]}
              >
                <Zap size={16} color="#fff" fill="#10b981" />
                <Text style={styles.scanningText}>SCANNING</Text>
              </Animated.View>
            )}

            <TouchableOpacity style={styles.historyButton} onPress={() => router.push("/history")} activeOpacity={0.7}>
              <History size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            <View style={styles.scanLine}>
              <Animated.View
                style={[
                  styles.scanLineActive,
                  {
                    opacity: scanIndicatorOpacity,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.instructionText}>
            {analyzeMutation.isPending ? "Analyzing ingredients..." : "Tap button to scan ingredients"}
          </Text>
        </View>

        <SafeAreaView style={styles.bottomSafeArea} edges={["bottom"]}>
          {showBatchCart && totalScans > 0 && (
            <Animated.View
              style={[
                styles.batchCart,
                {
                  transform: [{ scale: cartScale }],
                },
              ]}
            >
              <View style={styles.batchCartContent}>
                <ShoppingCart size={20} color="#fff" />
                <Text style={styles.batchCartText}>Session: {totalScans} scanned</Text>
              </View>
              <View style={styles.batchStats}>
                {sessionStats.safe > 0 && (
                  <View style={[styles.statBadge, styles.safeBadge]}>
                    <Text style={styles.statBadgeText}>{sessionStats.safe} ✓</Text>
                  </View>
                )}
                {sessionStats.caution > 0 && (
                  <View style={[styles.statBadge, styles.cautionBadge]}>
                    <Text style={styles.statBadgeText}>{sessionStats.caution} ⚠</Text>
                  </View>
                )}
                {sessionStats.unsafe > 0 && (
                  <View style={[styles.statBadge, styles.unsafeBadge]}>
                    <Text style={styles.statBadgeText}>{sessionStats.unsafe} ✕</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          <View style={styles.controls}>
            {analyzeMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>{t.analyzingIngredients}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={handleCapture} activeOpacity={0.8}>
                <View style={styles.captureButtonInner}>
                  <Zap size={32} color="#fff" fill="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanningIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    borderRadius: 20,
  },
  scanningText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 1,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 300,
    height: 380,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#10b981",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
  },
  scanLineActive: {
    height: 2,
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  instructionText: {
    marginTop: 32,
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    overflow: "hidden",
  },
  bottomSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  batchCart: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  batchCartContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  batchCartText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  batchStats: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  safeBadge: {
    backgroundColor: "#10b981",
  },
  cautionBadge: {
    backgroundColor: "#f59e0b",
  },
  unsafeBadge: {
    backgroundColor: "#ef4444",
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#fff",
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#fff",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700" as const,
  },
  permissionContainer: {
    flex: 1,
  },
  permissionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  backToHomeButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  webNote: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500" as const,
    fontStyle: "italic" as const,
  },
});
