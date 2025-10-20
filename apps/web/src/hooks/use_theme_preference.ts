import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react'

import { STORAGE_KEYS } from '~lib'

export type ThemePreference = 'light' | 'dark'
export type ThemePreferenceWithAuto = ThemePreference | 'auto'

const THEME_CLASSNAMES = [
	'light',
	'dark',
	'light-medium-contrast',
	'dark-medium-contrast',
	'light-high-contrast',
	'dark-high-contrast',
] as const

const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const getSystemThemePreference = (): ThemePreference =>
	typeof window !== 'undefined' &&
	window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'

export const getStoredThemePreference = (): ThemePreferenceWithAuto | null => {
	if (typeof window === 'undefined') return null
	const stored = window.localStorage.getItem(STORAGE_KEYS.themePreference)
	return stored === 'dark' || stored === 'light' || stored === 'auto'
		? stored
		: null
}

const applyThemePreference = (theme: ThemePreference) => {
	if (typeof document === 'undefined') return
	const root = document.documentElement

	root.classList.remove(...THEME_CLASSNAMES)
	root.classList.toggle('dark', theme === 'dark')
	root.classList.add(theme)
	root.dataset.theme = theme
	root.style.setProperty('color-scheme', theme)
}

export function useThemePreference() {
	const initialStored = useMemo(() => getStoredThemePreference(), [])
	const initialTheme = useMemo<ThemePreference>(() => {
		if (initialStored === 'auto' || initialStored === null) {
			return getSystemThemePreference()
		}
		return initialStored
	}, [initialStored])

	const [theme, setThemeState] = useState<ThemePreference>(initialTheme)
	const [preferenceMode, setPreferenceMode] = useState<ThemePreferenceWithAuto>(
		initialStored ?? 'auto',
	)

	useIsomorphicLayoutEffect(() => {
		applyThemePreference(theme)
	}, [theme])

	const updateTheme = useCallback((next: ThemePreferenceWithAuto) => {
		if (typeof window === 'undefined') return

		setPreferenceMode(next)

		if (next === 'auto') {
			const system = getSystemThemePreference()
			setThemeState(system)
			window.localStorage.setItem(STORAGE_KEYS.themePreference, 'auto')
		} else {
			setThemeState(next)
			window.localStorage.setItem(STORAGE_KEYS.themePreference, next)
		}
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (preferenceMode !== 'auto') return

		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const handleChange = (event: MediaQueryListEvent) => {
			setThemeState(event.matches ? 'dark' : 'light')
		}

		if (typeof media.addEventListener === 'function') {
			media.addEventListener('change', handleChange)
		} else {
			media.addListener(handleChange)
		}

		return () => {
			if (typeof media.removeEventListener === 'function') {
				media.removeEventListener('change', handleChange)
			} else {
				media.removeListener(handleChange)
			}
		}
	}, [preferenceMode])

	const setTheme = useCallback(
		(next: ThemePreferenceWithAuto) => updateTheme(next),
		[updateTheme],
	)

	const toggleTheme = useCallback(() => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}, [setTheme, theme])

	const resetToSystem = useCallback(() => {
		updateTheme('auto')
	}, [updateTheme])

	return {
		theme,
		preferenceMode,
		isDark: theme === 'dark',
		setTheme,
		toggleTheme,
		resetToSystem,
		isAutoMode: preferenceMode === 'auto',
	}
}
