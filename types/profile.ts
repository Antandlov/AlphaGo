export interface Profile {
  id: string;
  name: string;
  allergens: string[];
  createdAt: number;
}

export interface ProfileContextType {
  profiles: Profile[];
  addProfile: (name: string, allergens: string[]) => void;
  updateProfile: (id: string, name: string, allergens: string[]) => void;
  deleteProfile: (id: string) => void;
  selectedProfileIds: string[];
  setSelectedProfileIds: (ids: string[]) => void;
  getCombinedAllergens: () => string[];
}
