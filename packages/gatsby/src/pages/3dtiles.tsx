import DeckGLLayer from '@salitam-gis/maptalks.deckgl';
import Base from './base';
import { Tile3DLayer } from '@deck.gl/geo-layers';

import { CesiumIonLoader } from '@loaders.gl/3d-tiles';

const ION_ASSET_ID = 43978;
const ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';
const TILESET_URL = `https://assets.cesium.com/${ION_ASSET_ID}/tileset.json`;

interface IProps {

}

class C3DTiles extends Base {
  private deckLayer: DeckGLLayer | null;

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [-75, 40],
      zoom: 16,
      pitch: 45,
      bearing: 0,
    };

    this.onTilesetLoad = this.onTilesetLoad.bind(this);
  }

  initMap() {
    super.initMap();

    this.deckLayer = new DeckGLLayer('deck', {
      layers: [
        new Tile3DLayer({
          id: 'tile-3d-layer',
          pointSize: 2,
          data: TILESET_URL,
          loader: CesiumIonLoader,
          loadOptions: {'cesium-ion': {accessToken: ION_TOKEN}},
          onTilesetLoad: this.onTilesetLoad,
        })
      ]
    }, {
      animation: false,
      forceRenderOnMoving: true,
      forceRenderOnZooming: true
    });

    this.map.addLayer(this.deckLayer);
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  setInitialViewState = (state: {
    longitude: number;
    latitude: number;
    zoom: number;
  }) => {
    this.map.animate({
      center: [state.longitude, state.latitude],
      zoom: state.zoom,
    })
  };

  onTilesetLoad = (tileset: any) => {
    // Recenter view to cover the new tileset
    const { cartographicCenter, zoom } = tileset;
    this.setInitialViewState({
      longitude: cartographicCenter[0],
      latitude: cartographicCenter[1],
      zoom
    });
  };
}

export default C3DTiles;
