import {
	autoUpdate,
	FloatingFocusManager,
	flip,
	offset,
	shift,
	useClick,
	useDismiss,
	useFloating,
	useId,
	useInteractions,
	useRole,
} from '@floating-ui/react'
import {
	ClientOnly,
	createFileRoute,
	useNavigate,
} from '@tanstack/react-router'
import { Mark as TiptapMark } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { type Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cva } from 'class-variance-authority'
import { LoroDoc, type LoroText } from 'loro-crdt'
import { ArrowLeft, Settings } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CoButtonText, CoTextField } from '~components/ui'
import { getWebSocketUrl, useSession } from '~hooks'

// Resolve API base for browser code:
// - In pnpm dev, VITE_SERVER_URL is typically unset; use relative paths so Vite proxy works.
// - In Docker/prod, VITE_SERVER_URL is set to the API origin.
const API_BASE = import.meta.env.VITE_SERVER_URL
	? import.meta.env.VITE_SERVER_URL.replace(/\/$/, '')
	: ''

const DocEditorPageFallback = () => (
	<div className='flex h-screen items-center justify-center bg-[var(--surface)] text-[var(--on-surface-variant)]'>
		Loading editor...
	</div>
)

export const Route = createFileRoute('/_authenticated/docs/$docId')({
	component: () => (
		<ClientOnly fallback={<DocEditorPageFallback />}>
			<DocEditorPage />
		</ClientOnly>
	),
})

// Custom Suggestion Extension for AI suggestions
const Suggestion = TiptapMark.create({
	name: 'suggestion',

	addOptions() {
		return {
			HTMLAttributes: {},
			suggestionId: null,
			suggestionType: 'addition', // 'addition', 'deletion', 'replacement'
		}
	},

	addAttributes() {
		return {
			suggestionId: {
				default: null,
				parseHTML: element => element.getAttribute('data-suggestion-id'),
				renderHTML: attributes => {
					if (!attributes.suggestionId) return {}
					return {
						'data-suggestion-id': attributes.suggestionId,
					}
				},
			},
			suggestionType: {
				default: 'addition',
				parseHTML: element => element.getAttribute('data-suggestion-type'),
				renderHTML: attributes => ({
					'data-suggestion-type': attributes.suggestionType,
				}),
			},
			author: {
				default: 'AI Assistant',
				parseHTML: element => element.getAttribute('data-author'),
				renderHTML: attributes => ({
					'data-author': attributes.author,
				}),
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-suggestion-id]',
			},
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', { ...HTMLAttributes, class: 'suggestion' }, 0]
	},
})

// Comment Extension for AI feedback
const Comment = TiptapMark.create({
	name: 'comment',

	addAttributes() {
		return {
			commentId: {
				default: null,
				parseHTML: element => element.getAttribute('data-comment-id'),
				renderHTML: attributes => {
					if (!attributes.commentId) return {}
					return {
						'data-comment-id': attributes.commentId,
					}
				},
			},
			content: {
				default: '',
				parseHTML: element => element.getAttribute('data-content'),
				renderHTML: attributes => ({
					'data-content': attributes.content,
				}),
			},
			author: {
				default: 'AI Assistant',
				parseHTML: element => element.getAttribute('data-author'),
				renderHTML: attributes => ({
					'data-author': attributes.author,
				}),
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-comment-id]',
			},
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', { ...HTMLAttributes, class: 'comment' }, 0]
	},
})

// Toolbar button styles using CVA
const toolbarButtonVariants = cva(
	[
		'inline-flex items-center justify-center',
		'px-[var(--spacing-sm)] py-[var(--spacing-xs)]',
		'text-[var(--font-size-label-m)]',
		'border border-[var(--outline-variant)]',
		'rounded-[var(--radius-sm)]',
		'bg-[var(--surface)]',
		'text-[var(--on-surface)]',
		'cursor-pointer',
		'transition-all duration-200',
		'hover:bg-[var(--surface-container)]',
		'active:scale-95',
		'disabled:opacity-50 disabled:cursor-not-allowed',
		'focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
	],
	{
		variants: {
			active: {
				true: [
					'bg-[var(--primary-container)]',
					'text-[var(--on-primary-container)]',
					'border-[var(--primary)]',
				],
			},
			variant: {
				default: [],
				ai: [
					'bg-[var(--tertiary-container)]',
					'text-[var(--on-tertiary-container)]',
					'border-[var(--tertiary)]',
				],
			},
		},
		defaultVariants: {
			active: false,
			variant: 'default',
		},
	},
)

