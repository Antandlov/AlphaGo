import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { AlertCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

const reportCrashToStorage = async (error: string, stack?: string, context?: any) => {
  try {
    const crashReport = {
      error,
      stack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      context,
    };

    console.error("💥 Crash Report:", crashReport);

    const storedCrashes = await AsyncStorage.getItem("@analytics/crashes");
    const crashes = storedCrashes ? JSON.parse(storedCrashes) : [];
    crashes.push(crashReport);

    if (crashes.length > 50) {
      crashes.shift();
    }

    await AsyncStorage.setItem("@analytics/crashes", JSON.stringify(crashes));
  } catch (error) {
    console.error("Failed to report crash:", error);
  }
};

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary Caught:", error, errorInfo);
    reportCrashToStorage(error.message, error.stack, {
      componentStack: errorInfo.componentStack,
      platform: Platform.OS,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <AlertCircle size={64} color="#ef4444" />
            </View>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app has encountered an error. Don&apos;t worry, we&apos;ve logged this issue.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.error.stack && (
                  <Text style={styles.stackText}>{this.state.error.stack}</Text>
                )}
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <ErrorBoundaryComponent>{children}</ErrorBoundaryComponent>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef2f2",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#dc2626",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#dc2626",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#991b1b",
    marginBottom: 12,
  },
  stackText: {
    fontSize: 11,
    color: "#6b7280",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  button: {
    backgroundColor: "#10b981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
