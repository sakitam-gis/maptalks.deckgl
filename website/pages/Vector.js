import * as React from 'react';
import axios from 'axios';
import Color from 'color';
import DeckGLLayer from '../../src';
import { TileLayer } from '@deck.gl/geo-layers';
// import { GeoJsonLayer } from '@deck.gl/layers';
// import { VectorTile } from '@mapbox/vector-tile';
// import Protobuf from 'pbf';
import * as maptalks from 'maptalks';
import { getDevicePixelRatio } from '../../src/utils';

// const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// const MAPBOX_TOKEN = 'pk.eyJ1IjoiemhlbmZ1IiwiYSI6ImNpb284bzNoYzAwM3h1Ym02aHlrand6OTAifQ.sKX-XKJMmgtk_oI5oIUV_g';
// const GEOJSON = {
//   'type': 'Feature',
//   'geometry': {
//     'type': 'Point',
//     'coordinates': []
//   },
//   'properties': {}
// }

// function getTileData ({ x, y, z }) {
//   const mapSource = `https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/${z}/${x}/${y}.vector.pbf?access_token=${MAPBOX_TOKEN}`;
//   return fetch(mapSource)
//     .then(response => response.arrayBuffer())
//     .then(buffer => vectorTileToGeoJSON(buffer, x, y, z));
// }

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

function getTileData ({ x, y, z }) {
  const url = `http://58.87.95.84:3333/osm?z=${z}&x=${x}&y=${y}`
  return axios.get(url, {
    headers: {
      Pragma: 'cache'
    }
  })
    .then(({ data }) => {
      return data.features;
    })
}

class Index extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {
      zoom: 16,
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
    this.map = new maptalks.Map(this.container, {
      // center: [114.09730, 22.52418], // 腾讯大厦
      // center: [116.476921, 40.004619], // 望京
      // center: [116.3972282409668, 39.90960456049752], // 天安门
      center: [13.41289, 52.52057], // 伦敦
      zoom: 16,
      pitch: 60,
      bearing: 0,
      centerCross: true,
      maxPitch: 60,
      maxVisualPitch: 60,
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`
        // subdomains: ['a', 'b', 'c', 'd']
      })
    });

    const layer = new TileLayer({
      // minZoom: 15,
      stroked: false,
      getLineColor: [192, 192, 192],
      extruded: true,
      wireframe: false,
      // fp64: true,
      opacity: 0.8,
      // getPolygon: f => f.polygon,
      getElevation: f => {
        // eslint-disable-next-line no-prototype-builtins
        if (f.properties.hasOwnProperty('height')) {
          return f.properties.height * 2
        } else {
          return 10
        }
      },
      getFillColor: f => {
        // eslint-disable-next-line no-prototype-builtins
        if (f.properties.hasOwnProperty('roofColor')) {
          return Color(f.properties.roofColor).rgb().array()
        } else {
          return [74, 80, 87];
        }
      },
      // getFillColor: f => COLOR_SCALE(f.properties.growth),
      lightSettings: {
        lightsPosition: [
          98.84690, 34.74385, 5000,
          110.35160, 32.12537, 8000,
          112.55302, 32.50228, 5000
        ],
        ambientRatio: 0.2,
        diffuseRatio: 0.5,
        specularRatio: 0.3,
        lightsStrength: [2.0, 0.0, 1.0, 0.0],
        numberOfLights: 3
      },
      getTileData
    });
    this.deckLayer = new DeckGLLayer('deck', {
      layers: [
        layer
      ]
    }, {
      minZoom: 15,
      animation: true,
      renderer: 'webgl'
    });
    this.map.addLayer(this.deckLayer);
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default Index;
