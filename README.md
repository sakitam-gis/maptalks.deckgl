# maptalks.deckgl

The plugin to play deck.gl with maptalks.js

## install

> 暂时未发布稳定版本

依赖 deck.gl 相关引用的 `7.0.0-alpha.2` 以上版本

## use

* 引入 src 整个目录，

* 使用

```js
import { GeoJsonLayer } from '@deck.gl/layers';
import * as maptalks from 'maptalks';
import DeckGLLayer from 'path/src';

const map = new maptalks.Map(this.container, {
  center: [-74.01194070150844, 40.70708981756565],
  zoom: 5,
  pitch: 0,
  bearing: 0,
  centerCross: true,
  baseLayer: new maptalks.TileLayer('tile', {
    'urlTemplate': 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg'
    // 'subdomains': ['a', 'b', 'c', 'd']
  })
});

const deckLayer = new DeckGLLayer('deck', {
  'layers': [
    new GeoJsonLayer({
      data: 'http://58.87.95.84:7300/mock/5b974eaa51241d6b41b178aa/learn-gis/building',
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      opacity: 1,
      getLineColor: () => [255, 100, 100],
      getFillColor: () => [200, 160, 0, 180]
    })
  ]
}, {
  'animation': true,
  'renderer': 'webgl'
});

map.addLayer(deckLayer);

```

## Examples

[示例](https://sakitam-gis.github.io/maptalks.deckgl/#/index)
