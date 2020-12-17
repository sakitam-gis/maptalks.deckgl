import DeckGLLayer from 'maptalks.deckgl';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';
// @ts-ignore
import GL from '@luma.gl/constants';
import Base from "./base";
import React from "react";


// Source data CSV
const DATA_URL = {
  AIRPORTS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/line/airports.json', // eslint-disable-line
  FLIGHT_PATHS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/line/heathrow-flights.json' // eslint-disable-line
};

interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
}

function getColor(d: any) {
  const z = d.start[2];
  const r = z / 10000;

  return [255 * (1 - r * 2), 128 * r, 255 * r, 255 * (1 - r)];
}

function getSize(type: any) {
  if (type.search('major') >= 0) {
    return 100;
  }
  if (type.search('small') >= 0) {
    return 30;
  }
  return 60;
}

function getTooltip(object: any) {
  return (
    object &&
    `\
  ${object.country || object.abbrev || ''}
  ${object.name.indexOf('0x') >= 0 ? '' : object.name}`
  );
}

class Icon extends Base {
  private deckLayer: DeckGLLayer | null;

  state: IState = {
    data: [],
  }

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [7, 47.65],
      zoom: 4.8,
      pitch: 40.5,
      bearing: -27,
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
          {hoveredObject.name} {hoveredObject.year ? `(${hoveredObject.year})` : ''}
        </div>
      )
    );
  }

  _renderLayers () {
    const props = {
      layers: [
        new ScatterplotLayer({
          id: 'airports',
          data: DATA_URL.AIRPORTS,
          radiusScale: 20,
          getPosition: (d: { coordinates: any; }) => d.coordinates,
          getFillColor: [255, 140, 0],
          getRadius: (d: { type: any; }) => getSize(d.type),
          pickable: true
        }),
        new LineLayer({
          id: 'flight-paths',
          data: DATA_URL.FLIGHT_PATHS,
          opacity: 0.8,
          getSourcePosition: (d: { start: any; }) => d.start,
          getTargetPosition: (d: { end: any; }) => d.end,
          getColor,
          getWidth: 5,
          pickable: true
        })
      ],
      parameters: {
        blendFunc: [GL.SRC_ALPHA, GL.ONE, GL.ONE_MINUS_DST_ALPHA, GL.ONE],
        blendEquation: GL.FUNC_ADD
      },
      pickingRadius: 5
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

export default Icon;
