import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Pressable,
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
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { addScan } = useScanHistory();
  const { findIngredient, batchAddIngredients, logUpdate } = useIngredientDatabase();
  const { findProduct } = useProductDatabase();
  const { getCombinedAllergens } = useProfiles();
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
      try {
        console.log("Starting ingredient analysis...");
        console.log("[Option B Ready] findProduct available for future database-first lookup:", !!findProduct);

        const combinedAllergens = getCombinedAllergens();
        const selectedAllergenInfo = combinedAllergens.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
        
        console.log("Scanning for allergens:", selectedAllergenInfo.map(a => a?.name));

        let allergenContext = "";
        selectedAllergenInfo.forEach(allergen => {
          if (allergen) {
            allergenContext += `\n\n${allergen.name.toUpperCase()} ALLERGY:\n`;
            allergenContext += `Description: ${allergen.description}\n`;
            allergenContext += `Common ingredients to avoid: ${allergen.commonIngredients.join(", ")}\n`;
            allergenContext += `Caution ingredients (verify source): ${allergen.cautionIngredients.join(", ")}\n`;
          }
        });

        console.log("Calling generateText with allergen context...");
        const response = await generateText({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${allergenContext}

Analyze the ingredient list in this image. Extract all ingredients and check them against the allergen lists above.

IMPORTANT: You must respond with ONLY valid JSON. No additional text before or after. Start with { and end with }.

The JSON must follow this exact structure:
{
  "productName": "optional product name",
  "ingredients": [
    {
      "name": "ingredient name",
      "isMammalBased": false,
      "category": "optional category",
      "explanation": "optional explanation",
      "requiresCaution": false,
      "allergenIds": ["optional allergen ids"],
      "isAllergen": false
    }
  ],
  "overallSafety": "safe" or "unsafe" or "caution"
}

For each ingredient:
1. Identify its name
2. Check if it matches any allergen in the lists above
3. Set isAllergen to true if it matches any allergen
4. Set allergenIds to the list of allergen IDs this ingredient belongs to (e.g., ["dairy", "alpha-gal"])
5. Set isMammalBased to true if it's from alpha-gal allergen list (for backwards compatibility)
6. Set requiresCaution to true if the ingredient source is ambiguous
7. Categorize it
8. Provide a brief explanation if it contains allergens or needs caution

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
        console.log("Raw response:", response.substring(0, 200));
        
        let jsonText = response.trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        console.log("Parsing JSON...");
        const parsed = JSON.parse(jsonText);
        const analysis = AnalysisSchema.parse(parsed);
        console.log("Analysis complete successfully");

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
        console.error("Error during analysis:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        throw error;
      }
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
      alert("Failed to analyze the image. Please try again.\n\nError: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Camera size={80} color="#10b981" strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            AlphaGo needs camera access to scan ingredient labels and help you
            stay safe.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.logo}>AlphaGo</Text>
            <Pressable
              style={styles.historyButton}
              onPress={() => router.push("/history")}
            >
              <History size={24} color="#fff" />
            </Pressable>
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
            Hold steady and tap to focus if needed
          </Text>
        </View>

        <SafeAreaView style={styles.bottomSafeArea} edges={["bottom"]}>
          <View style={styles.controls}>
            {analyzeMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Analyzing ingredients...</Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.captureButtonContainer,
                  { transform: [{ scale: scanButtonScale }] },
                ]}
              >
                <Pressable
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <Scan size={32} color="#fff" />
                </Pressable>
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
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
