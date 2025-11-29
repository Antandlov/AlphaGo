import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "../contexts/i18n";
import { LANGUAGES, Language } from "../types/i18n";

export default function LanguageSelectionScreen() {
  const { selectLanguage } = useI18n();

  const handleSelectLanguage = async (lang: Language) => {
    console.log("[LanguageSelection] Selected language:", lang);
    await selectLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#065f46", "#10b981", "#34d399"]}
        style={styles.gradient}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>AlphaGo</Text>
            <Text style={styles.title}>Select your language</Text>
            <Text style={styles.titleSecondary}>Selecciona tu idioma</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.languageList}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageButton}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageName}>{lang.nativeName}</Text>
                  <Text style={styles.languageEnglish}>{lang.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10b981",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    gap: 12,
  },
  logo: {
    fontSize: 56,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: -2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    textAlign: "center",
    marginTop: 8,
  },
  titleSecondary: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  languageList: {
    gap: 16,
    paddingBottom: 40,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  flag: {
    fontSize: 48,
    width: 60,
    textAlign: "center",
  },
  languageTextContainer: {
    flex: 1,
    gap: 4,
  },
  languageName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#065f46",
  },
  languageEnglish: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#6b7280",
  },
});
