import type { PlannerOutput } from '@aipacto/agents-domain'
import type { LanguageCode } from '@aipacto/shared-domain'
import { Annotation, MessagesAnnotation } from '@langchain/langgraph'

export const PlannerAgentState = Annotation.Root({
	// Messages for conversation history
	messages: MessagesAnnotation.spec.messages,

	// Context for storing additional information
	context: Annotation<{
		question?: string
		language?: LanguageCode
		additionalContext?: Record<string, unknown>
	}>({
		reducer: (prev, next) => ({ ...prev, ...next }),
		default: () => ({}),
	}),

	// Output of the planning
	planner: Annotation<PlannerOutput | undefined>({
		reducer: (prev, next) => next ?? prev,
		default: () => undefined,
	}),

	// Error handling
	error: Annotation<string | null>({
		reducer: (_prev, next) => next,
		default: () => null,
	}),
})

export type PlannerAgentStateType = typeof PlannerAgentState.State
