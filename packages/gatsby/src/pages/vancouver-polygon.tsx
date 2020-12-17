import DeckGLLayer from 'maptalks.deckgl';
import {GeoJsonLayer, PolygonLayer} from '@deck.gl/layers';
import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';
import Base from "./base";
import React from "react";
import {scaleThreshold} from 'd3-scale';


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

interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
}

class VancouverPolygon extends Base {
  private deckLayer: DeckGLLayer | null;

  state: IState = {
    data: [],
  }

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [49.254, -123.13].reverse(),
      zoom: 11,
      pitch: 40.5,
      bearing: 0,
    };
  }

  initMap() {
    super.initMap();
    this._renderLayers();
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
    const lightingEffect = new LightingEffect({ambientLight, dirLight});
    lightingEffect.shadowColor = [0, 0, 0, 0.5];

    const props = {
      layers: [
        // only needed when using shadows - a plane for shadows to drop on
        new PolygonLayer({
          id: 'ground',
          data: landCover,
          stroked: false,
          getPolygon: (f: any) => f,
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
          getElevation: (f: { properties: { valuePerSqm: number; }; }) => Math.sqrt(f.properties.valuePerSqm) * 10,
          getFillColor: (f: { properties: { growth: number; }; }) => COLOR_SCALE(f.properties.growth),
          getLineColor: [255, 255, 255],
          pickable: true,
          onHover: this.onHover,
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
          this.renderState?.update();
        },
      });

      this.map.addLayer(this.deckLayer);
    } else {
      this.deckLayer.setProps(props);
    }
  }
}

export default VancouverPolygon;
