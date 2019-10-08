import { Deck, WebMercatorViewport } from '@deck.gl/core';

import {
  Canvas as canvas2d,
  CanvasLayer,
  renderer,
} from 'maptalks';
import {
  addLayer, drawLayer,
  getDeckInstance, removeLayer,
  updateLayer
} from './deck-utils';
import { createContext } from './utils';

const _options = {
  renderer: 'webgl',
  doubleBuffer: true,
  glOptions: {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  },
  forceRenderOnMoving: true,
  forceRenderOnZooming: true,
};

const originProps = {
  useDevicePixels: true,
  autoResizeDrawingBuffer: true,
};

// from https://github.com/maptalks/maptalks.mapboxgl/blob/5db0b124981f59e597ae66fb68c9763c53578ac2/index.js#L201
const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));

function getZoom (res) {
  return 19 - Math.log(res / MAX_RES) / Math.LN2;
}

function getViewState (map) {
  const res = map.getResolution();
  const maxZoom = map.getMaxNativeZoom();
  const center = map.getCenter();
  const pitch = map.getPitch();
  const bearing = map.getBearing();
  return {
    latitude: center.y,
    longitude: center.x,
    zoom: getZoom(res),
    bearing,
    pitch,
    maxZoom
  };
}

class DeckGLLayer extends CanvasLayer {
  constructor (id, props, options = {}) {
    super(id, Object.assign(_options, options));
    props.id = id;
    this.props = props;

    /**
     * layer is load
     * @type {boolean}
     * @private
     */
    this._isLoad = false;
  }

  /**
   * set props
   * @param props
   * @returns {DeckGLLayer}
   */
  setProps (props) {
    Object.assign(this.props, props, { id: this.id });
    // safe guard in case setProps is called before onAdd
    if (this.deck) {
      updateLayer(this.deck, this);
    }
    return this;
  }

  /**
   * get props
   * @returns {*}
   */
  getProps () {
    return this.props;
  }

  prepareToDraw () {}

  draw () {
    this.renderLayer();
  }

  drawOnInteracting () {
    this.renderLayer();
  }

  onAdd () {
    // const map = this.getMap();
  }

  onRemove () {
    removeLayer(this.deck, this);
  }

  renderLayer () {
    const map = this.getMap();
    const renderer = this._getRenderer();

    const customRender = this.props._customRender;

    const { gl } = renderer;

    const deckProps = Object.assign({}, originProps, {
      gl,
      width: false,
      height: false,
      viewState: getViewState(map),
      _customRender: () => {
        this._getRenderer() && this.requestMapToRender();
        if (customRender) {
          // customRender may be subscribed by DeckGL React component to update child props
          // make sure it is still called
          customRender();
        }
      },
      // TODO: import these defaults from a single source of truth
      parameters: {
        depthMask: true,
        depthTest: true,
        blendFunc: [
          gl.SRC_ALPHA,
          gl.ONE_MINUS_SRC_ALPHA,
          gl.ONE,
          gl.ONE_MINUS_SRC_ALPHA
        ],
        blendEquation: gl.FUNC_ADD
      },
      userData: {
        isExternal: false,
        layers: new Set()
      },
      onLoad: () => {
        this._isLoad = true;
        drawLayer(this.deck, map, this);
      }
    });

    if (!this.deck && !this._isLoad) {
      this.deck = new Deck(deckProps)
    }

    if (this._isLoad) {
      // drawLayer(this.deck, map, this);
      this.deck.setProps(deckProps);
      this.deck.props.userData.isExternal = true;
    }

    renderer.completeRender();
  }

  remove () {
    if (this.deck) {
      this.deck.finalize();
      delete this.deck;
    }
    super.remove();
  }
}

class Renderer extends renderer.CanvasLayerRenderer {
  draw () {
    this.prepareCanvas();
    this.prepareDrawContext();
    this._drawLayer();
  }

  /**
   * tell layer redraw
   * @returns {*}
   */
  needToRedraw () {
    const map = this.getMap();
    if (map.isZooming() && !map.getPitch()) {
      return false;
    }
    return super.needToRedraw();
  }
  //
  // /**
  //  * listen canvas create
  //  */
  // onCanvasCreate () {
  //   const map = this.getMap();
  //   if (this.canvas && this.layer.options.doubleBuffer) {
  //     this.buffer = canvas2d.createCanvas(this.canvas.width, this.canvas.height, map.CanvasClass);
  //     this.context = this.buffer.getContext('2d');
  //   }
  // }

  /**
   * create canvas
   */
  createCanvas () {
    if (this.canvas) return;
    if (!this.canvas) {
      const map = this.getMap();
      const size = map.getSize();
      const width = size.width;
      const height = size.height;
      // const retina = map.getDevicePixelRatio() || 1;
      // const [width, height] = [retina * size.width, retina * size.height];
      this.canvas = canvas2d.createCanvas(width, height, map.CanvasClass);
      if (this.canvas.style) {
        this.canvas.style.width = size.width + 'px';
        this.canvas.style.height = size.height + 'px';
      }
      this.gl = createContext(this.canvas, this.layer.options.glOptions);
      this.onCanvasCreate();
      this.layer.fire('canvascreate', { context: this.context, gl: this.gl });
    }
  }

  /**
   * when map changed, call canvas change
   * @param canvasSize
   */
  resizeCanvas (canvasSize) {
    // eslint-disable-next-line no-useless-return
    if (!this.canvas) return;
    // const map = this.getMap();
    // const retina = map.getDevicePixelRatio() || 1;
    // const size = canvasSize || map.getSize();
    // this.canvas.height = retina * size.height;
    // this.canvas.width = retina * size.width;
    // this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * clear canvas
   */
  clearCanvas () {
    if (!this.canvas) return;
    // eslint-disable-next-line no-bitwise
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  requestMapToRender () {
    this.setToRedraw();
  }

  prepareCanvas () {
    if (!this.canvas) {
      this.createCanvas();
    } else {
      this.clearCanvas();
    }
    const mask = super.prepareCanvas();
    this.layer.fire('renderstart', { context: this.context, gl: this.gl });
    return mask;
  }

  onZoomStart (...args) {
    super.onZoomStart(args);
  }

  onZoomEnd (...args) {
    super.onZoomEnd(args);
  }

  remove () {
    super.remove();
  }
}

DeckGLLayer.registerRenderer('webgl', Renderer);

export {
  DeckGLLayer,
  Renderer as DeckGLRender
};
