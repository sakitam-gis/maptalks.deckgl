import * as maptalks from 'maptalks';
import { Deck } from '@deck.gl/core'; // eslint-disable-line
import { GeoJsonLayer } from '@deck.gl/layers';
import { createContext, createCanvas } from './helper';

const retina = maptalks.Browser.retina ? 2 : 1;

Deck.prototype._checkForCanvasSizeChange = function () {
    const canvas = this.canvas;
    if (canvas && (this.width !== canvas.width || this.height !== canvas.height)) {
        this.width = canvas.width;
        this.height = canvas.height;
        return true;
    }
    return false;
};

const _options = {
    'renderer' : 'webgl',
    'doubleBuffer' : true,
    'glOptions' : {
        'alpha': true,
        'antialias': true,
        'preserveDrawingBuffer': true
    }
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

    needToRedraw() {
        const map = this.getMap();
        if (map.isZooming() && !map.getPitch()) {
            return false;
        }
        return super.needToRedraw();
    }

    createCanvas() {
        if (this.canvas) return;
        // super.createCanvas();
        if (!this.canvas) {
            const map = this.getMap();
            const size = map.getSize();
            const [width, height] = [retina * size['width'], retina * size['height']];
            this.canvas = createCanvas(width, height, retina, map.CanvasClass);
            const gl = this.gl = createContext(this.canvas, this.layer.options['glOptions']);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
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
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) return;
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

    onZoomStart() {
        super.onZoomStart.apply(this, arguments);
    }

    onZoomEnd() {
        super.onZoomEnd.apply(this, arguments);
    }

    // getCanvasImage() {
    //     const canvasImg = super.getCanvasImage();
    //     if (canvasImg && canvasImg.image && this.buffer) {
    //         const canvas = canvasImg.image;
    //         if (this.buffer.width !== canvas.width || this.buffer.height !== canvas.height || !this._preserveBuffer) {
    //             this.buffer.width = canvas.width;
    //             this.buffer.height = canvas.height;
    //         }
    //         if (!this._preserveBuffer) {
    //             this.context.drawImage(canvas, 0, 0);
    //         }
    //         canvasImg.image = this.buffer;
    //     }
    //     return canvasImg;
    // }

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
        super.onCanvasCreate();
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
            this.deck._drawLayers();
        }
        this.completeRender();
    }
}

DeckGLLayer.registerRenderer('webgl', DeckGLRenderer);

export {
    DeckGLLayer,
    DeckGLRenderer
}

const map = new maptalks.Map('map', {
    center: [-100, 40],
    zoom: 3,
    pitch: 30,
    bearing: 30,
    centerCross: true,
    spatialReference:{
        projection:'EPSG:3857'
    },
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
            opacity: 0.4,
            getLineColor: () => [255, 100, 100],
            getFillColor: () => [200, 160, 0, 180]
        })
    ]
});

map.addLayer(deckLayer);
