import * as request from 'd3-request';
// @ts-ignore
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
// @ts-ignore
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import DeckGLLayer from 'maptalks.deckgl';
import Base from "./base";
import React from "react";

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000]
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000]
});

// eslint-disable-next-line no-unused-vars
const lightingEffect = new LightingEffect({ ambientLight, pointLight1, pointLight2 });

const LIGHT_SETTINGS = {
  lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  specularRatio: 0.2,
  lightsStrength: [0.8, 0.0, 0.8, 0.0],
  numberOfLights: 2
};

const material = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51]
};

const colorRange = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

const elevationScale = { min: 1, max: 50 };

interface IProps {

}

interface IState {
  elevationScale: number;
  radius: number;
  upperPercentile: number;
  coverage: number;
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
}

function getTooltip(object: any) {
  if (!object) {
    return null;
  }
  const lat = object.position[1];
  const lng = object.position[0];
  const count = object.points.length;

  return `\
    latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}
    longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}
    ${count} Accidents`;
}

class Hexagon extends Base {
  private deckLayer: DeckGLLayer | null;
  private startAnimationTimer: undefined | number;
  private intervalTimer: undefined | number;

  state: IState = {
    elevationScale: elevationScale.min,
    radius: 1000,
    upperPercentile: 100,
    coverage: 1,
    data: [],
  }

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [-1.415727, 52.232395],
      zoom: 6.6,
      pitch: 40.5,
      bearing: -27,
    };

    this.startAnimationTimer = undefined;
    this.intervalTimer = undefined;

    this._startAnimate = this._startAnimate.bind(this);
    this._animateHeight = this._animateHeight.bind(this);
  }

  initMap() {
    super.initMap();

    request.csv(DATA_URL, (error: any, response: any) => {
      if (!error) {
        const data = response.map((d: { lng: any; lat: any; }) => [Number(d.lng), Number(d.lat)]);
        this._animate(data);
      }
    });
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      // @ts-ignore
      this.deckLayer.remove()
    }
    super.componentWillUnmount();
  }

  onHover = ({ x, y, object }: any) => {
    this.setState({ x, y, hoveredObject: object });
  }

  renderTooltip () {
    const { x, y, hoveredObject } = this.state;
    return (
      hoveredObject && (
        <div className="tooltip" style={{ top: y, left: x }}>
          { getTooltip(hoveredObject) }
        </div>
      )
    );
  }

  _renderLayers () {
    const { data, radius, upperPercentile, coverage } = this.state;
    const props = {
      layers: [
        new HexagonLayer({
          id: 'heatmap',
          colorRange,
          coverage,
          data,
          elevationRange: [0, 3000],
          elevationScale: this.state.elevationScale,
          extruded: true,
          getPosition: (d: any) => d,
          lightSettings: LIGHT_SETTINGS,
          onHover: this.onHover,
          opacity: 1,
          pickable: Boolean(this.onHover),
          radius,
          upperPercentile,
          material,

          transitions: {
            elevationScale: 3000
          }
        })
      ],
      effects: [lightingEffect]
    }
    if (!this.deckLayer) {
      this.deckLayer = new DeckGLLayer('deck', props, {
        animation: true,
        forceRenderOnMoving: true,
        forceRenderOnZooming: true,
        renderStart: () => {
          // this.renderState?.update();
        },
      });

      this.map.addLayer(this.deckLayer);
    } else {
      this.deckLayer.setProps(props);
    }
  }

  _animate (data: number[][]) {
    this.setState({
      data: data
    });
    this._stopAnimate();
    // wait 1.5 secs to start animation so that all data are loaded
    this.startAnimationTimer = window.setTimeout(this._startAnimate, 1500);
  }

  _startAnimate () {
    this.intervalTimer = window.setInterval(this._animateHeight, 20);
  }

  _stopAnimate () {
    window.clearTimeout(this.startAnimationTimer);
    window.clearTimeout(this.intervalTimer);
  }

  _animateHeight () {
    if (this.state.elevationScale === elevationScale.max) {
      this._stopAnimate();
    } else {
      this.setState({
        elevationScale: this.state.elevationScale + 1
      }, () => {
        this.renderState?.update();
        this._renderLayers()
      });
    }
  }
}

export default Hexagon;
