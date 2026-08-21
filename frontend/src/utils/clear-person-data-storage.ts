const PERSON_DATA_STORAGE_KEYS = ['employee-storage', 'document-storage'];

export const clearPersonDataStorage = (): void => {
  PERSON_DATA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};
