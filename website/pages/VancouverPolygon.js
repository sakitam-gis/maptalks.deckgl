import React from 'react';
import * as maptalks from 'maptalks';
import { scaleThreshold } from 'd3-scale';
import { PolygonLayer, GeoJsonLayer } from '@deck.gl/layers';
import { LightingEffect, AmbientLight, _SunLight as SunLight } from '@deck.gl/core';
import { getDevicePixelRatio } from '../../src/utils';
import DeckGLLayer from '../../src';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line

export const COLOR_SCALE = scaleThreshold()
  .domain([-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2])
  .range([
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],
    // zero
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [189, 0, 38],
    [128, 0, 38]
  ]);

const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

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

class VancouverPolygon extends React.Component {
  constructor (props, context) {
    super(props, context);

    this.state = {
      hoveredObject: null
    };

    const lightingEffect = new LightingEffect({ ambientLight, dirLight });
    lightingEffect.shadowColor = [0, 0, 0, 0.5];
    this._effects = [lightingEffect];

    this.container = null;
    this.map = null;
    this.inited = false;
    this.deckLayer = null;

    this._onHover = this._onHover.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);
  }

  componentDidMount () {
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
      devicePixelRatio: 1
    });

    this._renderLayers();
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  _onHover ({ x, y, object }) {
    this.setState({ x, y, hoveredObject: object });
  }

  _renderTooltip () {
    const { x, y, hoveredObject } = this.state;
    return (
      hoveredObject && (
        <div className="tooltip" style={{ top: y, left: x }}>
          <div>
            <b>Average Property Value</b>
          </div>
          <div>
            <div>${hoveredObject.properties.valuePerParcel} / parcel</div>
            <div>
              ${hoveredObject.properties.valuePerSqm} / m<sup>2</sup>
            </div>
          </div>
          <div>
            <b>Growth</b>
          </div>
          <div>{Math.round(hoveredObject.properties.growth * 100)}%</div>
        </div>
      )
    );
  }

  _renderLayers () {
    const layers = [
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
    ];
    const props = {
      layers: layers,
      effects: this._effects
    };
    if (!this.inited) {
      this.inited = true;
      this.deckLayer = new DeckGLLayer('deck', props, {
        animation: false,
        renderer: 'webgl'
      });
      this.map.addLayer(this.deckLayer);
    } else if (this.deckLayer) {
      this.deckLayer.setProps(props);
    }
  };

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content">
      { this._renderTooltip() }
    </div>);
  }
}

export default VancouverPolygon;
