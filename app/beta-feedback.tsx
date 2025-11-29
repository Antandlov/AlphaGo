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
import { MessageSquare, Star } from "lucide-react-native";

export default function BetaFeedbackScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert("Missing Information", "Please provide your feedback.");
      return;
    }

    if (rating === 0) {
      Alert.alert("Missing Rating", "Please rate your experience.");
      return;
    }

    setIsSubmitting(true);

    console.log("Beta Feedback Submitted:", {
      name,
      email,
      rating,
      feedback,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Thank You!",
        "Your feedback has been submitted. We appreciate your help in making AlphaGo better!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
      setName("");
      setEmail("");
      setRating(0);
      setFeedback("");
    }, 1000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Beta Feedback",
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
              <MessageSquare size={40} color="#10b981" />
            </View>
            <Text style={styles.title}>Beta Feedback</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>BETA TESTER</Text>
            </View>
            <Text style={styles.subtitle}>
              Your feedback helps shape the future of AlphaGo. Share your experience!
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
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
                We&apos;ll use this to follow up with you
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Rate Your Experience <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={40}
                      color={star <= rating ? "#fbbf24" : "#d1d5db"}
                      fill={star <= rating ? "#fbbf24" : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 5
                    ? "Excellent!"
                    : rating === 4
                    ? "Great!"
                    : rating === 3
                    ? "Good"
                    : rating === 2
                    ? "Needs improvement"
                    : "Poor"}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Your Feedback <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your thoughts, suggestions, or any issues you've encountered..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
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
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
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
    minHeight: 160,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#10b981",
    textAlign: "center",
    marginTop: 8,
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
