import * as maptalks from 'maptalks';
import { LayerManager, PerspectiveViewport } from 'deck.gl';

const options = {
    'renderer' : 'webgl',
    'doubleBuffer' : true,
    'glOptions' : null
};

const RADIAN = Math.PI / 180;

/**
 * A Layer to render with DECK.GL (https://github.com/uber/deck.gl), a WebGL data visualization lib. <br>
 *
 * @classdesc
 * A layer to render with DECK.GL
 * @example
 *  var layer = new maptalks.DeckGLLayer('deck');
 *
 *  layer.prepareToDraw = function (gl, scene, camera) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (gl, scene, camera, width, height) {
 *      //...
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.CanvasLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.ThreeLayer#options}
 */
export class DeckGLLayer extends maptalks.CanvasLayer {

}

DeckGLLayer.mergeOptions(options);

export class DeckGLRenderer extends maptalks.renderer.CanvasLayerRenderer {

    draw() {
        super.draw();
        this.renderScene();
    }

    drawOnInteracting() {
        super.drawOnInteracting();
        this.renderScene();
    }

    getPrepareParams() {
        return [this.layerManager];
    }

    getDrawParams() {
        return [this.layerManager];
    }

    createCanvas() {
        if (this.canvas) {
            return;
        }

        const map = this.getMap();
        const size = map.getSize();
        const r = maptalks.Browser.retina ? 2 : 1;
        this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        const gl = this.gl = this._createGLContext(this.canvas, this.layer.options['glOptions']);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        if (this.onCanvasCreate) {
            this.onCanvasCreate();
        }

        if (this.layer.options['doubleBuffer']) {
            this.buffer = maptalks.Canvas.createCanvas(this.canvas.width, this.canvas.height, map.CanvasClass);
            this.context = this.buffer.getContext('2d');
        }
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        let size;
        if (!canvasSize) {
            size = this.getMap().getSize();
        } else {
            size = canvasSize;
        }
        const r = maptalks.Browser.retina ? 2 : 1;
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
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
            // the layer is double buffered, clip the canvas with layer's mask.
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

    getTargetZoom(map) {
        return map.getMaxNativeZoom() / 2;
    }

    _getLookAtMat() {
        const map = this.getMap();

        const targetZ = this.getTargetZoom(map);

        const size = map.getSize(),
            scale = map.getScale() / map.getScale(targetZ);
        // const center = this.cameraCenter = map._prjToPoint(map._getPrjCenter(), map.getMaxNativeZoom());
        const center2D = this.cameraCenter = map.coordinateToPoint(map.getCenter(), targetZ);
        const pitch = map.getPitch() * RADIAN;
        const bearing = -map.getBearing() * RADIAN;

        const ratio = this._getFovRatio();
        const z = scale * size.height / 2 / ratio;
        const cz = z * Math.cos(pitch);
        // and [dist] away from map's center on XY plane to tilt the scene.
        const dist = Math.sin(pitch) * z;
        // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
        const cx = center2D.x + dist * Math.sin(bearing);
        const cy = center2D.y + dist * Math.cos(bearing);

        // when map rotates, camera's up axis is pointing to bearing from south direction of map
        // default [0,1,0] is the Y axis while the angle of inclination always equal 0
        // if you want to rotate the map after up an incline,please rotateZ like this:
        // let up = new vec3(0,1,0);
        // up.rotateZ(target,radians);
        return {
            eye: [cx, cy, cz],
            fov: ratio,
            width: size.width,
            height: size.height
        };
    }


    onCanvasCreate() {
        const _viewParams = this._getLookAtMat();
        const viewport = new PerspectiveViewport(_viewParams);
        const layerManager = new LayerManager({ gl:this.gl });
        layerManager.setViewport(viewport);
        this.layerManager = layerManager;
    }

    onRemove() {

    }

    renderScene() {
        const _viewParams = this._getLookAtMat();
        const viewport = new PerspectiveViewport(_viewParams);
        this.layerManager.setViewport(viewport);
        this.layerManager.updateLayers();
        this.completeRender();
    }
}

DeckGLLayer.registerRenderer('canvas', DeckGLRenderer);
DeckGLLayer.registerRenderer('webgl', DeckGLRenderer);
