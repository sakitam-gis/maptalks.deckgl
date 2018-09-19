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

    /**
     * set props
     * @param props
     * @returns {DeckGLLayer}
     */
    setProps(props) {
        this.props = Object.assign(this.props, props);
        return this;
    }

    /**
     * get props
     * @returns {*}
     */
    getProps() {
        return this.props;
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
        const map = this.getMap()
        const renderer = this._getRenderer();
        const viewState = this._getViewState();
        const { layers } = this.props;
        if (this.deck) {
            this.deck.setProps({ viewState, layers, targetMap: map });
            this.deck._drawLayers();
        } else {
            if (!renderer.gl) return;
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
                layers: layers,
                targetMap: map
            });
        }
        renderer.completeRender();
    }
}

DeckGLLayer.registerRenderer('webgl', GLRenderer);

export default DeckGLLayer;
