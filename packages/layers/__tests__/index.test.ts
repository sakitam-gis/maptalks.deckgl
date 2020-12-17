const { createCanvas, Image } = require('canvas');
// @ts-ignore
import { createHeadlessContext } from '@luma.gl/test-utils';
// @ts-ignore
import * as maptalks from 'maptalks';
// @ts-ignore
import { BitmapLayer } from '@deck.gl/layers';
// @ts-ignore
import { TileLayer } from '@deck.gl/geo-layers';
import DeckGLLayer from '../src';

// global.document = new JSDOM().window.document;
// global.window = new JSDOM().window;
global.Image = Image;

describe('index', () => {
  it('create', (done) => {
    const canvas = createCanvas(800, 600);

    const map = new maptalks.Map(canvas, {
      center: [-74.01194070150844, 40.70708981756565],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c']
      }),
    });
    const props = {
      layers: [
        new TileLayer({
          // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
          data: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],

          // Since these OSM tiles support HTTP/2, we can make many concurrent requests
          // and we aren't limited by the browser to a certain number per domain.
          maxRequests: 20,

          pickable: true,
          // onViewportLoad: onTilesLoad,
          // autoHighlight: showBorder,
          highlightColor: [60, 60, 60, 40],
          // https://wiki.openstreetmap.org/wiki/Zoom_levels
          minZoom: 0,
          maxZoom: 19,
          tileSize: 256,
          // @ts-ignore
          renderSubLayers: (props) => {
            const {
              bbox: {west, south, east, north}
            } = props.tile;

            return [
              new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [west, south, east, north]
              })
            ];
          }
        })
      ],
    }
    const deckLayer = new DeckGLLayer('deck', props, {
      animation: true,
      forceRenderOnMoving: true,
      forceRenderOnZooming: true,
      customCreateGLContext: (canvas1, attrs) => {
        return createHeadlessContext({
          width: canvas1.width,
          height: canvas1.height,
          webgl1: {
            ...attrs,
          }
        })
      },
      renderStart: () => {
      },
      renderEnd: () => {
        expect(deckLayer).toBeDefined();
        map.removeLayer(deckLayer);
        done();
      }
    });

    map.addLayer(deckLayer);
  });
});
