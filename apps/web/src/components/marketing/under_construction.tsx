import * as m from '@aipacto/shared-ui-localization/paraglide/messages'

export function UnderConstruction() {
	return (
		<div
			className='flex items-center justify-center border rounded-[var(--radius-lg)]'
			style={{
				padding: 'var(--spacing-md)',
				borderColor: 'var(--outline-variant)',
				background: 'var(--surface-container-low)',
			}}
		>
			<span
				className='text-label-l font-label'
				style={{ color: 'var(--on-surface-variant)' }}
			>
				{m.marketing_pages_marketing_layout_under_construction()}
			</span>
		</div>
	)
}
