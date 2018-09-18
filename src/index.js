import * as maptalks from 'maptalks';
import { GeoJsonLayer } from '@deck.gl/layers';
import DeckGLLayer from './DeckGLLayer';

const map = new maptalks.Map('map', {
    center: [-74.01194070150844, 40.70708981756565],
    zoom: 10,
    pitch: 30,
    bearing: 30,
    centerCross: true,
    spatialReference:{
        projection:'EPSG:4326'
    },
    baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd'],
        spatialReference:{
            projection:'EPSG:3857'
        }
    })
});

const deckLayer = new DeckGLLayer('deck', {
    'layers': [
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
    'animation': false,
    'renderer': 'webgl'
});

map.addLayer(deckLayer);
