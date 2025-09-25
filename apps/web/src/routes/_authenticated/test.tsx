import { createFileRoute } from '@tanstack/react-router'
import { LoroDoc } from 'loro-crdt'
import { useEffect, useId, useState } from 'react'

import { CoButtonText, CoTextField } from '~components/ui'
import { getWebSocketUrl, useAuth } from '~hooks'

const API_BASE_URL = import.meta.env.VITE_SERVER_URL

export const Route = createFileRoute('/_authenticated/test')({
	component: TestPage,
})

function TestPage() {
	const [docId, setDocId] = useState('')
	const [result, setResult] = useState<string>('')
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [wsMessages, setWsMessages] = useState<string[]>([])
	const [localDoc] = useState(new LoroDoc()) // Local Loro for testing updates/cursors
	const [_cursor] = useState<string>('') // For selection test
	const [testText, setTestText] = useState(
		'Hello World! This is test text for selection.',
	)
	const [selectionStart, setSelectionStart] = useState(0)
	const [selectionEnd, setSelectionEnd] = useState(5)
	const { authClient } = useAuth()

	const docIdFieldId = useId()
	const textareaId = useId()

	useEffect(() => {
		return () => {
			if (ws) ws.close()
		}
	}, [ws])

	// Auto-connect with debounce when docId changes
	useEffect(() => {
		if (!docId.trim()) {
			// Close existing connection if docId is empty
			if (ws) {
				ws.close()
				setWs(null)
				setWsMessages([])
			}
			return
		}

		// Debounce the connection
		const timeoutId = setTimeout(() => {
			// Close existing connection first
			if (ws) {
				ws.close()
			}

			// Create new connection
			const wsUrl = getWebSocketUrl(API_BASE_URL, `/api/documents/${docId}/ws`)
			const socket = new WebSocket(wsUrl)

			socket.onopen = () => {
				setWsMessages(['Auto-connected to WebSocket'])
				console.log('Auto-connected to WebSocket for docId:', docId)
			}

			socket.onmessage = event => {
				setWsMessages(prev => [...prev, `Received: ${event.data}`])
				try {
					const data = JSON.parse(event.data)
					if (data.type === 'error') console.error(data.message)
				} catch (error) {
					console.error('Failed to parse websocket message:', error)
				}
			}

			socket.onclose = () => {
				setWsMessages(prev => [...prev, 'WS Disconnected'])
				console.log('WebSocket disconnected for docId:', docId)
			}

			socket.onerror = err => {
				setWsMessages(prev => [...prev, `WS Error: ${err}`])
				console.error('WebSocket error for docId:', docId, err)
			}

			setWs(socket)
		}, 1500) // 1.5 second debounce

		return () => {
			clearTimeout(timeoutId)
		}
	}, [docId, ws]) // Trigger when docId changes

	const handleConnectWS = () => {
		if (!docId) return
		const wsUrl = getWebSocketUrl(API_BASE_URL, `/api/documents/${docId}/ws`)
		const socket = new WebSocket(wsUrl)
		socket.onopen = () => setWsMessages(prev => [...prev, 'WS Connected'])
		socket.onmessage = event => {
			setWsMessages(prev => [...prev, `Received: ${event.data}`])
			// Parse and handle (e.g., update local state)
			try {
				const data = JSON.parse(event.data)
				if (data.type === 'error') console.error(data.message)
			} catch (error) {
				console.error('Failed to parse websocket message:', error)
			}
		}
		socket.onclose = () => setWsMessages(prev => [...prev, 'WS Disconnected'])
		socket.onerror = err => setWsMessages(prev => [...prev, `WS Error: ${err}`])
		setWs(socket)
	}

	const handleCreateDocWS = () => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'create_doc', docId }))
		}
	}

	const handleTextUpdateWS = () => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			// First ensure we have some text in the document
			const text = localDoc.getText('text')
			console.log('Current text length:', text.length)
			console.log('Current text content:', text.toString())

			if (text.length === 0) {
				text.insert(0, 'Initial text ')
				console.log('Inserted initial text')
			}

			// Generate incremental update locally
			text.insert(0, 'Test insert ')
			console.log('After insert, text content:', text.toString())

			// Commit the changes to persist them
			localDoc.commit()
			console.log('Changes committed to Loro document')

			const update = localDoc.export({ mode: 'update' })
			const base64Update = btoa(String.fromCharCode(...update))

			console.log('Sending text update:', {
				updateSize: update.length,
				base64Length: base64Update.length,
				currentText: text.toString(),
			})
			ws.send(JSON.stringify({ type: 'text_update', update: base64Update }))
		}
	}

	const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setTestText(e.target.value)
	}

	const handleSelectionChange = (
		e: React.SyntheticEvent<HTMLTextAreaElement>,
	) => {
		const target = e.target as HTMLTextAreaElement
		setSelectionStart(target.selectionStart)
		setSelectionEnd(target.selectionEnd)
	}

	// Debounced selection update effect
	useEffect(() => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return

		const timeoutId = setTimeout(() => {
			// Send selection update to WebSocket
			if (
				testText.length > 0 &&
				selectionStart >= 0 &&
				selectionStart <= testText.length
			) {
				try {
					const text = localDoc.getText('text')
					// Clear and reset the text content
					if (text.length > 0) {
						text.delete(0, text.length)
					}
					text.insert(0, testText)

					// Commit the changes to persist them in the local document
					localDoc.commit()

					// Ensure selection position is valid
					const validStart = Math.min(selectionStart, testText.length)
					const localCursor = text.getCursor(validStart, 0)

					if (localCursor) {
						const encodedCursor = localCursor.encode()
						const base64Cursor = btoa(String.fromCharCode(...encodedCursor))
						ws.send(
							JSON.stringify({
								type: 'selection_update',
								cursor: base64Cursor,
								selection: {
									start: selectionStart,
									end: selectionEnd,
									text: testText.substring(selectionStart, selectionEnd),
								},
							}),
						)
					}
				} catch (error) {
					console.error('Error sending selection update:', error)
				}
			}
		}, 1500) // 1.5 second debounce

		return () => {
			clearTimeout(timeoutId)
		}
	}, [selectionStart, selectionEnd, testText, ws, localDoc])

	const handleCreate = async () => {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			}

			// Add Bearer token if available
			const bearerToken = localStorage.getItem('bearer_token')
			if (bearerToken) {
				headers.Authorization = `Bearer ${bearerToken}`
			}

			const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
				method: 'POST',
				headers,
				body: JSON.stringify({}), // Send empty JSON object as body
				credentials: 'include', // Include cookies for session-based auth
			})

			if (!response.ok) {
				const errorText = await response.text()
				setResult(
					`Error: ${response.status} ${response.statusText}\n${errorText}`,
				)
				return
			}

			const data = await response.json()
			setResult(JSON.stringify(data, null, 2))
		} catch (error) {
			setResult(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	const handleGet = async () => {
		try {
			const headers: Record<string, string> = {}
			const bearerToken = localStorage.getItem('bearer_token')
			if (bearerToken) {
				headers.Authorization = `Bearer ${bearerToken}`
			}

			const response = await fetch(
				`${API_BASE_URL}/api/documents/${docId}/state`,
				{
					method: 'GET',
					headers,
					credentials: 'include', // For session-based auth
				},
			)

			if (!response.ok) {
				const errorText = await response.text()
				setResult(
					`Error: ${response.status} ${response.statusText}\n${errorText}`,
				)
				return
			}

			const data = await response.json()
			setResult(JSON.stringify(data, null, 2))
		} catch (error) {
			setResult(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	const handleDelete = async () => {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			}

			// Add Bearer token if available
			const bearerToken = localStorage.getItem('bearer_token')
			if (bearerToken) {
				headers.Authorization = `Bearer ${bearerToken}`
			}

			const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
				method: 'DELETE',
				headers,
				body: JSON.stringify({}), // Send empty JSON object as body
				credentials: 'include', // Include cookies for session-based auth
			})

			if (!response.ok) {
				const errorText = await response.text()
				setResult(
					`Error: ${response.status} ${response.statusText}\n${errorText}`,
				)
				return
			}

			const data = await response.json()
			setResult(JSON.stringify(data, null, 2))
		} catch (error) {
			setResult(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	const handleListDocuments = async () => {
		try {
			const headers: Record<string, string> = {}

			// Add Bearer token if available
			const bearerToken = localStorage.getItem('bearer_token')
			if (bearerToken) {
				headers.Authorization = `Bearer ${bearerToken}`
			}

			const response = await fetch(`${API_BASE_URL}/api/documents`, {
				method: 'GET',
				headers,
				credentials: 'include', // Include cookies for session-based auth
			})

			if (!response.ok) {
				const errorText = await response.text()
				setResult(
					`Error: ${response.status} ${response.statusText}\n${errorText}`,
				)
				return
			}

			const data = await response.json()
			setResult(JSON.stringify(data, null, 2))
		} catch (error) {
			setResult(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	const handleTestLocalDoc = () => {
		try {
			const text = localDoc.getText('text')
			const currentText = text.toString()
			const documentState = localDoc.toJSON()
			const version = localDoc.version()
			const frontiers = localDoc.frontiers()

			console.log('Local Loro Document Test:')
			console.log('- Text content:', currentText)
			console.log('- Text length:', text.length)
			console.log('- Document state:', documentState)
			console.log('- Version:', version)
			console.log('- Frontiers:', frontiers)

			setResult(`Local Loro Document Test Results:
Text content: "${currentText}"
Text length: ${text.length}
Document state: ${JSON.stringify(documentState, null, 2)}
Version: ${JSON.stringify(version, null, 2)}
Frontiers: ${JSON.stringify(frontiers, null, 2)}`)
		} catch (error) {
			setResult(
				`Error testing local document: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	return (
		<div className='h-screen overflow-y-auto'>
			<div className='p-4 max-w-full'>
				{/* List Documents + Document ID Input */}
				<div className='flex flex-wrap gap-2 mb-4'>
					<CoButtonText onClick={handleListDocuments}>List Docs</CoButtonText>
					<CoButtonText onClick={handleTestLocalDoc}>
						Test Local Loro
					</CoButtonText>
					<CoTextField
						id={docIdFieldId}
						value={docId}
						onChange={e => setDocId(e.target.value)}
						label='Document ID'
						placeholder='Enter document ID'
					/>
				</div>

				{/* REST API Buttons */}
				<div className='flex flex-wrap gap-2 mb-4'>
					<CoButtonText onClick={handleCreate}>Create</CoButtonText>
					<CoButtonText onClick={handleGet}>Get State</CoButtonText>
					<CoButtonText onClick={handleDelete}>Delete</CoButtonText>
				</div>

				{/* WebSocket Buttons */}
				<div className='flex flex-wrap gap-2 mb-4'>
					<CoButtonText onClick={handleConnectWS}>Connect WS</CoButtonText>
					<CoButtonText onClick={handleCreateDocWS}>
						Create Doc WS (Case 1)
					</CoButtonText>
					<CoButtonText onClick={handleTextUpdateWS}>
						Send Text Update WS (Case 2)
					</CoButtonText>
				</div>

				{/* Text and Selection Testing */}
				<div className='mb-4'>
					<div className='mb-2'>
						<textarea
							id={textareaId}
							value={testText}
							onChange={handleTextInputChange}
							onSelect={handleSelectionChange}
							className='w-full h-24 p-2 border border-gray-300 rounded-md resize-none'
							placeholder='Type or edit text here, then select some text...'
						/>
					</div>
					<div className='mb-2'>
						<p className='text-sm text-gray-600'>
							Selection: {selectionStart} to {selectionEnd}(
							{selectionEnd - selectionStart} characters)
						</p>
						<p className='text-sm text-gray-600 break-words'>
							Selected text: "{testText.substring(selectionStart, selectionEnd)}
							"
						</p>
					</div>
				</div>

				{/* WebSocket Messages */}
				<div className='bg-gray-100 p-4 rounded-md min-h-[200px] max-h-[300px] overflow-y-auto'>
					<h3 className='text-sm font-medium mb-2'>WebSocket Messages:</h3>
					{wsMessages.map((msg, index) => (
						<div key={index} className='text-sm text-gray-700 mb-1'>
							{msg}
						</div>
					))}
				</div>

				{/* API Results */}
				<div className='bg-gray-100 p-4 rounded-md min-h-[200px] max-h-[300px] overflow-y-auto mt-4'>
					<h3 className='text-sm font-medium mb-2'>API Results:</h3>
					<pre className='text-sm text-gray-700 whitespace-pre-wrap'>
						{result || 'No results yet'}
					</pre>
				</div>
			</div>
		</div>
	)
}
