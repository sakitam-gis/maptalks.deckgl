import * as maptalks from 'maptalks';
import { Deck } from '@deck.gl/core'; // eslint-disable-line
import { GeoJsonLayer } from '@deck.gl/layers';
import { createContext, createCanvas } from './helper';

const retina = maptalks.Browser.retina ? 2 : 1;

const _options = {
    'renderer' : 'gl',
    'doubleBuffer' : true,
    'glOptions' : null
};

// const RADIAN = Math.PI / 180;

class DeckGLLayer extends maptalks.CanvasLayer {
    static getTargetZoom(map) {
        return map.getMaxNativeZoom();
    }

    constructor(id, props, options = {}) {
        super(id, Object.assign(_options, options));
        this.props = props;
    }

    prepareToDraw() {}

    /**
     * Draw method of ThreeLayer
     * In default, it calls renderScene, refresh the camera and the scene
     */
    draw() {
        this.renderScene();
    }

    /**
     * Draw method of ThreeLayer when map is interacting
     * In default, it calls renderScene, refresh the camera and the scene
     */
    drawOnInteracting() {
        this.renderScene();
    }

    renderScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.renderScene();
        }
        return this;
    }
}

class DeckGLRenderer extends maptalks.renderer.CanvasLayerRenderer {

    _drawLayer() {
        super._drawLayer.apply(this, arguments);
        this.renderScene();
    }

    hitDetect() {
        return false;
    }

    createCanvas() {
        if (!this.canvas) {
            const map = this.getMap();
            const size = map.getSize();
            const [width, height] = [retina * size['width'], retina * size['height']];
            if (this.layer._canvas) {
                const canvas = this.layer._canvas;
                canvas.width = width;
                canvas.height = height;
                if (canvas.style) {
                    canvas.style.width = width + 'px';
                    canvas.style.height = height + 'px';
                    canvas.clientWidth = width;
                    canvas.clientHeight = height;
                }
                this.canvas = this.layer._canvas;
            } else {
                this.canvas = createCanvas(width, height, retina, map.CanvasClass);
                const gl = createContext(this.canvas, this.layer.options['glOptions']);
                gl.clearColor(0.0, 0.0, 0.0, 0.0);
                // gl.canvas.setAttribute('width', width);
                // gl.canvas.setAttribute('height', height);
                // gl.canvas.style.width = width + 'px';
                // gl.canvas.style.height = height + 'px';
                // gl.canvas.setAttribute('clientWidth', width);
                // gl.canvas.setAttribute('clientHeight', height);
                this.gl = gl;
            }
            this.onCanvasCreate();

            if (this.layer.options['doubleBuffer']) {
                this.buffer = createCanvas(this.canvas.width, this.canvas.height, retina, map.CanvasClass);
                this.context = this.buffer.getContext('2d');
            }

            this.layer.fire('canvascreate', {
                'context' : this.context,
                'gl' : this.gl
            });
        }
        return this.canvas;
    }

    // onCanvasCreate() {
    //     super.onCanvasCreate();
    //     this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    // }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        const size = canvasSize ? canvasSize : this.getMap().getSize();
        this.canvas.height = retina * size['height'];
        this.canvas.width = retina * size['width'];
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if (this.context) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    prepareCanvas() {
        if (this.context) {
            return super.prepareCanvas();
        }
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        this.layer.fire('renderstart', { 'context' : this.context, 'gl' : this.gl });
        return null;
    }

    remove() {
        delete this._drawContext;
        super.remove();
    }

    _getViewState() {
        const map = this.getMap();
        const zoom = map.getGLZoom();
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

    onCanvasCreate() {
        if (!this.deck) {
            const { layers } = this.layer.props;
            this.deck = new Deck({
                // TODO - this should not be needed
                canvas: 'deck-canvas',
                width: '100%',
                height: '100%',
                controller: false,
                _customRender: true,
                viewState: this._getViewState()
                // views: [new MapView({farZmultiplier: 0.101})]
            });
            this.deck._setGLContext(this.gl);
            this.deck.width = 1920;
            this.deck.height = 505;
            this.deck.setProps({
                layers: layers
            });
        }
    }

    renderScene() {
        if (this.deck) {
            const viewState = this._getViewState();
            // console.log('render3D', viewState, matrix);
            // gl.depthRange(0.9999, 1.0);

            this.deck.setProps({ viewState });
            this.deck.width = 1920;
            this.deck.height = 505;
            this.deck._drawLayers();
        }
        this.completeRender();
    }
}

DeckGLLayer.registerRenderer('canvas', DeckGLRenderer);
DeckGLLayer.registerRenderer('gl', DeckGLRenderer);

export {
    DeckGLLayer,
    DeckGLRenderer
}

const map = new maptalks.Map('map', {
    center: [-74, 40.72],
    zoom: 5,
    pitch: 60,
    bearing: 20,
    centerCross: true,
    baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
    })
});

const deckLayer = new DeckGLLayer('deck', {
    'layers': [
        new GeoJsonLayer({
            data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson',
            stroked: true,
            filled: true,
            lineWidthMinPixels: 2,
            opacity: 1,
            getLineColor: () => [255, 0, 0],
            getFillColor: () => [200, 200, 0, 200]
        })
    ]
}, {
    renderer: 'gl'
});

map.addLayer(deckLayer);
