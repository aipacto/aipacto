/**
 * Inspired in https://tamagui.dev/ui/headings and https://github.com/status-im/status-web/blob/main/packages/components/src/text/text.tsx
 */

import type { AccessibilityRole } from 'react-native'
import { Text, type TextProps, isWeb, styled } from 'tamagui'

type CoTextProps = {
	lowercase?: boolean
	select?: false
	truncate?: boolean
	uppercase?: boolean
	wrap?: false
} & TextProps

/**
 * CoText based on Material Design https://m3.material.io/styles/typography/
 */
export const CoText = (props: CoTextProps) => (
	<Base
		{...props}
		color={props.color ?? '$onSurface'}
		// For RN compatibility, use 'accessibilityRole' instead of 'role'
		{...(isWeb ? {} : { accessibilityRole: props.role as AccessibilityRole })}
	/>
)

const Base = styled(Text, {
	name: 'CoText',

	whiteSpace: 'normal',

	variants: {
		'display-m': {
			true: {
				fontFamily: '$heading',
				fontSize: '$display-m',
				fontWeight: '400',
				letterSpacing: '$display-m',
				tag: 'h2',
				role: 'heading',
			},
		},
		'headline-l': {
			true: {
				fontFamily: '$heading',
				fontSize: '$heading-l',
				fontWeight: '400',
				letterSpacing: '$heading-l',
				tag: 'h4',
				role: 'heading',
			},
		},
		'headline-m': {
			true: {
				// fontFamily: fonts.heading.family,
				fontFamily: '$heading',
				fontSize: '$heading-m',
				fontWeight: '400',
				letterSpacing: '$heading-m',
				tag: 'h5',
				role: 'heading',
			},
		},
		title: {
			true: {
				fontFamily: '$heading',
				fontSize: '$title',
				fontWeight: '400',
				letterSpacing: '$title',
				tag: 'h6',
				role: 'heading',
			},
		},
		'body-l': {
			true: {
				fontFamily: '$body',
				fontSize: '$body-l',
				fontWeight: '400',
				letterSpacing: '$body-l',
				tag: 'span',
			},
		},
		'body-m': {
			true: {
				fontFamily: '$body',
				fontSize: '$body-m',
				fontWeight: '400',
				letterSpacing: '$body-m',
				tag: 'span',
			},
		},
		'label-l': {
			true: {
				fontFamily: '$body',
				fontSize: '$label-l',
				fontWeight: '400',
				letterSpacing: '$label-l',
				tag: 'span',
			},
		},
		'label-m': {
			true: {
				fontFamily: '$body',
				fontSize: '$label-m',
				fontWeight: '400',
				letterSpacing: '$label-m',
				tag: 'span',
			},
		},
		bold: {
			true: {
				fontWeight: '700',
			},
		},
		lowercase: {
			true: {
				textTransform: 'lowercase',
			},
		},
		uppercase: {
			true: {
				textTransform: 'uppercase',
			},
		},
		wrap: {
			false: {
				whiteSpace: 'nowrap',
			},
		},
		ellipsis: {
			true: {
				ellipsis: true,
			},
		},
	} as const,

	defaultVariants: {
		'body-l': true,
	},
})
