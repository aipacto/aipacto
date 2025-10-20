import * as m from '@aipacto/shared-ui-localization/paraglide/messages'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import {
	MarketingBenefits,
	MarketingCTA,
	MarketingHero,
	MarketingHowItWorks,
} from '~components/marketing'

export const Route = createFileRoute('/_marketing/')({
	component: MarketingHome,
})

function MarketingHome() {
	const [_index, _setIndexx] = useState(0)
	const loopPhrases = useMemo(
		() => [
			m.marketing_pages_marketing_hero_loopPhrases_0(),
			m.marketing_pages_marketing_hero_loopPhrases_1(),
			m.marketing_pages_marketing_hero_loopPhrases_2(),
			m.marketing_pages_marketing_hero_loopPhrases_3(),
			m.marketing_pages_marketing_hero_loopPhrases_4(),
		],
		[],
	)
	const _phraseCount = loopPhrases.length

	const benefitsItems = useMemo(
		() => [
			{
				title: m.marketing_pages_marketing_benefits_items_documents_title(),
				description:
					m.marketing_pages_marketing_benefits_items_documents_description(),
				diagram: 'documents' as const,
			},
			{
				title: m.marketing_pages_marketing_benefits_items_knowledge_title(),
				description:
					m.marketing_pages_marketing_benefits_items_knowledge_description(),
				diagram: 'knowledge' as const,
			},
			{
				title: m.marketing_pages_marketing_benefits_items_citizen_title(),
				description:
					m.marketing_pages_marketing_benefits_items_citizen_description(),
				diagram: 'citizen' as const,
			},
		],
		[],
	)

	const _benefitOrder = ['documents', 'knowledge', 'citizen'] as const
	const howItWorksSteps = useMemo(
		() => [
			{
				title: m.marketing_pages_marketing_howItWorks_steps_0_title(),
				description:
					m.marketing_pages_marketing_howItWorks_steps_0_description(),
			},
			{
				title: m.marketing_pages_marketing_howItWorks_steps_1_title(),
				description:
					m.marketing_pages_marketing_howItWorks_steps_1_description(),
			},
			{
				title: m.marketing_pages_marketing_howItWorks_steps_2_title(),
				description:
					m.marketing_pages_marketing_howItWorks_steps_2_description(),
			},
		],
		[],
	)

	return (
		<div className='flex flex-col min-h-screen bg-surface'>
			<MarketingHero
				headline={m.marketing_pages_marketing_hero_headline()}
				taglinePrefix={m.marketing_pages_marketing_hero_taglinePrefix()}
				loopPhrases={loopPhrases}
				description={m.marketing_pages_marketing_hero_description()}
			/>
			<MarketingBenefits
				title={m.marketing_pages_marketing_benefits_title()}
				description={m.marketing_pages_marketing_benefits_description()}
				items={benefitsItems}
				footer={m.marketing_pages_marketing_benefits_footer()}
			/>
			<MarketingHowItWorks
				title={m.marketing_pages_marketing_howItWorks_title()}
				steps={howItWorksSteps}
			/>
			<MarketingCTA
				title={m.marketing_pages_marketing_cta_title()}
				buttonText={m.marketing_pages_marketing_cta_button()}
			/>
		</div>
	)
}
