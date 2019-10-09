import * as React from 'react';
import DeckGLLayer from '../../src';
import { GeoJsonLayer } from '@deck.gl/layers';
import { scaleLinear, scaleThreshold } from 'd3-scale';
import * as maptalks from 'maptalks';
import { getDevicePixelRatio } from '../../src/utils';

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
    this.map = new maptalks.Map(this.container, {
      center: [-100, 38],
      zoom: 6.6,
      pitch: 40.5,
      bearing: -27.396674584323023,
      centerCross: true,
      spatialReference: {
        projection: 'EPSG:3857'
      },
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`,
        // subdomains: ['a', 'b', 'c', 'd'],
        spatialReference: {
          projection: 'EPSG:3857'
        }
      })
    });

    require('d3-request').csv('https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/highway/accidents.csv', this.formatRow, (error, response) => {
      const year = response[0].year;
      const accidents = response;
      if (!error) {
        const { fatalities, incidents } = this._aggregateAccidents(accidents);
        this.deckLayer = new DeckGLLayer('deck', {
          layers: [
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
          animation: false,
          renderer: 'webgl'
        });

        this.map.addLayer(this.deckLayer);
      }
    });
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
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
    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default Index;
