/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_HABITAT_GEO_URL: string;
  readonly VITE_HABITAT_DATA_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
