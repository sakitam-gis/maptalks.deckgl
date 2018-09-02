import * as maptalks from 'maptalks';
import { LayerManager, PerspectiveView, MapView } from 'deck.gl'; // eslint-disable-line
import { createContext } from './helper';

const retina = maptalks.Browser.retina ? 2 : 1;

const _options = {
    'renderer' : 'gl',
    'doubleBuffer' : true,
    'glOptions' : null
};

const RADIAN = Math.PI / 180;

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

    /**
     * coordinates to vector
     * @param coordinate
     * @returns {null}
     */
    coordinateToVector3(coordinate) {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const p = map.coordinateToPoint(coordinate, DeckGLLayer.getTargetZoom(map));
        return p;
    }

    lookAt(vector) {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.context.lookAt(vector);
        }
        return this;
    }

    getCamera() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.camera;
        }
        return null;
    }

    getScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.scene;
        }
        return null;
    }

    renderScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.renderScene();
        }
        return this;
    }

    _getFovRatio() {
        const map = this.getMap();
        const fov = map.getFov();
        return Math.tan(fov / 2 * RADIAN);
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
                }
                this.canvas = this.layer._canvas;
            } else {
                this.canvas = maptalks.Canvas.createCanvas(width, height, map.CanvasClass);
                const gl = this.gl = createContext(this.canvas, this.layer.options['glOptions']);
                gl.clearColor(0.0, 0.0, 0.0, 0.0);
                // this.context = this.gl;
            }
            this.onCanvasCreate();

            if (this.layer.options['doubleBuffer']) {
                this.buffer = maptalks.Canvas.createCanvas(this.canvas.width, this.canvas.height, map.CanvasClass);
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

    // renderScene() {
    //     this._locateCamera();
    //     const { layers } = this.layer.props;
    //     const map = this.getMap();
    //     const size = map.getSize();
    //     const [width, height] = [retina * size['width'], retina * size['height']];
    //     const _props = {
    //         width: width, // Number, required
    //         height: height,
    //         canvas: this.canvas,
    //         layers: layers,
    //         // gl: this.gl,
    //         _customRender: true,
    //         initialViewState: this._getViewState()
    //     };
    //     if (!this.deckLayer) {
    //         this.deckLayer = new deck.Deck(_props); // eslint-disable-line
    //     } else {
    //         this.deckLayer.setProps(Object.assign({
    //             viewState: _props.initialViewState
    //         }, _props));
    //     }
    //     this.completeRender();
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

    _locateCamera() {
        // const map = this.getMap();
        // const size = map.getSize();
        // const scale = map.getScale();
        // const camera = this.camera;
        // // 1. camera is always looking at map's center
        // // 2. camera's distance from map's center doesn't change when rotating and tilting.
        // const center2D = map.coordinateToPoint(map.getCenter(), getTargetZoom(map));
        // const pitch = map.getPitch() * RADIAN;
        // const bearing = map.getBearing() * RADIAN;
        //
        // const ratio = this.layer._getFovRatio();
        // const z = -scale * size.height / 2 / ratio;
        //
        // // when map tilts, camera's position should be lower in Z axis
        // camera.position.z = z * Math.cos(pitch);
        // // and [dist] away from map's center on XY plane to tilt the scene.
        // const dist = Math.sin(pitch) * z;
        // // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
        // camera.position.x = center2D.x + dist * Math.sin(bearing);
        // camera.position.y = center2D.y - dist * Math.cos(bearing);
        //
        // // when map rotates, camera's up axis is pointing to south direction of map
        // camera.up.set(Math.sin(bearing), -Math.cos(bearing), 0);
        //
        // // look at to the center of map
        // camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
        // camera.updateProjectionMatrix();
    }

    _getLookAtMat() {
        const map = this.getMap();

        const targetZ = DeckGLLayer.getTargetZoom(map);

        const size = map.getSize(),
            scale = map.getScale() / map.getScale(targetZ);
        // const center = this.cameraCenter = map._prjToPoint(map._getPrjCenter(), map.getMaxNativeZoom());
        const center2D = this.cameraCenter = map.coordinateToPoint(map.getCenter(), targetZ);
        const pitch = map.getPitch() * RADIAN;
        const bearing = -map.getBearing() * RADIAN;

        const ratio = this.layer._getFovRatio();
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
        const viewport = new PerspectiveView(_viewParams);
        const layerManager = new LayerManager(this.gl, {});
        layerManager.setViews(viewport);
        this.layerManager = layerManager;
    }

    renderScene() {
        // const { layers } = this.layer.props;
        const _viewParams = this._getLookAtMat();
        const viewport = new PerspectiveView(_viewParams);
        this.layerManager.setViews(viewport);
        this.setProps({
            width: this.canvas.width,
            height: this.canvas.height
        });
        this.completeRender();
    }

    setProps(props) {
        props = Object.assign({}, this.layer.props, props);
        // Update layer manager props (but not size)
        if (this.layerManager) {
            this.layerManager.setProps(props);
        }
    }
}

DeckGLLayer.registerRenderer('canvas', DeckGLRenderer);
DeckGLLayer.registerRenderer('gl', DeckGLRenderer);

export {
    DeckGLLayer,
    DeckGLRenderer
}
