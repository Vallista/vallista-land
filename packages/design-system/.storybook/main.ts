import type { StorybookConfig } from '@storybook/react-vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal: async (config) => {
    if (config.plugins) {
      config.plugins.push(vanillaExtractPlugin())
    }
    return config
  }
}
export default config
