import * as React from 'react';
import DeckGLLayer from '../../';
import { IconLayer } from '@deck.gl/layers';
import * as maptalks from 'maptalks';
import { getDevicePixelRatio } from '../../src/utils';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/icon/meteorites.json';

class IconLayerComponent extends React.Component {
  constructor (props, context) {
    super(props, context);

    this.container = null;
    this.map = null;
    this.inited = false;
    this.deckLayer = null;
  }

  componentDidMount () {
    this.map = new maptalks.Map(this.container, {
      center: [-35, 36.7],
      zoom: 2.8,
      pitch: 0,
      bearing: 0,
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

    const layerProps = {
      data: DATA_URL,
      pickable: true,
      wrapLongitude: true,
      getPosition: d => d.coordinates,
      iconAtlas: './static/icons/location-icon-atlas.png',
      iconMapping: './static/json/location-icon-mapping.json'
      // onHover: this._onHover
    };

    this.deckLayer = new DeckGLLayer('deck', {
      layers: [
        new IconLayer({
          ...layerProps,
          id: 'icon',
          getIcon: d => 'marker',
          sizeUnits: 'meters',
          sizeScale: 2000,
          sizeMinPixels: 6
        })
      ]
    }, {
      animation: true,
      renderer: 'webgl'
    });

    this.map.addLayer(this.deckLayer);

    this.map.on('moving pitch resize zooming', this._onViewStateChange, this);
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

export default IconLayerComponent;
