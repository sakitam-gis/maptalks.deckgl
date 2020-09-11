import DeckGLLayer from '../../../layers/';
import Base from './base';
import { GeoJsonLayer } from '@deck.gl/layers';
import { scaleLinear, scaleThreshold } from 'd3-scale';
import * as request from 'd3-request';

const DATA_URL = {
  ACCIDENTS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/highway/accidents.csv',
  ROADS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/highway/roads.json'
};

const range = [
  [26, 152, 80],
  [102, 189, 99],
  [166, 217, 106],
  [217, 239, 139],
  [255, 255, 191],
  [254, 224, 139],
  [253, 174, 97],
  [244, 109, 67],
  [215, 48, 39],
  [168, 0, 0]
];

export const COLOR_SCALE = scaleThreshold()
  .domain([0, 4, 8, 12, 20, 32, 52, 84, 136, 220])
  // @ts-ignore
  .range(range);

const WIDTH_SCALE = scaleLinear()
  .clamp(true)
  .domain([0, 200])
  .range([10, 2000]);

interface IProps {

}

class Highway extends Base {
  private deckLayer: DeckGLLayer | null;

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [-100, 38],
      zoom: 4,
      pitch: 40.5,
      bearing: 0,
    };
  }

  initMap() {
    super.initMap();

    request.csv(DATA_URL.ACCIDENTS, this.formatRow, (error, response) => {
      const year = response[0].year;
      const accidents = response;
      if (!error) {
        const { fatalities, incidents } = this._aggregateAccidents(accidents);
        this.deckLayer = new DeckGLLayer('deck', {
          layers: [
            new GeoJsonLayer({
              id: 'geojson',
              data: DATA_URL.ROADS,
              opacity: 1,
              stroked: false,
              filled: false,
              lineWidthMinPixels: 0.5,
              parameters: {
                depthTest: false
              },
              getLineColor: (f: any) => this._getLineColor(f, fatalities[year]),
              getLineWidth: (f: any) => this._getLineWidth(f, incidents[year]),
              pickable: true,
              updateTriggers: {
                getLineColor: { year },
                getLineWidth: { year }
              },

              transitions: {
                getLineColor: 1000,
                getLineWidth: 1000
              }
            })
          ]
        }, {
          animation: false,
          forceRenderOnMoving: true,
          forceRenderOnZooming: true
        });

        this.map.addLayer(this.deckLayer);
      }
    })
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
    super.componentWillUnmount();
  }

  // @ts-ignore
  getKey ({ state, type, id }) {
    return `${state}-${type}-${id}`;
  }

  _aggregateAccidents = (accidents: any) => {
    const incidents: any = {};
    const fatalities: any = {};

    if (accidents) {
      accidents.forEach((a: any) => {
        const r = (incidents[a.year] = incidents[a.year] || {});
        const f = (fatalities[a.year] = fatalities[a.year] || {});
        const key = this.getKey(a);
        r[key] = a.incidents;
        f[key] = a.fatalities;
      });
    }
    return {
      incidents,
      fatalities
    };
  };

  _getLineColor = (f: any, fatalities: any) => {
    if (!fatalities) {
      return [200, 200, 200];
    }
    const key = this.getKey(f.properties);
    const fatalitiesPer1KMile = ((fatalities[key] || 0) / f.properties.length) * 1000;
    return COLOR_SCALE(fatalitiesPer1KMile);
  };

  _getLineWidth = (f: any, incidents: any) => {
    if (!incidents) {
      return 10;
    }
    const key = this.getKey(f.properties);
    const incidentsPer1KMile = ((incidents[key] || 0) / f.properties.length) * 1000;
    return WIDTH_SCALE(incidentsPer1KMile);
  };

  formatRow = (d: any) => ({
    ...d,
    incidents: Number(d.incidents),
    fatalities: Number(d.fatalities)
  });
}

export default Highway;
