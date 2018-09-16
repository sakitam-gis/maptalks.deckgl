import * as maptalks from 'maptalks';
import GLRenderer from './gl-render';
import { main, render } from './webgl-sence';

const _options = {
    'renderer': 'webgl',
    'doubleBuffer': true,
    'glOptions': {
        'alpha': true,
        'antialias': true,
        'preserveDrawingBuffer': true
    }
};

class GLLayer extends maptalks.CanvasLayer {
    constructor(id, data, options = {}) {
        super(id, Object.assign(_options, options));
        this.data = data;
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
        const context = renderer.context || renderer.canvas.getContext('2d');
        if (this._layer) {
            render(new Date().getTime());
        } else {
            this._layer = main(renderer.gl);
        }
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.save();
        context.drawImage(renderer.gl.canvas, 0, 0, context.canvas.width, context.canvas.height);
        context.restore();
        renderer.completeRender();
    }
}

GLLayer.registerRenderer('webgl', GLRenderer);

export {
    GLLayer
}

const map = new maptalks.Map('map', {
    center: [-74.01194070150844, 40.70708981756565],
    zoom: 10,
    pitch: 30,
    bearing: 30,
    centerCross: true,
    spatialReference: {
        projection: 'EPSG:3857'
    },
    baseLayer: new maptalks.TileLayer('tile', {
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd']
    })
});

const features = [];
const extent = map.getExtent();
const ext = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
for (let i = 0; i < 100; i++) {
    features.push([ext[0] + (ext[2] - ext[0]) * Math.random(), ext[1] + (ext[3] - ext[1]) * Math.random(), 500]);
}

const glLayer = new GLLayer('gl', features);

map.addLayer(glLayer);
