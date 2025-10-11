import {
	autoUpdate,
	FloatingFocusManager,
	flip,
	offset,
	shift,
	useDismiss,
	useFloating,
	useId,
	useInteractions,
	useRole,
} from '@floating-ui/react'
import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import {
	ClientOnly,
	createFileRoute,
	useNavigate,
} from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Folder,
	MoreVertical,
	Plus,
	Search,
	Trash2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { CoButtonText, CoTextField } from '~components/ui'
import {
	createDocument as createDocumentServerFn,
	deleteDocument as deleteDocumentServerFn,
	getDocuments,
} from '~server'

interface Document {
	id: string
	title: string
	description: string
	path: string
	createdAt?: string
	updatedAt?: string
	lastModifiedBy?: string
}

interface CreateDocumentForm {
	title: string
	description: string
	path: string
}

interface FolderObj {
	folders: Record<string, FolderObj>
	documents: Document[]
}

interface FolderNode {
	name: string
	path: string
	type: 'folder'
	children: TreeNode[]
	expanded?: boolean
}

interface DocumentNode {
	name: string
	path: string
	type: 'document'
	document: Document
}

type TreeNode = FolderNode | DocumentNode

// Query options for documents
const documentsQuery = queryOptions({
	queryKey: ['documents'],
	queryFn: () => getDocuments(),
	staleTime: 1000 * 60 * 5, // 5 minutes
})

// Parse documents into folder structure
function parseDocumentsToTree(documents: Document[]): TreeNode[] {
	const root: FolderObj = { folders: {}, documents: [] }
	documents.forEach(doc => {
		// Normalize path: remove leading/trailing slashes, handle empty paths
		let normalizedPath = doc.path || ''
		normalizedPath = normalizedPath.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
		// Split path and filter out empty parts
		const pathParts = normalizedPath
			.split('/')
			.filter(part => part.trim() !== '')
			.map(part => part.trim()) // Clean up whitespace
		let current: FolderObj = root
		// Create folder structure
		pathParts.forEach(part => {
			if (!current.folders[part]) {
				current.folders[part] = { folders: {}, documents: [] }
			}
			current = current.folders[part]
		})
		// Add document to the final folder
		current.documents.push(doc)
	})

	function buildTree(folderObj: FolderObj, basePath = ''): TreeNode[] {
		const nodes: TreeNode[] = []
		// Add folders
		Object.keys(folderObj.folders).forEach(key => {
			const subFolderObj = folderObj.folders[key]
			if (!subFolderObj) return
			const folderPath = basePath ? `${basePath}/${key}` : key
			const folder: FolderNode = {
				name: key,
				path: folderPath,
				type: 'folder',
				children: buildTree(subFolderObj, folderPath),
				expanded: true, // Default to expanded
			}
			nodes.push(folder)
		})
		// Add documents
		folderObj.documents.forEach((doc: Document) => {
			const docNode: DocumentNode = {
				name: doc.title,
				path: basePath,
				type: 'document',
				document: doc,
			}
			nodes.push(docNode)
		})
		return nodes.sort((a, b) => {
			// Folders first, then documents
			if (a.type === 'folder' && b.type === 'document') return -1
			if (a.type === 'document' && b.type === 'folder') return 1
			return a.name.localeCompare(b.name)
		})
	}

	return buildTree(root, '')
}

export const Route = createFileRoute('/_authenticated/docs/')({
	// Use loader to prefetch data for SSR
	loader: ({ context: { queryClient } }) => {
		return queryClient.ensureQueryData(documentsQuery)
	},
	component: DocsListPage,
	// Optional: Configure SSR behavior
	ssr: true, // Full SSR (default)
})

// Tree item styles
const treeItemVariants = cva([
	'group relative',
	'flex items-center gap-[var(--spacing-sm)]',
	'transition-all duration-200',
	'hover:bg-[var(--surface-container)]',
	'cursor-pointer',
	'select-none',
	'min-h-[44px]', // Touch-friendly minimum height
	'px-[var(--spacing-sm)]',
	'py-[var(--spacing-xs)]',
])

