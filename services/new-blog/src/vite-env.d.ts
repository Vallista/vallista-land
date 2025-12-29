/// <reference types="vite/client" />

declare module '*.svg?react' {
  import React from 'react'
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>
  export default SVG
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob(
    pattern: string,
    options?: {
      eager?: boolean
      as?: string
      query?: string
    }
  ): Record<string, unknown>
}
