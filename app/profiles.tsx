import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Plus, Trash2, Edit2, CheckCircle2, Circle } from "lucide-react-native";
import { useProfiles } from "../contexts/profiles";
import { ALLERGENS } from "../constants/allergens";

export default function ProfilesScreen() {
  const { profiles, addProfile, updateProfile, deleteProfile } = useProfiles();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingProfile(null);
    setProfileName("");
    setSelectedAllergens([]);
    setCustomAllergens([]);
    setModalVisible(true);
  };

  const openEditModal = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setEditingProfile(profileId);
      setProfileName(profile.name);
      const standardAllergens = profile.allergens.filter(a => 
        ALLERGENS.some(allergen => allergen.id === a)
      );
      const customAllergensList = profile.allergens.filter(a => 
        !ALLERGENS.some(allergen => allergen.id === a)
      );
      setSelectedAllergens(standardAllergens);
      setCustomAllergens(customAllergensList);
      setModalVisible(true);
    }
  };

  const handleSave = () => {
    if (!profileName.trim()) {
      Alert.alert("Error", "Please enter a profile name");
      return;
    }

    const filteredCustom = customAllergens.filter(a => a.trim() !== "");
    const allAllergens = [...selectedAllergens, ...filteredCustom];

    if (allAllergens.length === 0) {
      Alert.alert("Error", "Please select at least one allergen");
      return;
    }

    if (editingProfile) {
      updateProfile(editingProfile, profileName.trim(), allAllergens);
    } else {
      addProfile(profileName.trim(), allAllergens);
    }

    setModalVisible(false);
    setProfileName("");
    setSelectedAllergens([]);
    setCustomAllergens([]);
    setEditingProfile(null);
  };

  const handleDelete = (profileId: string) => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete this profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProfile(profileId),
        },
      ]
    );
  };

  const toggleAllergen = (allergenId: string) => {
    if (selectedAllergens.includes(allergenId)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== allergenId));
    } else {
      setSelectedAllergens([...selectedAllergens, allergenId]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Profiles</Text>
          <Text style={styles.subtitle}>
            Create profiles for each family member with their specific allergies
          </Text>
        </View>

        {profiles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No profiles yet</Text>
            <Text style={styles.emptySubtext}>
              Add a profile to get started
            </Text>
          </View>
        )}

        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(profile.id)}
                >
                  <Edit2 size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(profile.id)}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.allergenList}>
              {profile.allergens.map((allergenId) => {
                const allergen = ALLERGENS.find((a) => a.id === allergenId);
                return (
                  <View key={allergenId} style={styles.allergenTag}>
                    <Text style={styles.allergenTagText}>
                      {allergen ? allergen.name : allergenId}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProfile ? "Edit Profile" : "Add New Profile"}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Profile Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mom, Dad, Kid 1"
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Top 25 Leading Allergies</Text>
                <View style={styles.allergenGrid}>
                  {ALLERGENS.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen.id);
                    return (
                      <TouchableOpacity
                        key={allergen.id}
                        style={[
                          styles.allergenOption,
                          isSelected && styles.allergenOptionSelected,
                        ]}
                        onPress={() => toggleAllergen(allergen.id)}
                      >
                        <View style={styles.allergenOptionContent}>
                          <View style={styles.allergenInfo}>
                            <Text style={styles.allergenName}>
                              {allergen.name}
                            </Text>
                            <Text style={styles.allergenDescription}>
                              {allergen.description}
                            </Text>
                          </View>
                          {isSelected ? (
                            <CheckCircle2 size={24} color="#10b981" />
                          ) : (
                            <Circle size={24} color="#d1d5db" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Custom Allergies</Text>
                {customAllergens.map((custom, index) => (
                  <View key={index} style={styles.customInputRow}>
                    <TextInput
                      style={[styles.input, styles.customInput]}
                      placeholder="Enter custom allergen"
                      value={custom}
                      onChangeText={(text) => {
                        const updated = [...customAllergens];
                        updated[index] = text;
                        setCustomAllergens(updated);
                      }}
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => {
                        setCustomAllergens(customAllergens.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setCustomAllergens([...customAllergens, ""])}
                >
                  <Plus size={20} color="#10b981" />
                  <Text style={styles.addCustomButtonText}>Add Custom Allergen</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#d1fae5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#065f46",
  },
  profileActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  allergenList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergenTag: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  allergenTagText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#065f46",
  },
  footer: {
    padding: 20,
    paddingBottom: 20,
  },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "95%",
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#065f46",
    marginBottom: 12,
  },
  modalScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  allergenGrid: {
    gap: 12,
  },
  allergenOption: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  allergenOptionSelected: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  allergenOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  allergenInfo: {
    flex: 1,
    marginRight: 12,
  },
  allergenName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  allergenDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  customInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  customInput: {
    flex: 1,
  },
  removeButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#10b981",
    borderStyle: "dashed",
    backgroundColor: "#f0fdf4",
    marginTop: 8,
  },
  addCustomButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#10b981",
  },
});
