import mapboxgl from './mapbox-gl-dev';
import { LineLayer } from '@deck.gl/layers';
import DeckLayer from '@deck.gl/mapbox-layers';

const INITIAL_VIEW_STATE = {
    latitude: 40.70708981756565,
    longitude: -74.01194070150844,
    zoom: 5.2,
    bearing: 20,
    pitch: 60
};

// Set your mapbox token here
mapboxgl.accessToken = process.env.MapboxAccessToken || 'pk.eyJ1IjoidWJlcmRhdGEiLCJhIjoiY2l6NHIxcWNnMDQ1aTJxcXdjdW1qOTYyNCJ9.326OLFxa-CJwreUPXpjMaA'; // eslint-disable-line

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    bearing: INITIAL_VIEW_STATE.bearing,
    pitch: INITIAL_VIEW_STATE.pitch
});

map.on('load', () => {
    const deckLayer = new DeckLayer({
        layers: [
            new LineLayer({
                id: 'line-layer',
                data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/website/bart-segments.json',
                pickable: true,
                getStrokeWidth: 12,
                getSourcePosition: d => d.from.coordinates,
                getTargetPosition: d => d.to.coordinates,
                getColor: d => [Math.sqrt(d.inbound + d.outbound), 140, 0],
                // onHover: ({object}) => setTooltip(`${object.from.name} to ${object.to.name}`)
            })
        ]
    });

    map.addLayer(deckLayer, getFirstTextLayerId(map.getStyle()));
});

function getFirstTextLayerId(style) {
    const layers = style.layers;
    // Find the index of the first symbol (i.e. label) layer in the map style
    let firstSymbolId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }
    return firstSymbolId;
}
