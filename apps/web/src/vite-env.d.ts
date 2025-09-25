/// <reference types="vite/client" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown // Make the type of ImportMetaEnv strict to disallow unknown keys.
}

interface ImportMetaEnv {
	readonly VITE_SERVER_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
