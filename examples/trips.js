import * as maptalks from 'maptalks';
import { PolygonLayer } from '@deck.gl/layers';
import DeckGLLayer from '../src/DeckGLLayer';
import { TripsLayer } from '@deck.gl/experimental-layers';

const map = new maptalks.Map('map', {
    center: [-74, 40.72],
    zoom: 13,
    pitch: 40.5,
    bearing: 0,
    centerCross: true,
    baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
    })
});

const _animate = () => {
    const {
        loopLength = 1800, // unit corresponds to the timestamp in source data
        animationSpeed = 30 // unit time per second
    } = {};
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
        time: ((timestamp % loopTime) / loopTime) * loopLength
    });
    window.requestAnimationFrame(_animate);
};

const deckLayer = new DeckGLLayer('deck', {
    'layers': [
        // new TripsLayer({
        //     id: 'trips',
        //     data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips.json',
        //     getPath: d => d.segments,
        //     getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
        //     opacity: 0.3,
        //     strokeWidth: 2,
        //     trailLength: 180,
        //     currentTime: this.state.time
        // }),
        new PolygonLayer({
            id: 'buildings',
            data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/buildings.json',
            extruded: true,
            wireframe: false,
            fp64: true,
            opacity: 0.5,
            getPolygon: f => f.polygon,
            getElevation: f => f.height,
            getFillColor: [74, 80, 87],
            lightSettings: {
                lightsPosition: [-74.05, 40.7, 8000, -73.5, 41, 5000],
                ambientRatio: 0.05,
                diffuseRatio: 0.6,
                specularRatio: 0.8,
                lightsStrength: [2.0, 0.0, 0.0, 0.0],
                numberOfLights: 2
            }
        })
    ]
}, {
    'animation': false,
    'renderer': 'webgl'
});

map.addLayer(deckLayer);
