/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface Process{
    env: ProcessEnv
  }
  interface ProcessEnv {
    /**
     * By default, there are two modes in Vite:
     *
     * * `development` is used by vite and vite serve
     * * `production` is used by vite build
     *
     * You can overwrite the default mode used for a command by passing the --mode option flag.
     *
     */
    readonly NODE_ENV: 'development' | 'production'
  }
}

declare var process: NodeJS.Process

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
    > & { title?: string }>

  const src: string;
  export default src
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string }
  export default classes
}


declare module '@loadable/component';
declare module 'maptalks';
declare module '@deck.gl/layers';
declare module '@deck.gl/core';
declare module '@deck.gl/geo-layers';
declare module '@luma.gl/core';
