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
  },
  optimizeDeps: {
    exclude: [
      // '@deck.gl/layers',
      // '@deck.gl/geo-layers',
      // '@deck.gl/core',
      // '@deck.gl/mesh-layers',
      // '@deck.gl/aggregation-layers',
      // '@loaders.gl/core',
      // '@loaders.gl/draco',
      // '@loaders.gl/loader-utils'
    ],
  }
}

export default config
