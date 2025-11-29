import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Bug } from "lucide-react-native";

export default function ReportBugScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    console.log("Bug Report Submitted:", { subject, description, email });

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Thank You!",
        "Your bug report has been submitted. We'll look into it as soon as possible.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }, 1000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Report Bug",
          headerStyle: {
            backgroundColor: "#10b981",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Bug size={40} color="#10b981" />
            </View>
            <Text style={styles.title}>Report a Bug</Text>
            <Text style={styles.subtitle}>
              Help us improve AlphaGo by reporting any issues you encounter
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Subject <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of the issue"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please provide details about the bug, steps to reproduce it, and what you expected to happen"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.helperText}>
                We&apos;ll only use this to follow up on your report
              </Text>
            </View>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
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
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#065f46",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
