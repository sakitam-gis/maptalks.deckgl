import * as React from 'react';
import DeckGLLayer from '../../src';
import { TileLayer } from '@deck.gl/experimental-layers';
// import { GeoJsonLayer } from '@deck.gl/layers';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import * as maptalks from 'maptalks';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// const MAPBOX_TOKEN = 'pk.eyJ1IjoiemhlbmZ1IiwiYSI6ImNpb284bzNoYzAwM3h1Ym02aHlrand6OTAifQ.sKX-XKJMmgtk_oI5oIUV_g';
// const GEOJSON = {
//   'type': 'Feature',
//   'geometry': {
//     'type': 'Point',
//     'coordinates': []
//   },
//   'properties': {}
// }

function getTileData ({ x, y, z }) {
  const mapSource = `https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/${z}/${x}/${y}.vector.pbf?access_token=${MAPBOX_TOKEN}`;
  return fetch(mapSource)
    .then(response => response.arrayBuffer())
    .then(buffer => vectorTileToGeoJSON(buffer, x, y, z));
}

function vectorTileToGeoJSON (buffer, x, y, z) {
  const tile = new VectorTile(new Protobuf(buffer));
  const features = [];
  for (const layerName in tile.layers) {
    const vectorTileLayer = tile.layers[layerName];
    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);
      const feature = vectorTileFeature.toGeoJSON(x, y, z);
      features.push(feature);
    }
  }
  return features;
}

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
    this.map = new maptalks.Map(this.container, {
      center: [-74, 40.72],
      zoom: 13,
      pitch: 40.5,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
      })
    });

    const layer = new TileLayer({
      stroked: false,
      getLineColor: [192, 192, 192],
      getFillColor: f => {
        switch (f.properties.layer) {
          case 'water':
            return [140, 170, 180];
          case 'landcover':
            return [120, 190, 100];
          default:
            return [218, 218, 218];
        }
      },
      getTileData
    });
    this.deckLayer = new DeckGLLayer('deck', {
      'layers': [
        layer
      ]
    }, {
      'animation': true,
      'renderer': 'webgl'
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
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
