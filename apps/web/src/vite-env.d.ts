/// <reference types="vite/client" />
/// <reference types="@univerjs/vite-plugin/types" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown // Make the type of ImportMetaEnv strict to disallow unknown keys.
}

interface ImportMetaEnv {
	readonly VITE_SERVER_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
