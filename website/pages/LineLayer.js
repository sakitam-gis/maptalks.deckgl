import * as React from 'react';
import DeckGLLayer from '../../src';
import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import * as maptalks from 'maptalks';

const DATA_URL = {
  AIRPORTS:
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/line/airports.json',
  FLIGHT_PATHS:
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/line/heathrow-flights.json'
};

function getColor (d) {
  const z = d.start[2];
  const r = z / 10000;
  return [255 * (1 - r * 2), 128 * r, 255 * r, 255 * (1 - r)];
}

function getSize (type) {
  if (type.search('major') >= 0) {
    return 100;
  }
  if (type.search('small') >= 0) {
    return 30;
  }
  return 60;
}

class Index extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {};

    this.container = null;
    this.map = null;
    this.inited = false;
    this.deckLayer = null;
  }

  componentDidMount () {
    const {
      airports = DATA_URL.AIRPORTS,
      flightPaths = DATA_URL.FLIGHT_PATHS,
      getStrokeWidth = 3.7
    } = this.props;
    this.map = new maptalks.Map(this.container, {
      center: [7, 47.65],
      zoom: 5,
      pitch: 45,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
      })
    });

    this.deckLayer = new DeckGLLayer('deck', {
      'layers': [
        new ScatterplotLayer({
          id: 'airports',
          data: airports,
          radiusScale: 20,
          getPosition: d => d.coordinates,
          getColor: [255, 140, 0],
          getRadius: d => getSize(d.type),
          pickable: true
        }),
        new LineLayer({
          id: 'flight-paths',
          data: flightPaths,
          fp64: false,
          getSourcePosition: d => d.start,
          getTargetPosition: d => d.end,
          getColor,
          getStrokeWidth,
          pickable: true
        })
      ]
    }, {
      'animation': true,
      'renderer': 'webgl'
    });

    this.map.addLayer(this.deckLayer);
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
