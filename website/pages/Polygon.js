import * as React from 'react';
import DeckGLLayer from '../../src';
import { GeoJsonLayer } from '@deck.gl/layers';
import * as maptalks from 'maptalks';
import { getDevicePixelRatio } from '../../src/utils';

class Polygon extends React.Component {
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
      center: [-74.01194070150844, 40.70708981756565],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`
        // subdomains: ['a', 'b', 'c', 'd']
      })
    });

    this.deckLayer = new DeckGLLayer('deck', {
      layers: [
        new GeoJsonLayer({
          data: 'http://58.87.95.84:7300/mock/5b974eaa51241d6b41b178aa/learn-gis/building',
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 1,
          getLineColor: () => [255, 100, 100],
          getFillColor: () => [200, 160, 0, 180]
        })
      ]
    }, {
      animation: true,
      renderer: 'webgl'
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
    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default Polygon;
