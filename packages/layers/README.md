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

> v1.0.0 `npm i maptalks.deckgl`

依赖 deck.gl 相关引用的 `7.3.0` 以上版本;
已知问题：高清屏图形会错位；

临时解决方案：指定devicePixelRatio为 1

```js
this.map = new maptalks.Map(this.container, {
  center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
  zoom: INITIAL_VIEW_STATE.zoom,
  pitch: INITIAL_VIEW_STATE.pitch,
  bearing: INITIAL_VIEW_STATE.bearing,
  maxZoom: INITIAL_VIEW_STATE.maxZoom,
  centerCross: true,
  baseLayer: new maptalks.TileLayer('tile', {
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`
  }),
  devicePixelRatio: 1 // 指定devicePixelRatio为 1
});
```

## use 使用

```js
import { GeoJsonLayer, PolygonLayer } from '@deck.gl/layers';
import * as maptalks from 'maptalks';
import DeckGLLayer from 'maptalks.deckgl';

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
  devicePixelRatio: 1
});

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line
const landCover = [[[-123.0, 49.196], [-123.0, 49.324], [-123.306, 49.324], [-123.306, 49.196]]];

const deckLayer = new DeckGLLayer('deck', {
  'layers': [
    new PolygonLayer({
        id: 'ground',
        data: landCover,
        stroked: false,
        getPolygon: f => f,
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
        getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
        getFillColor: f => COLOR_SCALE(f.properties.growth),
        getLineColor: [255, 255, 255],
        pickable: true,
        onHover: this._onHover
      })
  ]
}, {
  'animation': false,
  'renderer': 'webgl'
});

map.addLayer(deckLayer);

```

## Examples

[示例](https://sakitam-gis.github.io/maptalks.deckgl/#/index)

其他示例请查看 website 目录下源码。
