export interface Profile {
  id: string;
  name: string;
  allergens: string[];
  createdAt: number;
}

export interface ProfileContextType {
  profiles: Profile[];
  addProfile: (name: string, allergens: string[]) => Promise<void>;
  updateProfile: (id: string, name: string, allergens: string[]) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  selectedProfileIds: string[];
  setSelectedProfileIds: (ids: string[]) => Promise<void>;
  getCombinedAllergens: () => string[];
  isLoaded: boolean;
}
