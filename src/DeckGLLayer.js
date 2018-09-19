import * as maptalks from 'maptalks';
import GLRenderer from './GLRenderer';
import Deck from './deck';

const _options = {
    'renderer': 'webgl',
    'doubleBuffer': true,
    'glOptions': {
        'alpha': true,
        'antialias': true,
        'preserveDrawingBuffer': true
    }
};

class DeckGLLayer extends maptalks.CanvasLayer {
    static getTargetZoom(map) {
        return map.getMaxNativeZoom();
    }

    constructor(id, props, options = {}) {
        super(id, Object.assign(_options, options));
        this.props = props;
    }

    draw() {
        this.renderScene();
    }

    drawOnInteracting() {
        this.renderScene();
    }

    _getViewState() {
        const map = this.getMap();
        const zoom = map.getZoom();
        const maxZoom = DeckGLLayer.getTargetZoom(map);
        const center = map.getCenter();
        const pitch = map.getPitch();
        const bearing = map.getBearing();
        return {
            latitude: center['y'],
            longitude: center['x'],
            zoom: zoom - 1,
            bearing: bearing,
            pitch: pitch,
            maxZoom: maxZoom
        }
    }

    renderScene() {
        const renderer = this._getRenderer();
        const viewState = this._getViewState();
        if (this.deck) {
            this.deck.setProps({ viewState });
            this.deck._drawLayers();
        } else {
            if (!renderer.gl) return;
            const { layers } = this.props;
            this.deck = new Deck({
                controller: false,
                _customRender: true,
                viewState: viewState,
                glOptions: {
                    'alpha': true,
                    'antialias': true,
                    'preserveDrawingBuffer': true
                }
            });
            this.deck._setGLContext(renderer.gl);
            this.deck.setProps({
                layers: layers
            });
        }
        renderer.completeRender();
    }
}

DeckGLLayer.registerRenderer('webgl', GLRenderer);

export default DeckGLLayer;
