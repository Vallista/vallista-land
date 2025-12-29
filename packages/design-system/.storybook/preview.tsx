import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { ThemeProvider } from '../src/components/ThemeProvider'
import { CollapseGroup } from '../src/components/Collapse'
import { ToastProvider } from '../src/components/Toast'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff'
        },
        {
          name: 'dark',
          value: '#1a1a1a'
        }
      ]
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme='LIGHT'>
        <ToastProvider>
          <CollapseGroup>
            <Story />
          </CollapseGroup>
        </ToastProvider>
      </ThemeProvider>
    )
  ]
}

export default preview
