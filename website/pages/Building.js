import * as React from 'react';
import { DeckGLLayer } from '../../src';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import * as maptalks from 'maptalks';

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
        urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd']
      })
    });

    this._animate();
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  _animate = () => {
    const [loopLength, animationSpeed] = [1800, 30];
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;
    const time = ((timestamp % loopTime) / loopTime) * loopLength;
    const layers = [
      {
        type: TripsLayer,
        data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips.json',
        getPath: d => d.segments,
        getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
        opacity: 0.3,
        strokeWidth: 2,
        trailLength: 180,
        currentTime: time
      },
      {
        type: PolygonLayer,
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
      }
    ];
    if (!this.inited) {
      this.inited = true;

      this.tripsLayer = new DeckGLLayer('tripsLayer', layers[0], {
        animation: true,
        renderer: 'webgl'
      });

      this.polygonLayer = new DeckGLLayer('polygonLayer', layers[1], {
        animation: true,
        renderer: 'webgl'
      });
      this.map.addLayer(this.tripsLayer);
      this.map.addLayer(this.polygonLayer);
    } else if (this.deckLayer) {
      this.tripsLayer.setProps(layers[0]);
      this.polygonLayer.setProps(layers[1]);
    }
    window.requestAnimationFrame(this._animate);
  };

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default Index;
