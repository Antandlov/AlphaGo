import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { ScanHistoryProvider } from "../contexts/scan-history";
import { IngredientDatabaseProvider } from "../contexts/ingredient-database";
import { ProductDatabaseProvider } from "../contexts/product-database";
import { ProfileProvider, useProfiles } from "../contexts/profiles";
import { I18nContext, useI18n } from "../contexts/i18n";
import LanguageSelectionScreen from "./language-selection";
import TermsOfServiceScreen from "./terms-of-service";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="report-bug" options={{ headerShown: false }} />
      <Stack.Screen name="report-product" options={{ headerShown: false }} />
      <Stack.Screen name="beta-feedback" options={{ headerShown: false }} />
      <Stack.Screen name="beta-info" options={{ headerShown: false }} />
      <Stack.Screen name="how-to-use" options={{ headerShown: true }} />
      <Stack.Screen name="language-selection" options={{ headerShown: false }} />
      <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: "modal",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="history" 
        options={{ 
          title: "Scan History",
          headerStyle: {
            backgroundColor: "#10b981",
          },
          headerTintColor: "#fff",
        }} 
      />
      <Stack.Screen 
        name="result" 
        options={{ 
          presentation: "modal",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profiles" 
        options={{ 
          title: "Family Profiles",
          headerStyle: {
            backgroundColor: "#10b981",
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}

function AppContent() {
  const { isLoaded } = useProfiles();
  const { language, tosAccepted, isLoaded: i18nLoaded } = useI18n();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    console.log("[AppContent] isLoaded:", isLoaded, "i18nLoaded:", i18nLoaded, "appReady:", appReady);
    if (isLoaded && i18nLoaded && !appReady) {
      console.log("[AppContent] Setting app ready and hiding splash screen");
      setAppReady(true);
      setTimeout(() => {
        SplashScreen.hideAsync();
        console.log("[AppContent] Splash screen hidden");
      }, 100);
    }
  }, [isLoaded, i18nLoaded, appReady]);

  if (!appReady) {
    console.log("[AppContent] App not ready yet, showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!language) {
    console.log("[AppContent] No language selected, showing language selection");
    return <LanguageSelectionScreen />;
  }

  if (!tosAccepted) {
    console.log("[AppContent] ToS not accepted, showing ToS screen");
    return <TermsOfServiceScreen />;
  }

  console.log("[AppContent] App ready, rendering navigation");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nContext>
        <IngredientDatabaseProvider>
          <ProductDatabaseProvider>
            <ProfileProvider>
              <ScanHistoryProvider>
                <AppContent />
              </ScanHistoryProvider>
            </ProfileProvider>
          </ProductDatabaseProvider>
        </IngredientDatabaseProvider>
      </I18nContext>
    </QueryClientProvider>
  );
}
