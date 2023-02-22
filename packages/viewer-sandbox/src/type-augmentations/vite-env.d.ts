/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FORCE_VUE_DEVTOOLS: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
