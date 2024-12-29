import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.node.json'
    })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      name: 'index'
    },
    rollupOptions: {
      plugins: [(peerDepsExternal as unknown as () => void)()],
      output: {
        preserveModules: true,
        inlineDynamicImports: false,
        entryFileNames: ({ name }) => {
          const invalidString = ['packages', 'design-system']
          const pathes = name.split('/')

          return `${pathes
            .reduce<string[]>((acc, curr) => {
              if (invalidString.includes(curr)) return acc

              acc.push(curr)
              return acc
            }, [])
            .join('/')}.js`
        }
      }
    }
  }
})
