# maptalks.deckgl

The plugin to play deck.gl with maptalks.js

[![Build Status](https://travis-ci.org/sakitam-gis/maptalks.deckgl.svg?branch=master)](https://www.travis-ci.org/sakitam-gis/maptalks.deckgl)
[![NPM downloads](https://img.shields.io/npm/dm/maptalks.deckgl.svg)](https://npmjs.org/package/maptalks.deckgl)
[![](https://data.jsdelivr.com/v1/package/npm/maptalks.deckgl/badge)](https://www.jsdelivr.com/package/npm/maptalks.deckgl)
![JS gzip size](http://img.badgesize.io/https://unpkg.com/maptalks.deckgl/dist/maptalks-deckgl.js?compression=gzip&label=gzip%20size:%20JS)
[![Npm package](https://img.shields.io/npm/v/maptalks.deckgl.svg)](https://www.npmjs.org/package/maptalks.deckgl)
[![GitHub stars](https://img.shields.io/github/stars/sakitam-gis/maptalks.deckgl.svg)](https://github.com/sakitam-gis/maptalks.deckgl/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/sakitam-gis/maptalks.deckgl/master/LICENSE)

## Dev

```bash
git clone https://github.com/sakitam-gis/maptalks.deckgl.git
npm install / yarn
npm run dev / yarn run dev
npm run build / yarn run build
```

## install

> `npm i maptalks.deckgl`

## use 使用

```js
import DeckGLLayer from 'maptalks.deckgl';
import {GeoJsonLayer, PolygonLayer} from '@deck.gl/layers';
import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';
import {scaleThreshold} from 'd3-scale';
import * as maptalks from 'maptalks';

const map = new maptalks.Map(this.container, {
  center: [-74.01194070150844, 40.70708981756565],
  zoom: 5,
  pitch: 0,
  bearing: 0,
  centerCross: true,
  baseLayer: new maptalks.TileLayer('tile', {
    'urlTemplate': 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg'
    // 'subdomains': ['a', 'b', 'c', 'd']
  }),
});
// Source data GeoJSON
const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line

export const COLOR_SCALE = scaleThreshold()
  .domain([-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2])
  // @ts-ignore
  .range([[65, 182, 196], [127, 205, 187], [199, 233, 180], [237, 248, 177], [255, 255, 204], [255, 237, 160], [254, 217, 118], [254, 178, 76], [253, 141, 60], [252, 78, 42], [227, 26, 28], [189, 0, 38], [128, 0, 38]]);

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const dirLight = new SunLight({
  timestamp: Date.UTC(2019, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.0,
  _shadow: true
});

const landCover = [[[-123.0, 49.196], [-123.0, 49.324], [-123.306, 49.324], [-123.306, 49.196]]];


const lightingEffect = new LightingEffect({ambientLight, dirLight});
lightingEffect.shadowColor = [0, 0, 0, 0.5];

const props = {
  layers: [
    // only needed when using shadows - a plane for shadows to drop on
    new PolygonLayer({
      id: 'ground',
      data: landCover,
      stroked: false,
      getPolygon: (f) => f,
      getFillColor: [0, 0, 0, 0]
    }),
    new GeoJsonLayer({
      id: 'geojson',
      data: DATA_URL,
      opacity: 0.8,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: (f) => Math.sqrt(f.properties.valuePerSqm) * 10,
      getFillColor: (f) => COLOR_SCALE(f.properties.growth),
      getLineColor: [255, 255, 255],
      pickable: true,
    })
  ],
  effects: [lightingEffect]
}
const deckLayer = new DeckGLLayer('deck', props, {
    animation: true,
    forceRenderOnMoving: true,
    forceRenderOnZooming: true,
    renderStart: () => {
      this.renderState?.update();
    },
  });

map.addLayer(deckLayer);

```

## Examples

[示例](https://sakitam-gis.github.io/maptalks.deckgl/)

其他示例请查看 packages/gatsby/pages 目录下源码。