interface SuggestionType {
	id: string
	type: 'addition' | 'deletion' | 'replacement'
	content: string
	reason: string
	position: { from: number; to: number }
	status: 'pending' | 'accepted' | 'rejected'
}

interface CommentType {
	id: string
	content: string
	position: { from: number; to: number }
	author: string
	timestamp: Date
}

// Toolbar component
function EditorToolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null

	return (
		<div className='flex flex-wrap gap-[var(--spacing-xs)] p-[var(--spacing-sm)] border border-[var(--outline-variant)] border-b-0 bg-[var(--surface-container)]'>
			{/* Text Formatting */}
			<div className='flex gap-[var(--spacing-xxs)]'>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={!editor.can().chain().focus().toggleBold().run()}
					className={toolbarButtonVariants({ active: editor.isActive('bold') })}
					title='Bold (Ctrl+B)'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Bold</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z'
						/>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z'
						/>
					</svg>
				</button>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={!editor.can().chain().focus().toggleItalic().run()}
					className={toolbarButtonVariants({
						active: editor.isActive('italic'),
					})}
					title='Italic (Ctrl+I)'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Italic</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M10 4h4M14 4L8 20M6 20h4'
						/>
					</svg>
				</button>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleStrike().run()}
					disabled={!editor.can().chain().focus().toggleStrike().run()}
					className={toolbarButtonVariants({
						active: editor.isActive('strike'),
					})}
					title='Strikethrough'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Strikethrough</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M12 12h8M4 12h4m2-6h4m-4 12h4'
						/>
					</svg>
				</button>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleHighlight().run()}
					className={toolbarButtonVariants({
						active: editor.isActive('highlight'),
					})}
					title='Highlight'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Highlight</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
						/>
					</svg>
				</button>
			</div>

			<div className='w-px bg-[var(--outline-variant)]' />

			{/* Headings */}
			<div className='flex gap-[var(--spacing-xxs)]'>
				<button
					type='button'
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					className={toolbarButtonVariants({
						active: editor.isActive('heading', { level: 1 }),
					})}
					title='Heading 1'
				>
					H1
				</button>
				<button
					type='button'
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					className={toolbarButtonVariants({
						active: editor.isActive('heading', { level: 2 }),
					})}
					title='Heading 2'
				>
					H2
				</button>
				<button
					type='button'
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					className={toolbarButtonVariants({
						active: editor.isActive('heading', { level: 3 }),
					})}
					title='Heading 3'
				>
					H3
				</button>
			</div>

			<div className='w-px bg-[var(--outline-variant)]' />

			{/* Lists */}
			<div className='flex gap-[var(--spacing-xxs)]'>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={toolbarButtonVariants({
						active: editor.isActive('bulletList'),
					})}
					title='Bullet List'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Bullet List</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M4 6h16M4 12h16M4 18h16'
						/>
					</svg>
				</button>
				<button
					type='button'
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={toolbarButtonVariants({
						active: editor.isActive('orderedList'),
					})}
					title='Numbered List'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Numbered List</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M7 6h10M7 12h10m-7 6h7'
						/>
					</svg>
				</button>
			</div>

			<div className='w-px bg-[var(--outline-variant)]' />

			{/* History */}
			<div className='flex gap-[var(--spacing-xxs)]'>
				<button
					type='button'
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run()}
					className={toolbarButtonVariants()}
					title='Undo (Ctrl+Z)'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Undo</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
						/>
					</svg>
				</button>
				<button
					type='button'
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run()}
					className={toolbarButtonVariants()}
					title='Redo (Ctrl+Y)'
				>
					<svg
						className='w-4 h-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Redo</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6'
						/>
					</svg>
				</button>
			</div>
		</div>
	)
}

