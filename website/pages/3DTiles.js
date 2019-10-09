import * as React from 'react';
import DeckGLLayer from '../../src';
import { Tile3DLayer } from '@deck.gl/geo-layers';
import * as maptalks from 'maptalks';
import { registerLoaders } from '@loaders.gl/core';
// To manage dependencies and bundle size, the app must decide which supporting loaders to bring in
import { DracoWorkerLoader } from '@loaders.gl/draco';
import { getDevicePixelRatio } from '../../src/utils';

registerLoaders([DracoWorkerLoader]);

const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -75,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 17
};

const ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';

class C3DTiles extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {
      viewState: INITIAL_VIEW_STATE,
      attributions: []
    };

    this.container = null;
    this.map = null;
    this.inited = false;
    this.deckLayer = null;

    this._onTilesetLoad = this._onTilesetLoad.bind(this);
  }

  componentDidMount () {
    this.map = new maptalks.Map(this.container, {
      center: [-75, 40],
      zoom: 16,
      pitch: 45,
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

    this.deckLayer = new DeckGLLayer('deck', {
      layers: [
        new Tile3DLayer({
          id: 'tile-3d-layer',
          _ionAssetId: 43978,
          _ionAccessToken: ION_TOKEN,
          pointSize: 2,
          onTilesetLoad: this._onTilesetLoad
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

  // Called by Tile3DLayer when a new tileset is loaded
  _onTilesetLoad (tileset) {
    this.setState({ attributions: tileset.credits.attributions });
    this._centerViewOnTileset(tileset);
  }

  // Recenter view to cover the new tileset, with a fly-to transition
  _centerViewOnTileset (tileset) {
    const { cartographicCenter, zoom } = tileset;
    this.setState({
      viewState: {
        ...this.state.viewState,

        // Update deck.gl viewState, moving the camera to the new tileset
        longitude: cartographicCenter[0],
        latitude: cartographicCenter[1],
        zoom: zoom + 1.5, // TODO - remove adjustment when Tileset3D calculates correct zoom
        bearing: INITIAL_VIEW_STATE.bearing,
        pitch: INITIAL_VIEW_STATE.pitch
      }
    });
  }

  // Called by DeckGL when user interacts with the map
  _onViewStateChange (event) {
    const zoom = this.map.getZoom();
    const center = this.map.getCenter().toArray();
    const bearing = this.map.getBearing();
    const pitch = this.map.getPitch();
    this.setState({
      ...this.state.viewState,
      longitude: center[0],
      latitude: center[1],
      zoom: zoom + 1.5, // TODO - remove adjustment when Tileset3D calculates correct zoom
      bearing,
      pitch
    });
  }

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    if (this.deckLayer) {
      this.deckLayer.setProps({
        layers: [
          new Tile3DLayer({
            id: 'tile-3d-layer',
            _ionAssetId: 43978,
            _ionAccessToken: ION_TOKEN,
            pointSize: 2,
            onTilesetLoad: this._onTilesetLoad
          })
        ]
      });
    }
    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default C3DTiles;
