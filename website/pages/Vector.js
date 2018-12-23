import * as React from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import 'ol/ol.css';
import '../assets/style/art.scss'
import OSM from 'ol/source/OSM';
import DeckGLLayer from '../../src';
// import VectorTileLayer from 'ol/layer/VectorTile';
// import VectorTileSource from 'ol/source/VectorTile';
// import {get as getProjection, fromLonLat} from 'ol/proj';
import {fromLonLat} from 'ol/proj';
// import TileGrid from 'ol/tilegrid/TileGrid.js';
import DCTileLayer from '@deck.gl/experimental-layers/dist/esm/tile-layer/tile-layer';
// import { GeoJsonLayer } from '@deck.gl/layers';
// import { VectorTile } from '@mapbox/vector-tile';
// import Protobuf from 'pbf';
import MVT from '../helper/MVT';

const format = new MVT();

// const MAPBOX_TOKEN = 'pk.eyJ1IjoiemhlbmZ1IiwiYSI6ImNpb284bzNoYzAwM3h1Ym02aHlrand6OTAifQ.sKX-XKJMmgtk_oI5oIUV_g';
// const GEOJSON = {
//   'type': 'Feature',
//   'geometry': {
//     'type': 'Point',
//     'coordinates': []
//   },
//   'properties': {}
// }

function getTileData ({x, y, z}) {
  const mapSource = `http://minedata.cn/datademo/dynamicdemo/zhonghuan_recent4/4/${z}/${x}/${y}`;
  return fetch(mapSource)
    .then(response => response.arrayBuffer())
    .then(buffer => vectorTileToGeoJSON(buffer, x, y, z));
}

function vectorTileToGeoJSON (buffer, x, y, z) {
  const tile = format.readFeatures(buffer);
  console.log(tile)
  const features = [];
  for (let i = 0; i < tile.length; i++) {
    features.push({
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': tile[i].coordinates
      },
      'properties': tile[i].properties
    });
  }
  return features;
}

// function vectorTileToGeoJSON (buffer, x, y, z) {
//   const tile = new VectorTile(new Protobuf(buffer));
//   const features = [];
//   for (const layerName in tile.layers) {
//     const vectorTileLayer = tile.layers[layerName];
//     for (let i = 0; i < vectorTileLayer.length; i++) {
//       const vectorTileFeature = vectorTileLayer.feature(i);
//       const feature = vectorTileFeature.toGeoJSON(x, y, z);
//       features.push(feature);
//     }
//   }
//   return features;
// }

class Index extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {
      zoom: 14,
      fov: 0,
      pitch: 0,
      bearing: 0
    };

    this.container = null;
    this.map = null;
    this.inited = false;
    this.deckLayer = null;
  }

  componentDidMount () {
    this.map = new Map({
      target: this.container,
      layers: [
        new TileLayer({
          preload: 4,
          source: new OSM({
            url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
          })
        })
      ],
      loadTilesWhileAnimating: true,
      view: new View({
        center: fromLonLat([116.4066765, 39.9079326]),
        zoom: 4
      })
    });

    // const resolutions = [];
    // for (let i = 0; i <= 8; ++i) {
    //   resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
    // }
    // function tileUrlFunction (tileCoord) {
    //   return ('http://minedata.cn/datademo/dynamicdemo/zhonghuan_recent4/4/{z}/{x}/{y}')
    //     .replace('{z}', String(tileCoord[0] * 2 - 1))
    //     .replace('{x}', String(tileCoord[1]))
    //     .replace('{y}', String(-tileCoord[2] - 1))
    //     .replace('{a-d}', 'abcd'.substr(
    //       ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
    // }
    //
    // const vec = new VectorTileLayer({
    //   source: new VectorTileSource({
    //     format: new MVT(),
    //     tileGrid: new TileGrid({
    //       extent: getProjection('EPSG:3857').getExtent(),
    //       resolutions: resolutions,
    //       tileSize: 512
    //     }),
    //     tileUrlFunction: tileUrlFunction
    //   })
    // });
    //
    // this.map.addLayer(vec);

    const layer = new DCTileLayer({
      stroked: false,
      getLineColor: [192, 192, 192],
      getFillColor: [140, 170, 180],
      getColor: [140, 170, 180],
      getTileData
    });
    this.deckLayer = new DeckGLLayer({
      'layers': [
        layer
      ]
    }, {
      map: this.map,
      projection: 'EPSG:3857'
    });
    this.map.addLayer(this.deckLayer);
  }

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
