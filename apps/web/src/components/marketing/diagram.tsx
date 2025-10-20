import * as m from '@aipacto/shared-ui-localization/paraglide/messages'
import {
	Background,
	type Edge,
	MarkerType,
	type Node,
	Position,
	ReactFlow,
} from '@xyflow/react'
import { useMemo } from 'react'

import { useThemePreference } from '~hooks'

import '@xyflow/react/dist/style.css'

interface DiagramProps {
	type: 'documents' | 'knowledge' | 'citizen'
}

export default function Diagram({ type }: Readonly<DiagramProps>) {
	const { isDark } = useThemePreference()

	const diagramData = useMemo(() => {
		if (type === 'documents') {
			return {
				nodes: {
					textInput:
						m.marketing_pages_marketing_diagram_documents_nodes_textInput(),
					file: m.marketing_pages_marketing_diagram_documents_nodes_file(),
					database:
						m.marketing_pages_marketing_diagram_documents_nodes_database(),
					prompt: m.marketing_pages_marketing_diagram_documents_nodes_prompt(),
					model: m.marketing_pages_marketing_diagram_documents_nodes_model(),
					output: m.marketing_pages_marketing_diagram_documents_nodes_output(),
				},
			}
		}
		if (type === 'knowledge') {
			return {
				nodes: {
					chatInput:
						m.marketing_pages_marketing_diagram_knowledge_nodes_chatInput(),
					directory:
						m.marketing_pages_marketing_diagram_knowledge_nodes_directory(),
					search: m.marketing_pages_marketing_diagram_knowledge_nodes_search(),
					database:
						m.marketing_pages_marketing_diagram_knowledge_nodes_database(),
					agent: m.marketing_pages_marketing_diagram_knowledge_nodes_agent(),
					output: m.marketing_pages_marketing_diagram_knowledge_nodes_output(),
				},
			}
		}
		// citizen
		return {
			nodes: {
				webhook: m.marketing_pages_marketing_diagram_citizen_nodes_webhook(),
				router: m.marketing_pages_marketing_diagram_citizen_nodes_router(),
				quickFaqs:
					m.marketing_pages_marketing_diagram_citizen_nodes_quickFaqs(),
				agent: m.marketing_pages_marketing_diagram_citizen_nodes_agent(),
				api: m.marketing_pages_marketing_diagram_citizen_nodes_api(),
				parser: m.marketing_pages_marketing_diagram_citizen_nodes_parser(),
				output: m.marketing_pages_marketing_diagram_citizen_nodes_output(),
			},
			edges: {
				simple: m.marketing_pages_marketing_diagram_citizen_edges_simple(),
				medium: m.marketing_pages_marketing_diagram_citizen_edges_medium(),
				technical:
					m.marketing_pages_marketing_diagram_citizen_edges_technical(),
			},
		}
	}, [type])

	const nodes = useMemo<Node[]>(() => {
		const baseNodeStyle = {
			fontSize: '11px',
			fontFamily: 'var(--font-family-body)',
		}

		// Langflow-style component colors
		const inputNodeStyle = {
			...baseNodeStyle,
			background: '#E3F2FD', // Light blue for inputs
			border: '2px solid #1976D2',
			borderRadius: '8px',
			padding: '8px 12px',
			color: '#0D47A1',
		}

		const dataNodeStyle = {
			...baseNodeStyle,
			background: '#F3E5F5', // Light purple for data
			border: '2px solid #7B1FA2',
			borderRadius: '8px',
			padding: '8px 12px',
			color: '#4A148C',
		}

		const processingNodeStyle = {
			...baseNodeStyle,
			background: '#E8F5E9', // Light green for processing
			border: '2px solid #388E3C',
			borderRadius: '8px',
			padding: '8px 12px',
			color: '#1B5E20',
		}

		const modelNodeStyle = {
			...baseNodeStyle,
			background: '#FFF3E0', // Light orange for AI models
			border: '2px solid #F57C00',
			borderRadius: '8px',
			padding: '8px 12px',
			color: '#E65100',
		}

		const outputNodeStyle = {
			...baseNodeStyle,
			background: '#E0F2F1', // Light teal for outputs
			border: '2px solid #00796B',
			borderRadius: '8px',
			padding: '8px 12px',
			color: '#004D40',
		}

		if (type === 'documents') {
			const labels = diagramData.nodes
			return [
				{
					id: '1',
					position: { x: 0, y: 20 },
					data: { label: labels.textInput ?? '' },
					style: inputNodeStyle,
					sourcePosition: Position.Right,
				},
				{
					id: '2',
					position: { x: 0, y: 90 },
					data: { label: labels.file ?? '' },
					style: dataNodeStyle,
					sourcePosition: Position.Right,
				},
				{
					id: '3',
					position: { x: 0, y: 160 },
					data: { label: labels.database ?? '' },
					style: dataNodeStyle,
					sourcePosition: Position.Right,
				},
				{
					id: '4',
					position: { x: 200, y: 70 },
					data: { label: labels.prompt ?? '' },
					style: processingNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '5',
					position: { x: 400, y: 90 },
					data: { label: labels.model ?? '' },
					style: modelNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '6',
					position: { x: 580, y: 90 },
					data: { label: labels.output ?? '' },
					style: outputNodeStyle,
					targetPosition: Position.Left,
				},
			]
		}
		if (type === 'knowledge') {
			const labels = diagramData.nodes
			return [
				{
					id: '1',
					position: { x: 0, y: 70 },
					data: { label: labels.chatInput ?? '' },
					style: inputNodeStyle,
					sourcePosition: Position.Right,
				},
				{
					id: '2',
					position: { x: 180, y: 20 },
					data: { label: labels.directory ?? '' },
					style: dataNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '3',
					position: { x: 180, y: 90 },
					data: { label: labels.search ?? '' },
					style: processingNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '4',
					position: { x: 180, y: 160 },
					data: { label: labels.database ?? '' },
					style: dataNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '5',
					position: { x: 360, y: 90 },
					data: { label: labels.agent ?? '' },
					style: modelNodeStyle,
					targetPosition: Position.Left,
					sourcePosition: Position.Right,
				},
				{
					id: '6',
					position: { x: 540, y: 90 },
					data: { label: labels.output ?? '' },
					style: outputNodeStyle,
					targetPosition: Position.Left,
				},
			]
		}
		// citizen service - more complex flow
		const labels = diagramData.nodes
		return [
			{
				id: '1',
				position: { x: 0, y: 90 },
				data: { label: labels.webhook ?? '' },
				style: inputNodeStyle,
				sourcePosition: Position.Right,
			},
			{
				id: '2',
				position: { x: 160, y: 90 },
				data: { label: labels.router ?? '' },
				style: processingNodeStyle,
				targetPosition: Position.Left,
				sourcePosition: Position.Bottom,
			},
			{
				id: '3',
				position: { x: 320, y: 20 },
				data: { label: labels.quickFaqs ?? '' },
				style: processingNodeStyle,
				targetPosition: Position.Left,
				sourcePosition: Position.Right,
			},
			{
				id: '4',
				position: { x: 320, y: 90 },
				data: { label: labels.agent ?? '' },
				style: modelNodeStyle,
				targetPosition: Position.Left,
				sourcePosition: Position.Right,
			},
			{
				id: '5',
				position: { x: 320, y: 160 },
				data: { label: labels.api ?? '' },
				style: processingNodeStyle,
				targetPosition: Position.Left,
				sourcePosition: Position.Right,
			},
			{
				id: '6',
				position: { x: 480, y: 90 },
				data: { label: labels.parser ?? '' },
				style: processingNodeStyle,
				targetPosition: Position.Left,
				sourcePosition: Position.Right,
			},
			{
				id: '7',
				position: { x: 620, y: 90 },
				data: { label: labels.output ?? '' },
				style: outputNodeStyle,
				targetPosition: Position.Left,
			},
		]
	}, [diagramData, type])

	const edges = useMemo<Edge[]>(() => {
		const edgeStyle = {
			stroke: '#666',
			strokeWidth: 2,
		}

		if (type === 'documents') {
			return [
				{
					id: 'e1',
					source: '1',
					target: '4',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e2',
					source: '2',
					target: '4',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e3',
					source: '3',
					target: '4',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e4',
					source: '4',
					target: '5',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e5',
					source: '5',
					target: '6',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
			]
		}
		if (type === 'knowledge') {
			return [
				{
					id: 'e1',
					source: '1',
					target: '2',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e2',
					source: '1',
					target: '3',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e3',
					source: '1',
					target: '4',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e4',
					source: '2',
					target: '5',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e5',
					source: '3',
					target: '5',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e6',
					source: '4',
					target: '5',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
				{
					id: 'e7',
					source: '5',
					target: '6',
					animated: true,
					style: edgeStyle,
					markerEnd: { type: MarkerType.ArrowClosed },
				},
			]
		}
		return [
			{
				id: 'e1',
				source: '1',
				target: '2',
				animated: true,
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e2',
				source: '2',
				target: '3',
				animated: true,
				label: diagramData.edges?.simple,
				labelStyle: { fontSize: 10, fontWeight: 600 },
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e3',
				source: '2',
				target: '4',
				animated: true,
				label: diagramData.edges?.medium,
				labelStyle: { fontSize: 10, fontWeight: 600 },
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e4',
				source: '2',
				target: '5',
				animated: true,
				label: diagramData.edges?.technical,
				labelStyle: { fontSize: 10, fontWeight: 600 },
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e5',
				source: '3',
				target: '6',
				animated: true,
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e6',
				source: '4',
				target: '6',
				animated: true,
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e7',
				source: '5',
				target: '6',
				animated: true,
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
			{
				id: 'e8',
				source: '6',
				target: '7',
				animated: true,
				style: edgeStyle,
				markerEnd: { type: MarkerType.ArrowClosed },
			},
		]
	}, [diagramData, type])

	return (
		<div
			className='h-[45vh] rounded-lg overflow-hidden border-2 bg-white dark:bg-gray-900'
			style={{
				minHeight: '280px',
				borderColor: 'var(--outline)',
				boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				colorMode={isDark ? 'dark' : 'light'}
				proOptions={{ hideAttribution: true }}
				fitViewOptions={{ padding: 0.2 }}
				zoomOnScroll={false}
				zoomOnDoubleClick={false}
				zoomOnPinch={false}
				panOnDrag={false}
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
			>
				<Background
					color={isDark ? '#374151' : '#E5E7EB'}
					gap={20}
					size={1}
					style={{ opacity: 0.5 }}
				/>
			</ReactFlow>
		</div>
	)
}
