/**
 * Layout utilities for working with global design tokens
 */

/**
 * Get a CSS custom property value as a number
 */
export function getTokenValue(tokenName: string): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue(
		tokenName,
	)
	return parseInt(value) || 0
}

/**
 * Get a CSS custom property value as a string
 */
export function getTokenString(tokenName: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(tokenName)
		.trim()
}

/**
 * Layout token names for easy access
 */
export const LAYOUT_TOKENS = {
	PANEL_MIN_WIDTH: '--layout-panel-min-width',
	PANEL_MAX_WIDTH: '--layout-panel-max-width',
	PANEL_DEFAULT_WIDTH: '--layout-panel-default-width',
	DRAG_HANDLE_WIDTH: '--layout-drag-handle-width',
	DRAG_HANDLE_TOUCH_TARGET: '--layout-drag-handle-touch-target',
	BORDER_WIDTH: '--layout-border-width',
} as const

/**
 * Spacing token names
 */
export const SPACING_TOKENS = {
	NONE: '--spacing-none',
	XXS: '--spacing-xxs',
	XS: '--spacing-xs',
	SM: '--spacing-sm',
	MD: '--spacing-md',
	LG: '--spacing-lg',
	XL: '--spacing-xl',
	XXL: '--spacing-xxl',
} as const

/**
 * Border radius token names
 */
export const RADIUS_TOKENS = {
	NONE: '--radius-none',
	SM: '--radius-sm',
	MD: '--radius-md',
	LG: '--radius-lg',
	XL: '--radius-xl',
	FULL: '--radius-full',
} as const

/**
 * Z-index token names
 */
export const Z_INDEX_TOKENS = {
	NEGATIVE: '--z-index-negative',
	BACKGROUND: '--z-index-background',
	DEFAULT: '--z-index-default',
	DROPDOWN: '--z-index-dropdown',
	STICKY: '--z-index-sticky',
	FIXED: '--z-index-fixed',
	MODAL_BACKDROP: '--z-index-modal-backdrop',
	OFFCANVAS: '--z-index-offcanvas',
	MODAL: '--z-index-modal',
	POPOVER: '--z-index-popover',
	TOOLTIP: '--z-index-tooltip',
} as const

/**
 * Helper function to clamp a value between layout panel min and max widths
 */
export function clampPanelWidth(width: number): number {
	const minWidth = getTokenValue(LAYOUT_TOKENS.PANEL_MIN_WIDTH)
	const maxWidth = getTokenValue(LAYOUT_TOKENS.PANEL_MAX_WIDTH)
	return Math.max(minWidth, Math.min(maxWidth, width))
}

/**
 * Helper function to get responsive spacing based on screen size
 */
export function getResponsiveSpacing(
	baseToken: keyof typeof SPACING_TOKENS,
): string {
	const baseValue = getTokenString(SPACING_TOKENS[baseToken])

	// For mobile, you might want to adjust spacing
	if (typeof window !== 'undefined' && window.innerWidth <= 768) {
		// Return a smaller spacing for mobile
		const mobileToken =
			baseToken === 'LG' || baseToken === 'XL' ? 'MD' : baseToken
		return getTokenString(SPACING_TOKENS[mobileToken])
	}

	return baseValue
}

/**
 * Helper function to create CSS custom properties object for inline styles
 */
export function createTokenStyles(
	tokens: Record<string, string>,
): React.CSSProperties {
	const styles: React.CSSProperties = {}

	// Fix: Use type assertion to allow custom CSS variables in React.CSSProperties
	Object.entries(tokens).forEach(([key, value]) => {
		;(styles as Record<string, string>)[`--${key.toLowerCase()}`] = value
	})

	return styles
}
