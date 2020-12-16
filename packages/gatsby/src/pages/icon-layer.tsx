import DeckGLLayer from '@salitam-gis/maptalks.deckgl';
import { IconLayer } from '@deck.gl/layers';
import Base from "./base";
import React from "react";

const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/icon/meteorites.json'; // eslint-disable-line
interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
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
      center: [-35, 36.7],
      zoom: 2.8,
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
        new IconLayer({
          id: 'icon',
          getIcon: () => 'marker',
          sizeUnits: 'meters',
          sizeScale: 5000,
          sizeMinPixels: 6,
          data: DATA_URL,
          pickable: true,
          wrapLongitude: true,
          getPosition: (d: { coordinates: any; }) => d.coordinates,
          iconAtlas: './images/location-icon-atlas.png',
          iconMapping: './json/location-icon-mapping.json',
          onHover: this.onHover,
        })
      ],
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
}

export default Icon;
