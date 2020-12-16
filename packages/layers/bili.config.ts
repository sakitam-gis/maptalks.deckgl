// bili.config.ts
import { Config } from 'bili'
import { RollupConfig } from 'bili/types/types';
import fs from 'fs-extra'
import path from 'path'

const json = fs.readJsonSync(path.resolve(`./package.json`));

const generateBanner = (json: any): string => {
  const time = new Date();
  const year = time.getFullYear();
  const banner = `/*!\n * author: ${json.author}
 * ${json.name} v${json.version}
 * build-time: ${year}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}
 * LICENSE: ${json.license}
 * (c) 2017-${year} ${json.homepage}\n */`;
  return banner
}

const namePath = 'maptalks-deckgl';

const config: Config = {
  babel: undefined,
  input: 'src/index.ts',
  output: {
    format: ['cjs', 'umd', 'umd-min', 'esm'],
    moduleName: 'DeckGLLayer',
  },
  extendConfig(config, { format }) {
    if (format.startsWith('umd')) {
      config.output.fileName = `${namePath}[min].js`
    }
    if (format === 'esm') {
      config.output.fileName = `${namePath}.esm.js`
    }
    if (format === 'cjs') {
      config.output.fileName = `${namePath}.cjs.js`
    }
    return config
  },
  extendRollupConfig: (config: RollupConfig) => {
    if (config.outputConfig.format === 'umd') {
      /** Disable warning for default imports */
      config.outputConfig.exports = 'named'
      // it seems the umd bundle can not satisfies our demand
      config.outputConfig.footer = 'if(typeof window !== "undefined" && window.DeckGLLayer) { \n' +
        '  window.DeckGLLayer = window.DeckGLLayer.default;\n}'
    }
    return config
  },
  banner: generateBanner(json),
  plugins: {
    'typescript2': {
      clean: true,
      check: false,
      useTsconfigDeclarationDir: true
    }
  },
  globals: {
    maptalks: 'maptalks',
    '@deck.gl/core': 'deck'
  },
  externals: [
    'maptalks',
    '@deck.gl/core'
  ]
}

export default config