// Create document mutation
function useCreateDocument() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	return useMutation({
		mutationFn: (data: CreateDocumentForm) => createDocumentServerFn({ data }),
		onSuccess: data => {
			queryClient.invalidateQueries({ queryKey: ['documents'] })
			if (data.documentId) {
				navigate({ to: '/docs/$docId', params: { docId: data.documentId } })
			}
		},
	})
}

// Delete document mutation
function useDeleteDocument() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (docId: string) => deleteDocumentServerFn({ data: docId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['documents'] })
		},
	})
}

// Floating menu component (now wrapped in ClientOnly internally)
function DocumentMenu({
	document,
	onDelete,
	anchorEl,
	isOpen,
	onClose,
}: {
	document: Document
	onDelete: (id: string) => void
	anchorEl: HTMLElement | null
	isOpen: boolean
	onClose: () => void
}) {
	return (
		<ClientOnly fallback={null}>
			<DocumentMenuContent
				document={document}
				onDelete={onDelete}
				anchorEl={anchorEl}
				isOpen={isOpen}
				onClose={onClose}
			/>
		</ClientOnly>
	)
}

function DocumentMenuContent({
	document,
	onDelete,
	anchorEl,
	isOpen,
	onClose,
}: {
	document: Document
	onDelete: (id: string) => void
	anchorEl: HTMLElement | null
	isOpen: boolean
	onClose: () => void
}) {
	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: onClose,
		middleware: [offset(4), flip(), shift()],
		whileElementsMounted: autoUpdate,
	})
	const dismiss = useDismiss(context)
	const role = useRole(context)
	const { getFloatingProps } = useInteractions([dismiss, role])

	if (!isOpen || !anchorEl) return null
	refs.setReference(anchorEl)

	return (
		<div
			ref={refs.setFloating}
			style={floatingStyles}
			className='z-[var(--z-index-popover)] bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-[var(--radius-md)] shadow-lg py-[var(--spacing-xs)] min-w-[160px]'
			{...getFloatingProps()}
		>
			<button
				type='button'
				onClick={() => {
					onDelete(document.id)
					onClose()
				}}
				className='w-full flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--font-size-body-m)] text-[var(--on-surface)] hover:bg-[var(--error-container)] hover:text-[var(--on-error-container)] transition-colors'
			>
				<Trash2 className='w-4 h-4' />
				Delete
			</button>
		</div>
	)
}

