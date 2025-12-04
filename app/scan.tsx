import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
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
import { Camera, History, Scan } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import { useScanHistory } from "../contexts/scan-history";
import { useIngredientDatabase } from "../contexts/ingredient-database";
import { useProductDatabase } from "../contexts/product-database";
import { useProfiles } from "../contexts/profiles";
import { useI18n } from "../contexts/i18n";
import { ScanResult } from "../types/scan";

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

export default function ScanScreen() {
  const [facing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { addScan } = useScanHistory();
  const { findIngredient, batchAddIngredients, logUpdate } = useIngredientDatabase();
  const { findProduct } = useProductDatabase();
  const { getCombinedAllergens } = useProfiles();
  const { language, t } = useI18n();
  const scanButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanButtonScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scanButtonScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scanButtonScale]);

  const analyzeMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const MAX_RETRIES = 2;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[Scan] Starting ingredient analysis (attempt ${attempt}/${MAX_RETRIES})...`);
          console.log("[Scan] Project ID: rgnn5afmshztp4xufngmk");
          console.log("[Scan] findProduct available:", !!findProduct);

        const combinedAllergens = getCombinedAllergens();
        const selectedAllergenInfo = combinedAllergens.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
        const userLanguage = language || "en";
        
        console.log("Scanning for allergens:", selectedAllergenInfo.map(a => a?.name));
        console.log("User's preferred language:", userLanguage);

        let allergenContext = "";
        selectedAllergenInfo.forEach(allergen => {
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

        console.log("[Scan] Calling generateText API...");
        const response = await generateText({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${allergenContext}

IMPORTANT INSTRUCTIONS:
1. The image may contain ingredients written in ANY language (Chinese, Japanese, Korean, Arabic, Spanish, etc.)
2. Extract ALL ingredients from the image, regardless of the language they are written in
3. Translate each ingredient name to English for allergen checking
4. Check the translated English names against the allergen lists above
5. After analysis, translate the ingredient names and explanations to ${languageNames[userLanguage]}
6. The user speaks ${languageNames[userLanguage]}, so all output fields (productName, ingredient names, categories, explanations) must be in ${languageNames[userLanguage]}

You must respond with ONLY valid JSON. No additional text before or after. Start with { and end with }.

The JSON must follow this exact structure:
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
}

For each ingredient:
1. Extract the ingredient name from the image (in whatever language it appears)
2. Translate it to English internally for allergen checking
3. Check if the English translation matches any allergen in the lists above
4. Set isAllergen to true if it matches any allergen
5. Set allergenIds to the list of allergen IDs this ingredient belongs to (e.g., ["dairy", "alpha-gal"])
6. Set isMammalBased to true if it's from alpha-gal allergen list (for backwards compatibility)
7. Set requiresCaution to true if the ingredient source is ambiguous
8. Translate the ingredient name to ${languageNames[userLanguage]} for the output
9. Categorize it in ${languageNames[userLanguage]}
10. Provide a brief explanation in ${languageNames[userLanguage]} if it contains allergens or needs caution

Provide the overall safety assessment:
- "safe" if all ingredients are confirmed safe
- "unsafe" if any allergen ingredients are found
- "caution" if there are ingredients with ambiguous sources that require verification`,
                },
                {
                  type: "image",
                  image: imageUri,
                },
              ],
            },
          ],
        });
        console.log("[Scan] Raw response:", response.substring(0, 200));
        
        let jsonText = response.trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        console.log("[Scan] Parsing JSON response...");
        const parsed = JSON.parse(jsonText);
        const analysis = AnalysisSchema.parse(parsed);
        console.log("[Scan] Analysis completed successfully");

        if (DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
          const newIngredients: IngredientDatabase[] = analysis.ingredients.map((ing: z.infer<typeof IngredientSchema>) => ({
            name: ing.name,
            safetyStatus: ing.isMammalBased ? 'unsafe' : (ing.requiresCaution ? 'caution' : 'safe'),
            category: ing.category,
            explanation: ing.explanation,
            lastUpdated: Date.now(),
          }));

          const unknownIngredients = newIngredients.filter(
            (ing: IngredientDatabase) => !findIngredient(ing.name)
          );

          if (unknownIngredients.length > 0) {
            console.log(`Adding ${unknownIngredients.length} new ingredients to database`);
            batchAddIngredients(unknownIngredients);

            logUpdate({
              timestamp: Date.now(),
              ingredientsAdded: unknownIngredients.length,
              ingredientsUpdated: newIngredients.length - unknownIngredients.length,
              productsAdded: 0,
              source: 'ai-scan',
            });
          }
        }

          return analysis;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[Scan] ERROR during analysis (attempt ${attempt}/${MAX_RETRIES}):`, error);
          
          if (error instanceof Error) {
            console.error("[Scan] Error name:", error.name);
            console.error("[Scan] Error message:", error.message);
            console.error("[Scan] Error stack:", error.stack);
            
            if (error.message.includes('ERR_NGROK') || error.message.includes('3200')) {
              throw new Error("🔌 AI service is offline\n\nThis means the backend AI service is not running. To fix this:\n\n1. Make sure you're running the app through Rork platform\n2. Check your internet connection\n3. Try refreshing the page or restarting the app\n\nIf you're a tester, contact the developer.");
            }
            if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
              if (attempt < MAX_RETRIES) {
                console.log(`[Scan] Network error, retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
              }
              throw new Error("❌ Network connection failed\n\nPlease check your internet connection and try again.");
            }
          }
          
          if (attempt < MAX_RETRIES) {
            console.log(`[Scan] Retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          
          throw lastError || new Error("Failed to analyze image");
        }
      }
      
      throw lastError || new Error("Failed to analyze image after multiple attempts");
    },
    onSuccess: (analysis) => {
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
      router.push({
        pathname: "/result",
        params: { scanId: scanResult.id },
      });
    },
    onError: (error) => {
      console.error("[Analysis Error] Analysis failed:", error);
      if (error instanceof Error) {
        console.error("[Analysis Error] Error name:", error.name);
        console.error("[Analysis Error] Error message:", error.message);
      }
      
      let userMessage = "Failed to analyze the image. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('ERR_NGROK') || error.message.includes('3200') || error.message.includes('AI service')) {
          userMessage = error.message + "\n\nTip: Make sure you're running this through the Rork platform with an active internet connection.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = error.message;
        } else {
          userMessage = "Failed to analyze the image. Please try again.\n\nError: " + error.message;
        }
      }
      
      Alert.alert("Analysis Failed", userMessage, [
        { text: "OK" }
      ]);
    },
  });

  const handleRequestPermission = async () => {
    console.log("[Camera] Requesting camera permission...");
    setIsRequestingPermission(true);
    try {
      const result = await requestPermission();
      console.log("[Camera] Permission result:", JSON.stringify(result));
      
      if (!result) {
        console.error("[Camera] No result from permission request");
        throw new Error("Permission request returned null");
      }
      
      if (!result.granted) {
        console.log("[Camera] Permission denied");
        if (Platform.OS === 'web') {
          Alert.alert(
            "Camera Access Denied",
            "To use the scanner, please:\n\n1. Click the camera icon in your browser's address bar\n2. Select 'Allow' for camera access\n3. Click 'Grant Permission' again\n\nOr refresh the page and try again."
          );
        } else {
          Alert.alert(
            "Camera Permission Required",
            "Camera permission is required to scan ingredients. Please enable it in your device settings.",
            [
              { text: "OK", style: "default" }
            ]
          );
        }
      } else {
        console.log("[Camera] Permission granted successfully");
      }
    } catch (error) {
      console.error("[Camera] Error requesting permission:", error);
      if (Platform.OS === 'web') {
        Alert.alert(
          "Camera Access Error",
          "Unable to access camera. Please:\n\n1. Make sure you're using HTTPS (https://)\n2. Check your browser allows camera access\n3. Try using Chrome or Safari\n4. Refresh the page and try again"
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to request camera permission. Please try again or check your device settings."
        );
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (!permission) {
    console.log("[Camera] Permission object not ready");
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    console.log("[Camera] Permission not granted, showing permission screen");
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Camera size={80} color="#10b981" strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>{t.cameraAccessRequired}</Text>
          <Text style={styles.permissionText}>
            {t.cameraAccessDescription}
          </Text>
          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>
              📷 Your browser will ask for camera access. Make sure to click &ldquo;Allow&rdquo; when prompted.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.permissionButton, isRequestingPermission && styles.permissionButtonDisabled]}
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
            style={styles.backToHomeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToHomeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log("[Camera] Permission granted, showing camera");

  const handleCapture = async () => {
    if (cameraRef.current && !analyzeMutation.isPending) {
      try {
        console.log("Taking picture...");
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 1,
          skipProcessing: false,
        });

        if (photo && photo.base64) {
          console.log("Picture taken, analyzing...");
          const base64Image = `data:image/jpeg;base64,${photo.base64}`;
          setCapturedImage(base64Image);
          analyzeMutation.mutate(base64Image);
        }
      } catch (error) {
        console.error("Failed to capture photo:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        autofocus="on"
        enableTorch={false}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>AlphaGo</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push("/history")}
              activeOpacity={0.7}
            >
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
          </View>

          <Text style={styles.instructionText}>
            {t.scanInstruction}
          </Text>
        </View>

        <SafeAreaView style={styles.bottomSafeArea} edges={["bottom"]}>
          <View style={styles.controls}>
            {analyzeMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>{t.analyzingIngredients}</Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.captureButtonContainer,
                  { transform: [{ scale: scanButtonScale }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                  activeOpacity={0.8}
                >
                  <Scan size={32} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300" as const,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: -0.5,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 360,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#10b981",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    marginTop: 24,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bottomSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  captureButtonContainer: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600" as const,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    color: "#1f2937",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 12,
    backgroundColor: "#10b981",
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
    backgroundColor: "#e5e7eb",
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  webNote: {
    fontSize: 14,
    color: "#10b981",
    textAlign: "center",
    fontWeight: "500" as const,
    fontStyle: "italic" as const,
  },
});
