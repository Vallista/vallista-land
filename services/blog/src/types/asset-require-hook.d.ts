declare module 'asset-require-hook' {
  interface Options {
    extensions: string[]
    name?: string | ((name: string) => string)
    limit?: number
    publicPath?: string
    outputPath?: string | ((path: string) => string)
    regExp?: RegExp
    inline?: boolean
    emitFile?: boolean
  }

  function assetRequireHook(options: Options): void
  export = assetRequireHook
}