function TreeItem({
	node,
	depth = 0,
	onToggle,
	onDelete,
}: {
	node: TreeNode
	depth?: number
	onToggle: (path: string) => void
	onDelete: (id: string) => void
}) {
	const navigate = useNavigate()
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
	const [showMenu, setShowMenu] = useState(false)

	const handleActionsMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation()
		setMenuAnchor(e.currentTarget)
		setShowMenu(true)
	}

	const handleItemClick = () => {
		if (node.type === 'folder') {
			onToggle(node.path)
		} else {
			navigate({ to: '/docs/$docId', params: { docId: node.document.id } })
		}
	}

	return (
		<>
			<button
				type='button'
				className={treeItemVariants()}
				style={{ paddingLeft: `${depth * 20 + 12}px` }}
				onClick={handleItemClick}
			>
				{node.type === 'folder' ? (
					<>
						{(node as FolderNode).expanded ? (
							<ChevronDown className='w-4 h-4 text-[var(--on-surface-variant)]' />
						) : (
							<ChevronRight className='w-4 h-4 text-[var(--on-surface-variant)]' />
						)}
						<Folder className='w-5 h-5 text-[var(--primary)]' />
						<span className='text-[var(--font-size-body-m)] text-[var(--on-surface)] font-medium'>
							{node.name}
						</span>
					</>
				) : (
					<>
						<div className='w-4 h-4' />
						<FileText className='w-5 h-5 text-[var(--primary)]' />
						<div className='flex flex-col'>
							<span className='text-[var(--font-size-body-m)] text-[var(--on-surface)] font-medium'>
								{node.name}
							</span>
							<span className='text-[var(--font-size-label-s)] text-[var(--on-surface-variant)] line-clamp-1'>
								{(node as DocumentNode).document.description}
							</span>
						</div>
						<button
							type='button'
							onClick={handleActionsMenuClick}
							className='opacity-0 group-hover:opacity-100 p-[var(--spacing-xs)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-container)] transition-all touch-manipulation'
							title='More actions'
						>
							<MoreVertical className='w-4 h-4 text-[var(--on-surface-variant)]' />
						</button>
					</>
				)}
			</button>
			{node.type === 'folder' && (node as FolderNode).expanded && (
				<div>
					{(node as FolderNode).children.map(child => (
						<TreeItem
							key={child.path}
							node={child}
							depth={depth + 1}
							onToggle={onToggle}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
			{node.type === 'document' && showMenu && menuAnchor && (
				<DocumentMenu
					document={(node as DocumentNode).document}
					onDelete={onDelete}
					anchorEl={menuAnchor}
					isOpen={showMenu}
					onClose={() => setShowMenu(false)}
				/>
			)}
		</>
	)
}

// Document Tree View Component
function DocumentTree({
	documents,
	onDelete,
}: {
	documents: Document[]
	onDelete: (id: string) => void
}) {
	const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
		new Set(),
	)

	const treeData = useMemo(() => {
		const tree = parseDocumentsToTree(documents)
		// Function to recursively update expanded state
		function updateExpandedState(nodes: TreeNode[]): TreeNode[] {
			return nodes.map(node => {
				if (node.type === 'folder') {
					const folderNode = node as FolderNode
					return {
						...folderNode,
						expanded: !collapsedFolders.has(folderNode.path), // Default expanded unless explicitly collapsed
						children: updateExpandedState(folderNode.children),
					} as FolderNode
				}
				return node
			})
		}
		return updateExpandedState(tree)
	}, [documents, collapsedFolders])

	const handleToggle = (path: string) => {
		setCollapsedFolders(prev => {
			const newSet = new Set(prev)
			if (newSet.has(path)) {
				newSet.delete(path) // Expand (remove from collapsed set)
			} else {
				newSet.add(path) // Collapse (add to collapsed set)
			}
			return newSet
		})
	}

	return (
		<div className='flex flex-col'>
			{treeData.map(node => (
				<TreeItem
					key={node.path}
					node={node}
					onToggle={handleToggle}
					onDelete={onDelete}
				/>
			))}
		</div>
	)
}

function CreateDocumentDialog({
	isOpen,
	onClose,
	onCreate,
}: {
	isOpen: boolean
	onClose: () => void
	onCreate: (data: CreateDocumentForm) => void
}) {
	if (!isOpen) return null

	return (
		<ClientOnly fallback={null}>
			<CreateDocumentDialogContent onClose={onClose} onCreate={onCreate} />
		</ClientOnly>
	)
}

function CreateDocumentDialogContent({
	onClose,
	onCreate,
}: {
	onClose: () => void
	onCreate: (data: CreateDocumentForm) => void
}) {
	const [formData, setFormData] = useState<CreateDocumentForm>({
		title: '',
		description: '',
		path: '/',
	})

	const { refs, floatingStyles, context } = useFloating({
		open: true, // Always open here since we check isOpen outside
		onOpenChange: onClose,
		middleware: [offset(8), flip(), shift()],
		whileElementsMounted: autoUpdate,
	})

	const dismiss = useDismiss(context)
	const role = useRole(context)
	const { getFloatingProps } = useInteractions([dismiss, role])

	const headingId = useId()

	return (
		<>
			{/* Backdrop */}
			<div className='fixed inset-0 bg-[var(--scrim)] bg-opacity-50 z-[var(--z-index-modal-backdrop)]' />
			{/* Dialog */}
			<FloatingFocusManager context={context} modal={true}>
				<div
					ref={refs.setFloating}
					style={{
						...floatingStyles,
						position: 'fixed',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
					className='z-[var(--z-index-modal)] p-[var(--spacing-lg)] bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-[var(--radius-lg)] shadow-[var(--layout-shadow-elevation-lg)] min-w-[500px]'
					role='dialog'
					aria-labelledby={headingId}
					{...getFloatingProps()}
				>
					<h2
						id={headingId}
						className='text-[var(--font-size-heading-m)] font-medium text-[var(--on-surface)] mb-[var(--spacing-md)]'
					>
						Create New Document
					</h2>
					<div className='flex flex-col gap-[var(--spacing-md)]'>
						<CoTextField
							label='Title'
							value={formData.title}
							onChange={e =>
								setFormData({ ...formData, title: e.target.value })
							}
							placeholder='Enter document title'
							required
						/>
						<CoTextField
							label='Description'
							value={formData.description}
							onChange={e =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder='Enter document description'
						/>
						<CoTextField
							label='Path'
							value={formData.path}
							onChange={e => setFormData({ ...formData, path: e.target.value })}
							placeholder='/folder/subfolder'
						/>
					</div>
					<div className='flex gap-[var(--spacing-md)] justify-end mt-[var(--spacing-lg)]'>
						<CoButtonText onClick={onClose} variant='text'>
							Cancel
						</CoButtonText>
						<CoButtonText
							onClick={() => {
								onCreate(formData)
								onClose()
							}}
							disabled={!formData.title || !formData.description}
							variant='filled'
						>
							Create Document
						</CoButtonText>
					</div>
				</div>
			</FloatingFocusManager>
		</>
	)
}

function DocsListPage() {
	const [searchQuery, setSearchQuery] = useState('')
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	// Use useSuspenseQuery for better SSR performance
	const { data: documents = [] } = useSuspenseQuery(documentsQuery)

	const createMutation = useCreateDocument()
	const deleteMutation = useDeleteDocument()

	const handleDelete = useCallback(
		(id: string) => {
			deleteMutation.mutate(id)
		},
		[deleteMutation],
	)

	// Filter documents based on search
	const filteredDocuments = useMemo(() => {
		if (!searchQuery) return documents
		const query = searchQuery.toLowerCase()
		return documents.filter(
			doc =>
				doc.title.toLowerCase().includes(query) ||
				doc.description.toLowerCase().includes(query) ||
				doc.path.toLowerCase().includes(query),
		)
	}, [documents, searchQuery])

	return (
		<div className='h-screen flex flex-col bg-[var(--background)]'>
			{/* Header */}
			<div className='border-b border-[var(--outline-variant)] bg-[var(--surface)]'>
				<div className='flex justify-between px-[var(--spacing-lg)] py-[var(--spacing-md)]'>
					{/* Search Bar */}
					<div className='relative max-w-md'>
						<Search className='absolute start-[var(--spacing-sm)] top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--on-surface-variant)]' />
						<input
							type='search'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder='Search documents...'
							className='w-full ps-[calc(var(--spacing-sm)+var(--spacing-lg))] pe-[var(--spacing-md)] py-[var(--spacing-sm)] bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-[var(--radius-md)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
						/>
					</div>
					{/* Create Button */}
					<CoButtonText
						onClick={() => setShowCreateDialog(true)}
						variant='filled'
						leadingIcon={Plus}
					>
						New Document
					</CoButtonText>
				</div>
			</div>
			{/* Content Area */}
			<div className='flex-1 overflow-auto p-[var(--spacing-lg)]'>
				{filteredDocuments.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full'>
						<FileText className='w-16 h-16 text-[var(--on-surface-variant)] mb-[var(--spacing-md)]' />
						<h2 className='text-[var(--font-size-heading-m)] text-[var(--on-surface)] mb-[var(--spacing-sm)]'>
							{searchQuery ? 'No documents found' : 'No documents yet'}
						</h2>
						<p className='text-[var(--font-size-body-m)] text-[var(--on-surface-variant)] mb-[var(--spacing-lg)]'>
							{searchQuery
								? 'Try adjusting your search criteria'
								: 'Create your first document to get started'}
						</p>
					</div>
				) : (
					<DocumentTree documents={filteredDocuments} onDelete={handleDelete} />
				)}
			</div>
			{/* Create Dialog */}
			<CreateDocumentDialog
				isOpen={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
				onCreate={data => createMutation.mutate(data)}
			/>
			{/* Status Bar */}
			<div className='px-[var(--spacing-lg)] py-[var(--spacing-sm)] border-t border-[var(--outline-variant)] bg-[var(--surface-container)] flex justify-between items-center'>
				<div className='text-[var(--font-size-label-m)] text-[var(--on-surface-variant)]'>
					{filteredDocuments.length}{' '}
					{filteredDocuments.length === 1 ? 'document' : 'documents'}
				</div>
				<div className='text-[var(--font-size-label-m)] text-[var(--on-surface-variant)]'>
					Last updated: {new Date().toLocaleDateString()}
				</div>
			</div>
		</div>
	)
}
