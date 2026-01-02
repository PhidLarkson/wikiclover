/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WIKIMEDIA_CLIENT_ID: string
    readonly VITE_WIKIMEDIA_REDIRECT_URI: string
    readonly VITE_WIKIMEDIA_API_BASE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
