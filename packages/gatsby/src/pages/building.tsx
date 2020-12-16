import DeckGLLayer from '@salitam-gis/maptalks.deckgl';
import Base from './base';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const landCover = [[[-74.0, 40.7], [-74.02, 40.7], [-74.02, 40.72], [-74.0, 40.72]]];

const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
};

interface IProps {

}

class Building extends Base {
  private inited: Boolean;
  private deckLayer: DeckGLLayer | null;
  constructor (props: IProps) {
    super(props);
    this.inited = false;
    this.deckLayer = null;
  }

  componentDidMount () {
    this._animate();
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
    super.componentWillUnmount();
  }

  _animate = () => {
    const [loopLength, animationSpeed] = [1800, 30];
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;
    const time = ((timestamp % loopTime) / loopTime) * loopLength;
    const layers = [
      new PolygonLayer({
        id: 'ground',
        data: landCover,
        getPolygon: (f: any) => f,
        stroked: false,
        getFillColor: [0, 0, 0, 0]
      }),
      new TripsLayer({
        id: 'trips',
        data: DATA_URL.TRIPS,
        currentTime: time,
        getPath: (d: { path: any; }) => d.path,
        getTimestamps: (d: { timestamps: any; }) => d.timestamps,
        getColor: (d: { vendor: number; }) => (d.vendor === 0 ? DEFAULT_THEME.trailColor0 : DEFAULT_THEME.trailColor1),
        opacity: 0.3,
        widthMinPixels: 2,
        rounded: true,
        trailLength: 180,

        shadowEnabled: false
      }),
      new PolygonLayer({
        id: 'buildings',
        data: DATA_URL.BUILDINGS,
        extruded: true,
        wireframe: false,
        opacity: 0.5,
        getPolygon: (f: { polygon: any; }) => f.polygon,
        getElevation: (f: { height: any; }) => f.height,
        getFillColor: DEFAULT_THEME.buildingColor,
        material: DEFAULT_THEME.material
        // lightSettings: {
        //   lightsPosition: [-74.05, 40.7, 8000, -73.5, 41, 5000],
        //   ambientRatio: 0.05,
        //   diffuseRatio: 0.6,
        //   specularRatio: 0.8,
        //   lightsStrength: [2.0, 0.0, 0.0, 0.0],
        //   numberOfLights: 2
        // }
      })
    ];
    const props = {
      layers: layers
    };
    if (!this.inited) {
      this.inited = true;
      this.deckLayer = new DeckGLLayer('deck', props, {
        animation: true,
      });
      this.map.addLayer(this.deckLayer);
    } else if (this.deckLayer) {
      this.deckLayer.setProps(props);
    }
    this.renderState?.update();
    window.requestAnimationFrame(this._animate);
  };
}

export default Building;
