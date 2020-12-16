import { PolygonLayer } from '@deck.gl/layers';
// @ts-ignore
import { TileLayer } from '@deck.gl/geo-layers';
import DeckGLLayer from '@salitam-gis/maptalks.deckgl';
import Color from 'color';
import Base from './base';

interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;
}

class Vector extends Base {
  private deckLayer: DeckGLLayer | null;

  state: IState = {
    data: [],
  }

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [13.41289, 52.52057],
      zoom: 16,
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

  _renderLayers () {
    console.log('create')
    try {
      const props = {
        layers: [
          new TileLayer({
            maxZoom: 16,

            // getTileData
            data: [
              'http://localhost:3333/osm/{z}/{x}/{y}.json',
              // 'https://a.data.osmbuildings.org/0.2/ph2apjye/tile/{z}/{x}/{y}.json',
              // 'https://b.data.osmbuildings.org/0.2/ph2apjye/tile/{z}/{x}/{y}.json',
              // 'https://c.data.osmbuildings.org/0.2/ph2apjye/tile/{z}/{x}/{y}.json'
            ],
            // Since these OSM tiles support HTTP/2, we can make many concurrent requests
            // and we aren't limited by the browser to a certain number per domain.
            maxRequests: 6,

            pickable: true,
            // onViewportLoad: onTilesLoad,
            // autoHighlight: showBorder,
            highlightColor: [60, 60, 60, 40],
            // https://wiki.openstreetmap.org/wiki/Zoom_levels
            minZoom: 0,
            tileSize: 512 / devicePixelRatio,
            renderSubLayers: (props: any) => {
              // const {
              //   bbox: {west, south, east, north}
              // } = props.tile;

              console.log(props)

              return [
                new PolygonLayer({
                  data: props?.data?.features,
                  stroked: false,
                  getLineColor: [192, 192, 192],
                  extruded: true,
                  wireframe: false,
                  // fp64: true,
                  opacity: 0.8,
                  getPolygon: (f: any) => f.geometry.coordinates,
                  getElevation: (f: { properties: { hasOwnProperty: (arg0: string) => any; height: number; }; }) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (f.properties.hasOwnProperty('height')) {
                      return f.properties.height * 2
                    } else {
                      return 10
                    }
                  },
                  getFillColor: (f: { properties: { hasOwnProperty: (arg0: string) => any; roofColor: any; }; }) => {
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
                }),
              ];
            }
          })
        ],
      }
      if (!this.deckLayer) {
        console.log(this.deckLayer);
        this.deckLayer = new DeckGLLayer('deck', props, {
          animation: true,
          forceRenderOnMoving: true,
          forceRenderOnZooming: true,
          renderStart: () => {
            this.renderState?.update();
          },
        });

        this.map.addLayer(this.deckLayer);

        console.log(this.deckLayer);
      } else {
        this.deckLayer.setProps(props);
      }
    } catch (e) {
      console.error(e)
    }
  }
}

export default Vector;
