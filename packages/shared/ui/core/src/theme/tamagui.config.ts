import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, createTokens, setupDev } from 'tamagui'

import { animations } from './animations'
import { borderRadii } from './border_radii'
import { themes } from './colors'
import { fonts } from './fonts'
import { iconSizes } from './icon_sizes'
import { media, pageConstraints } from './media'
import { gap, spacing } from './spacing'
import { zIndices } from './z_indices'

// Hold down Alt/Option for a second to see some helpful visuals
setupDev({
	visualizer: {
		key: 'Alt',
		delay: 800,
	},
})

export const ThemeName = {
	dark: 'dark',
	light: 'light',
	system: 'system',
} as const
export type ThemeName = keyof typeof ThemeName

const radius = {
	...defaultConfig.tokens.radius,
	...borderRadii,
	true: borderRadii.none,
}
const size = {
	...defaultConfig.tokens.size,
	...iconSizes,
}
const space = {
	...defaultConfig.tokens.space,
	...spacing,
	...gap,
	true: spacing.spacingSm,
}
const zIndex = {
	...defaultConfig.tokens.zIndex,
	...zIndices,
	true: zIndices.default,
}

export const tamaguiConfig = createTamagui({
	...defaultConfig,
	animations,
	fonts,
	media,
	shorthands: {}, // Disabled
	themes,
	tokens: createTokens({
		...defaultConfig.tokens,
		color: {
			true: themes.light.onSurface,
		},
		radius,
		page: {
			...pageConstraints,
		},
		size,
		space,
		zIndex,
	}),
	settings: {
		defaultFont: 'body',
		disableSSR: true,
		// shouldAddPrefersColorThemes: true,
		// themeClassNameOnRoot: true,
	},
})

// For Babel in Expo app
export default tamaguiConfig