// AI Suggestions Panel
function AISuggestionsPanel({
	suggestions,
	onAccept,
	onReject,
	onJumpTo,
}: {
	suggestions: SuggestionType[]
	onAccept: (id: string) => void
	onReject: (id: string) => void
	onJumpTo: (position: { from: number; to: number }) => void
}) {
	return (
		<div className='flex flex-col gap-[var(--spacing-sm)] h-full'>
			<h3 className='text-[var(--font-size-title-m)] font-medium text-[var(--on-surface)]'>
				AI Suggestions
			</h3>
			<div className='flex-1 overflow-y-auto space-y-[var(--spacing-sm)]'>
				{suggestions.length === 0 ? (
					<p className='text-[var(--on-surface-variant)] text-[var(--font-size-body-m)]'>
						No suggestions yet. The AI will provide feedback as you write.
					</p>
				) : (
					suggestions.map(suggestion => (
						<div
							key={suggestion.id}
							className='p-[var(--spacing-md)] rounded-[var(--radius-md)] bg-[var(--surface-container)] border border-[var(--outline-variant)]'
						>
							<div className='flex items-start justify-between gap-[var(--spacing-sm)]'>
								<div className='flex-1'>
									<div className='flex items-center gap-[var(--spacing-xs)] mb-[var(--spacing-xs)]'>
										<span
											className={`
											px-[var(--spacing-xs)] py-[var(--spacing-xxs)]
											rounded-[var(--radius-sm)]
											text-[var(--font-size-label-m)]
											${
												suggestion.type === 'addition'
													? 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]'
													: suggestion.type === 'deletion'
														? 'bg-[var(--error-container)] text-[var(--on-error-container)]'
														: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]'
											}
										`}
										>
											{suggestion.type}
										</span>
										{suggestion.status === 'pending' && (
											<span className='text-[var(--on-surface-variant)] text-[var(--font-size-label-m)]'>
												Pending
											</span>
										)}
									</div>
									<p className='text-[var(--on-surface)] text-[var(--font-size-body-m)] mb-[var(--spacing-xs)]'>
										{suggestion.content}
									</p>
									<p className='text-[var(--on-surface-variant)] text-[var(--font-size-label-m)]'>
										{suggestion.reason}
									</p>
								</div>
								{suggestion.status === 'pending' && (
									<div className='flex gap-[var(--spacing-xs)]'>
										<button
											type='button'
											onClick={() => onAccept(suggestion.id)}
											className={toolbarButtonVariants({ variant: 'ai' })}
											title='Accept suggestion'
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<title>Accept suggestion</title>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M5 13l4 4L19 7'
												/>
											</svg>
										</button>
										<button
											type='button'
											onClick={() => onReject(suggestion.id)}
											className={toolbarButtonVariants()}
											title='Reject suggestion'
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<title>Reject suggestion</title>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M6 18L18 6M6 6l12 12'
												/>
											</svg>
										</button>
										<button
											type='button'
											onClick={() => onJumpTo(suggestion.position)}
											className={toolbarButtonVariants()}
											title='Jump to location'
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<title>Jump to location</title>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
												/>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
												/>
											</svg>
										</button>
									</div>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	)
}

function DocEditorPage() {
	const { docId } = Route.useParams()
	const session = useSession()
	const navigate = useNavigate()

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [path, setPath] = useState('/')
	const [showAIPanel, setShowAIPanel] = useState(false)
	const [showMetadataPanel, setShowMetadataPanel] = useState(false)
	const [suggestions, setSuggestions] = useState<SuggestionType[]>([])
	const [_comments, _setCommentss] = useState<CommentType[]>([])
	const [isAIProcessing, setIsAIProcessing] = useState(false)
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [localDoc] = useState<LoroDoc>(new LoroDoc())
	const [unsubscribeLocalUpdates, setUnsubscribeLocalUpdates] = useState<
		(() => void) | null
	>(null)
	const [isConnected, setIsConnected] = useState(false)
	const isRemoteUpdate = useRef(false)
	const isLocalUpdate = useRef(false)
	const debounceTimer = useRef<NodeJS.Timeout | null>(null)

	// Floating UI setup for metadata panel
	const { refs, floatingStyles, context } = useFloating({
		open: showMetadataPanel,
		onOpenChange: setShowMetadataPanel,
		middleware: [offset(8), flip(), shift()],
		whileElementsMounted: autoUpdate,
	})

	const click = useClick(context)
	const dismiss = useDismiss(context)
	const role = useRole(context)

	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
		role,
	])

	const headingId = useId()

	// Initialize Tiptap editor with AI-focused extensions
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// history: false, // We use Loro for collaborative history
			}),
			Placeholder.configure({
				placeholder:
					'Start writing your document. AI will provide suggestions as you type...',
			}),
			Highlight.configure({
				HTMLAttributes: {
					class:
						'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]',
				},
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-[var(--primary)] underline',
				},
			}),
			Typography,
			Suggestion,
			Comment,
		],
		content: '',
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px]',
			},
		},
		onUpdate: ({ editor }) => {
			// Only sync to Loro if this is a local update (not from remote)
			if (!isRemoteUpdate.current) {
				isLocalUpdate.current = true
				const htmlContent = editor.getHTML()

				// Update Loro document
				const documentMap = localDoc.getMap('document')
				let contentText = documentMap.get('content') as LoroText

				if (!contentText || typeof contentText === 'string') {
					// If content doesn't exist or is a string, create/get the text container
					contentText = localDoc.getText('content')
					documentMap.setContainer('content', contentText)
				}

				// Use update instead of delete + insert for better performance
				contentText.update(htmlContent)
				localDoc.commit()

				// Debounce AI processing
				if (debounceTimer.current) {
					clearTimeout(debounceTimer.current)
				}
				debounceTimer.current = setTimeout(() => {
					if (!isAIProcessing) {
						processWithAI(htmlContent)
					}
				}, 1000)

				isLocalUpdate.current = false
			}
		},
		immediatelyRender: false,
	})

	// Load document from server
	const loadDocument = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/v1/docs/${docId}`, {
				credentials: 'include',
			})
			if (response.ok) {
				const data = await response.json()
				if (data.success && data.document) {
					setTitle(data.document.title || '')
					setDescription(data.document.description || '')
					setPath(data.document.path || '/')

					// Set content if available
					if (data.document.content && editor) {
						editor.commands.setContent(data.document.content)
					}
				}
			}
		} catch {
			// Failed to load document - could show user notification
		}
	}, [docId, editor])

	// Subscribe to Loro document changes
	useEffect(() => {
		const documentMap = localDoc.getMap('document')

		// Initialize content text container if it doesn't exist
		let contentText: LoroText
		const existingContent = documentMap.get('content')

		if (!existingContent || typeof existingContent === 'string') {
			// Create and set the content container properly
			contentText = localDoc.getText('content')
			documentMap.setContainer('content', contentText)
			localDoc.commit()
		} else {
			// Content is already a container
			contentText = existingContent as LoroText
		}

		const sub = localDoc.subscribe(event => {
			// Only update editor if this is a remote update
			if (!isLocalUpdate.current && event.by === 'import') {
				const newContent = contentText.toString()
				if (editor && editor.getHTML() !== newContent) {
					isRemoteUpdate.current = true
					editor.commands.setContent(newContent)
					// Reset the flag after a short delay
					setTimeout(() => {
						isRemoteUpdate.current = false
					}, 10)
				}
			}
		})

		return () => {
			sub()
		}
	}, [editor, localDoc])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (ws) ws.close()
			if (unsubscribeLocalUpdates) unsubscribeLocalUpdates()
			if (debounceTimer.current) clearTimeout(debounceTimer.current)
		}
	}, [ws, unsubscribeLocalUpdates])

	// Process content with AI (mock implementation)
	const processWithAI = useCallback(async (content: string) => {
		if (!content || content.length < 50) return

		setIsAIProcessing(true)

		// Simulate AI processing delay
		setTimeout(() => {
			// Mock AI suggestions
			const mockSuggestions: SuggestionType[] = [
				{
					id: `suggestion-${Date.now()}`,
					type: 'replacement',
					content: 'Consider using more concise language here',
					reason: 'This paragraph could be more direct and impactful',
					position: { from: 10, to: 50 },
					status: 'pending',
				},
			]

			setSuggestions(prev => [...prev, ...mockSuggestions])
			setIsAIProcessing(false)
		}, 2000)
	}, [])

	// Handle metadata changes
	const handleMetadataChange = async (
		field: 'title' | 'description' | 'path',
		value: string,
	) => {
		const documentMap = localDoc.getMap('document')
		documentMap.set(field, value)
		localDoc.commit()

		if (field === 'title') setTitle(value)
		if (field === 'description') setDescription(value)
		if (field === 'path') setPath(value)

		// Save to server
		try {
			await fetch(`${API_BASE}/v1/docs/${docId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					[field]: value,
				}),
				credentials: 'include',
			})
		} catch {
			// Failed to update metadata - could show user notification
		}
	}

	// Connect WebSocket for Loro sync
	const handleConnectWS = useCallback(() => {
		if (!docId) return

		const wsUrl = getWebSocketUrl(API_BASE, `/v1/docs/${docId}/sync`)
		console.log('Connecting to WebSocket:', wsUrl)

		const socket = new WebSocket(wsUrl)

		socket.onopen = () => {
			console.log('WebSocket connected')
			setIsConnected(true)

			// Send initial document state for sync
			const updates = localDoc.export({ mode: 'update' })
			socket.send(updates)
		}

		socket.onmessage = event => {
			console.log('WebSocket message received')
			if (event.data instanceof Blob) {
				event.data.arrayBuffer().then(buffer => {
					isRemoteUpdate.current = true
					localDoc.import(new Uint8Array(buffer))
					setTimeout(() => {
						isRemoteUpdate.current = false
					}, 10)
				})
			}
		}

		socket.onclose = event => {
			console.log('WebSocket closed:', event.code, event.reason)
			setIsConnected(false)
		}

		socket.onerror = error => {
			console.error('WebSocket error:', error)
			setIsConnected(false)
		}

		setWs(socket)

		// Subscribe to local updates to send to server
		const unsubscribe = localDoc.subscribeLocalUpdates(update => {
			if (socket.readyState === WebSocket.OPEN && !isRemoteUpdate.current) {
				socket.send(update)
			}
		})
		setUnsubscribeLocalUpdates(() => unsubscribe)
	}, [docId, localDoc])

	// Load document data on mount
	useEffect(() => {
		if (docId) {
			loadDocument()
			handleConnectWS()
		}
	}, [docId, loadDocument, handleConnectWS])

	// Handle suggestion acceptance
	const handleAcceptSuggestion = (id: string) => {
		const suggestion = suggestions.find(s => s.id === id)
		if (!suggestion || !editor) return

		// Apply the suggestion to the editor
		if (suggestion.type === 'addition') {
			editor
				.chain()
				.focus()
				.insertContentAt(suggestion.position.from, suggestion.content)
				.run()
		} else if (suggestion.type === 'deletion') {
			editor.chain().focus().deleteRange(suggestion.position).run()
		}

		// Update suggestion status
		setSuggestions(prev =>
			prev.map(s => (s.id === id ? { ...s, status: 'accepted' } : s)),
		)
	}

	// Handle suggestion rejection
	const handleRejectSuggestion = (id: string) => {
		setSuggestions(prev =>
			prev.map(s => (s.id === id ? { ...s, status: 'rejected' } : s)),
		)
	}

	// Jump to suggestion location
	const handleJumpToSuggestion = (position: { from: number; to: number }) => {
		if (!editor) return
		editor.chain().focus().setTextSelection(position).run()
	}

	// Request AI review
	const _handleRequestAIReview = () => {
		if (!editor) return
		setIsAIProcessing(true)
		processWithAI(editor.getHTML())
	}

	if (session.isPending) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-[var(--font-size-title-m)]'>Loading...</div>
			</div>
		)
	}

	return (
		<div className='h-screen flex flex-col bg-[var(--background)]'>
			{/* Header */}
			<div className='p-[var(--spacing-md)] border-b border-[var(--outline-variant)] bg-[var(--surface)]'>
				<div className='flex gap-[var(--spacing-md)] items-center'>
					{/* Back button */}
					<CoButtonText
						onClick={() => navigate({ to: '/docs' })}
						variant='text'
						size='sm'
						leadingIcon={ArrowLeft}
						title='Back to documents'
					>
						Back
					</CoButtonText>

					{/* Document title */}
					<div className='flex-1'>
						<input
							type='text'
							value={title}
							onChange={e => handleMetadataChange('title', e.target.value)}
							placeholder='Untitled Document'
							className='text-[var(--font-size-heading-m)] font-medium text-[var(--on-surface)] bg-transparent border-none outline-none focus:ring-2 focus:ring-[var(--primary)] rounded-[var(--radius-sm)] px-[var(--spacing-xs)] -mx-[var(--spacing-xs)]'
						/>
					</div>

					{/* Settings button */}
					<CoButtonText
						ref={refs.setReference}
						variant='text'
						size='sm'
						leadingIcon={Settings}
						title='Document Settings'
						{...getReferenceProps()}
					>
						Settings
					</CoButtonText>

					{/* Metadata Panel */}
					{showMetadataPanel && (
						<FloatingFocusManager context={context} modal={false}>
							<div
								ref={refs.setFloating}
								style={floatingStyles}
								className='z-10 p-[var(--spacing-md)] bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-[var(--radius-md)] shadow-lg min-w-[400px]'
								role='dialog'
								aria-labelledby={headingId}
								{...getFloatingProps()}
							>
								<div className='flex flex-col gap-[var(--spacing-md)]'>
									<h3
										id={headingId}
									className='text-[var(--font-size-title-m)] font-medium text-[var(--on-surface)]'
									>
										Document Settings
									</h3>
									<CoTextField
										label='Path'
										value={path}
										onChange={e => handleMetadataChange('path', e.target.value)}
									/>
									<CoTextField
										label='Description'
										value={description}
										onChange={e =>
											handleMetadataChange('description', e.target.value)
										}
									/>
								</div>
							</div>
						</FloatingFocusManager>
					)}

					<CoButtonText
						onClick={() => setShowAIPanel(!showAIPanel)}
						variant='outlined'
					>
						{showAIPanel ? 'Hide' : 'Show'} AI
					</CoButtonText>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Editor Section */}
				<div className='flex-1 flex flex-col'>
					{/* Toolbar */}
					<div>
						<div className='flex justify-between items-center'>
							<div />
							<div className='flex items-center gap-[var(--spacing-sm)]'>
								{isConnected && (
									<span className='flex items-center gap-[var(--spacing-xs)] text-[var(--tertiary)]'>
										<span className='w-2 h-2 bg-[var(--tertiary)] rounded-full animate-pulse' />
										Connected
									</span>
								)}
							</div>
						</div>
						<EditorToolbar editor={editor} />
					</div>

					{/* Content - scrollable */}
					<div className='flex-1 overflow-y-auto bg-[var(--surface)] border border-[var(--outline-variant)] border-t-0'>
						<EditorContent editor={editor} />
					</div>
				</div>

				{/* AI Suggestions Panel */}
				{showAIPanel && (
					<div className='w-[400px] border-l border-[var(--outline-variant)] bg-[var(--surface)] p-[var(--spacing-md)] overflow-hidden'>
						<AISuggestionsPanel
							suggestions={suggestions}
							onAccept={handleAcceptSuggestion}
							onReject={handleRejectSuggestion}
							onJumpTo={handleJumpToSuggestion}
						/>
					</div>
				)}
			</div>

			{/* Status Bar */}
			<div className='px-[var(--spacing-md)] py-[var(--spacing-sm)] border-t border-[var(--outline-variant)] bg-[var(--surface-container)] flex justify-between items-center'>
				<div className='flex gap-[var(--spacing-lg)] text-[var(--font-size-label-m)] text-[var(--on-surface-variant)]'>
					<span>Words: {editor?.storage.characterCount?.words() || 0}</span>
					{isConnected && (
						<span className='text-[var(--tertiary)]'>Syncing</span>
					)}
				</div>
				<div className='flex items-center gap-[var(--spacing-sm)]'>
					{isAIProcessing && (
						<span className='text-[var(--tertiary)] text-[var(--font-size-label-m)] flex items-center gap-[var(--spacing-xs)]'>
							<svg
								className='animate-spin h-3 w-3'
								fill='none'
								viewBox='0 0 24 24'
							>
								<title>Loading...</title>
								<circle
									className='opacity-25'
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='4'
								/>
								<path
									className='opacity-75'
									fill='currentColor'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
								/>
							</svg>
							AI Processing...
						</span>
					)}
					<span className='text-[var(--font-size-label-m)] text-[var(--on-surface-variant)]'>
						{suggestions.filter(s => s.status === 'pending').length} pending
						suggestions
					</span>
				</div>
			</div>
		</div>
	)
}
