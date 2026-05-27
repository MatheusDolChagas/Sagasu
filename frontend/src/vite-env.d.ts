/// <reference types="vite/client" />

declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react';
  export interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    deepLinking?: boolean;
    docExpansion?: string;
    defaultModelsExpandDepth?: number;
  }
  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
