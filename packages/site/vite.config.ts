import * as reactPlugin from 'vite-plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  base: './',
  outDir: 'dist',
  assetsDir: '_assets',
  jsx: 'react',
  plugins: [reactPlugin],
  cssPreprocessOptions: {
    less: {
      modifyVars: {
        'preprocess-custom-color': 'green'
      }
    }
  }
}

export default config
