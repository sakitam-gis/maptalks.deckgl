import DeckGLLayer from 'maptalks.deckgl';
import {GeoJsonLayer} from '@deck.gl/layers';
import Base from "./base";
import React from "react";


// Source data GeoJSON
const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line

interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
}

class Polygon extends Base {
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
          {hoveredObject.name} {hoveredObject.year ? `(${hoveredObject.year})` : ''}
        </div>
      )
    );
  }

  _renderLayers () {
    const props = {
      layers: [
        new GeoJsonLayer({
          data: DATA_URL,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 1,
          getLineColor: () => [255, 100, 100],
          getFillColor: () => [200, 160, 0, 180]
        })
      ],
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

export default Polygon;
