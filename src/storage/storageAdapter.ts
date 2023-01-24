import type { MMKV } from 'react-native-mmkv';

export function getStorage(mmkv: MMKV) {
  return {
    get: (key: string): any => {
      const value = mmkv.getString(key);
      return Promise.resolve(value ? JSON.parse(value) : undefined);
    },
    set: async <T = string>(key: string, value: T) => {
      mmkv.set(key, JSON.stringify(value));
    },
    remove: async (key: string) => {
      mmkv.delete(key);
    },
  };
}
