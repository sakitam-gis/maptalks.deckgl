import * as React from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import 'ol/ol.css';
import '../assets/style/art.scss'
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import DeckGLLayer from '../../src';
import { GeoJsonLayer } from '@deck.gl/layers';
import { scaleLinear, scaleThreshold } from 'd3-scale';

const COLOR_SCALE = scaleThreshold()
  .domain([0, 4, 8, 12, 20, 32, 52, 84, 136, 220])
  .range([
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
  ]);

const WIDTH_SCALE = scaleLinear()
  .clamp(true)
  .domain([0, 200])
  .range([10, 2000]);

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
    this.map = new Map({
      target: this.container,
      layers: [
        new TileLayer({
          preload: 4,
          source: new OSM()
        })
      ],
      loadTilesWhileAnimating: true,
      view: new View({
        center: fromLonLat([-100, 38]),
        zoom: 6
      })
    });

    require('d3-request').csv('https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/highway/accidents.csv', this.formatRow, (error, response) => {
      const year = response[0].year;
      const accidents = response;
      if (!error) {
        const { fatalities, incidents } = this._aggregateAccidents(accidents);
        this.deckLayer = new DeckGLLayer({
          'layers': [
            new GeoJsonLayer({
              id: 'geojson',
              data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/highway/roads.json',
              opacity: 1,
              stroked: false,
              filled: false,
              lineWidthMinPixels: 0.5,
              parameters: {
                depthTest: false
              },
              getLineColor: f => this._getLineColor(f, fatalities[year]),
              getLineWidth: f => this._getLineWidth(f, incidents[year]),
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
          map: this.map,
          projection: 'EPSG:3857'
        });
        this.map.addLayer(this.deckLayer);
      }
    });
  }

  getKey ({ state, type, id }) {
    return `${state}-${type}-${id}`;
  }

  _aggregateAccidents = (accidents) => {
    const incidents = {};
    const fatalities = {};

    if (accidents) {
      accidents.forEach(a => {
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

  _getLineColor = (f, fatalities) => {
    if (!fatalities) {
      return [200, 200, 200];
    }
    const key = this.getKey(f.properties);
    const fatalitiesPer1KMile = ((fatalities[key] || 0) / f.properties.length) * 1000;
    return COLOR_SCALE(fatalitiesPer1KMile);
  };

  _getLineWidth = (f, incidents) => {
    if (!incidents) {
      return 10;
    }
    const key = this.getKey(f.properties);
    const incidentsPer1KMile = ((incidents[key] || 0) / f.properties.length) * 1000;
    return WIDTH_SCALE(incidentsPer1KMile);
  };

  formatRow = d => ({
    ...d,
    incidents: Number(d.incidents),
    fatalities: Number(d.fatalities)
  });

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
