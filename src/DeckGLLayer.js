import * as maptalks from 'maptalks';
import GLRenderer from './GLRenderer';
import { Deck } from '@deck.gl/core';

Deck.prototype._checkForCanvasSizeChange = function () {
    const canvas = this.canvas;
    if (canvas && (this.width !== canvas.width || this.height !== canvas.height)) {
        this.width = canvas.width;
        this.height = canvas.height;
        return true;
    }
    return false;
};

class DeckGLLayer extends maptalks.CanvasLayer {
    static getTargetZoom(map) {
        return map.getMaxNativeZoom();
    }

    constructor(id, props, options = {}) {
        super(id, options);
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
            zoom: zoom,
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
                // TODO - this should not be needed
                canvas: 'deck-canvas',
                width: '100%',
                height: '100%',
                controller: false,
                _customRender: true,
                viewState: viewState
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
