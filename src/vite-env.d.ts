/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_LOCAL_SETUP_REQUIRED: string;
  readonly VITE_API_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
