import * as maptalks from 'maptalks';
import { createCanvas, createContext } from './helper';

const retina = maptalks.Browser.retina ? 2 : 1;

class GLRenderer extends maptalks.renderer.CanvasLayerRenderer {
    draw() {
        this.prepareCanvas();
        this.prepareDrawContext();
        this._drawLayer();
    }

    /**
     * tell layer redraw
     * @returns {*}
     */
    needToRedraw() {
        const map = this.getMap();
        if (map.isZooming() && !map.getPitch()) {
            return false;
        }
        return super.needToRedraw();
    }

    /**
     * listen canvas create
     */
    onCanvasCreate() {
        if (this.canvas && this.layer.options['doubleBuffer']) {
            this.buffer = createCanvas(this.canvas.width, this.canvas.height, retina, this.getMap().CanvasClass);
            this.context = this.buffer.getContext('2d');
        }
    }

    /**
     * create canvas
     */
    createCanvas() {
        if (this.canvas) return;
        if (!this.canvas) {
            const map = this.getMap();
            const size = map.getSize();
            const [width, height] = [retina * size['width'], retina * size['height']];
            this.canvas = createCanvas(width, height, retina, map.CanvasClass);
            this.gl = createContext(this.canvas, this.layer.options['glOptions']);
            this.onCanvasCreate();
            this.layer.fire('canvascreate', { 'context': this.context, 'gl': this.gl });
        }
    }

    /**
     * when map changed, call canvas change
     * @param canvasSize
     */
    resizeCanvas(canvasSize) {
        if (!this.canvas) return;
        const size = canvasSize ? canvasSize : this.getMap().getSize();
        this.canvas.height = retina * size['height'];
        this.canvas.width = retina * size['width'];
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * clear canvas
     */
    clearCanvas() {
        if (!this.canvas) return;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if (this.context) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    prepareCanvas() {
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        const mask = super.prepareCanvas();
        this.layer.fire('renderstart', { 'context' : this.context, 'gl' : this.gl });
        return mask;
    }

    onZoomStart() {
        super.onZoomStart.apply(this, arguments);
    }

    onZoomEnd() {
        super.onZoomEnd.apply(this, arguments);
    }

    remove() {
        delete this._drawContext;
        super.remove();
    }
}

export default GLRenderer;
