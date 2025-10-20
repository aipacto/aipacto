export const STORAGE_KEYS = {
	themePreference: 'theme',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
