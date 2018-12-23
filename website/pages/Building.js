import * as React from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import 'ol/ol.css';
import '../assets/style/art.scss'
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import DeckGLLayer from '../../src';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/experimental-layers';

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
        center: fromLonLat([-74, 40.72]),
        zoom: 13
      })
    });

    this._animate();
  }

  _animate = () => {
    const [loopLength, animationSpeed] = [1800, 30];
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;
    const time = ((timestamp % loopTime) / loopTime) * loopLength;
    const layers = [
      new TripsLayer({
        id: 'trips',
        data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips.json',
        getPath: d => d.segments,
        getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
        opacity: 0.3,
        strokeWidth: 2,
        trailLength: 180,
        currentTime: time
      }),
      new PolygonLayer({
        id: 'buildings',
        data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/buildings.json',
        extruded: true,
        wireframe: false,
        fp64: true,
        opacity: 0.5,
        getPolygon: f => f.polygon,
        getElevation: f => f.height,
        getFillColor: [74, 80, 87],
        lightSettings: {
          lightsPosition: [-74.05, 40.7, 8000, -73.5, 41, 5000],
          ambientRatio: 0.05,
          diffuseRatio: 0.6,
          specularRatio: 0.8,
          lightsStrength: [2.0, 0.0, 0.0, 0.0],
          numberOfLights: 2
        }
      })
    ];
    const props = {
      layers: layers
    };
    if (!this.inited) {
      this.inited = true;
      this.deckLayer = new DeckGLLayer(props, {
        map: this.map,
        animation: true,
        projection: 'EPSG:3857'
      });
      this.map.addLayer(this.deckLayer);
    } else if (this.deckLayer) {
      this.deckLayer.setProps(props);
    }
    window.requestAnimationFrame(this._animate);
  };

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
