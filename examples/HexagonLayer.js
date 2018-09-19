import * as maptalks from 'maptalks';
import { HexagonLayer } from '@deck.gl/layers';
import DeckGLLayer from '../src/DeckGLLayer';

const map = new maptalks.Map('map2', {
    center: [52.232395363869415, -1.4157267858730052],
    zoom: 6.6,
    pitch: 40.5,
    bearing: -27.396674584323023,
    centerCross: true,
    baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
    })
});

const deckLayer = new DeckGLLayer('deck', {
    'layers': [
        new HexagonLayer({
            id: 'heatmap',
            colorRange: [
                [1, 152, 189],
                [73, 227, 206],
                [216, 254, 181],
                [254, 237, 177],
                [254, 173, 84],
                [209, 55, 78]
            ],
            coverage: 1,
            data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv',
            elevationRange: [0, 3000],
            elevationScale: 50,
            extruded: true,
            getPosition: d => d,
            lightSettings: {
                lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
                ambientRatio: 0.4,
                diffuseRatio: 0.6,
                specularRatio: 0.2,
                lightsStrength: [0.8, 0.0, 0.8, 0.0],
                numberOfLights: 2
            },
            opacity: 1,
            radius: 1000,
            upperPercentile: 100
        })
    ]
}, {
    'animation': false,
    'renderer': 'webgl'
});

map.addLayer(deckLayer);
