import { Deck, WebMercatorViewport } from '@deck.gl/core';

import {
  Canvas as canvas2d,
  CanvasLayer,
  renderer
} from 'maptalks';

import { createContext, getDevicePixelRatio } from './utils';

const _options = {
  registerEvents: true, // register map events default
  renderer: 'webgl',
  doubleBuffer: true,
  glOptions: {
    alpha: true,
    depth: true,
    antialias: true,
    stencil: true
  },
  forceRenderOnMoving: true,
  forceRenderOnZooming: true
};

const originProps = {
  useDevicePixels: true,
  autoResizeDrawingBuffer: false
};

export enum CONST {
  R = 6378137,
  SIZE = 256,
  MAX_ZOOM = 20,
}

interface Point {
  x: number;
  y: number;
}

interface MTK {
  getResolution: () => number;
  getMaxNativeZoom: () => number;
  getCenter: () => Point;
  getPitch: () => number;
  getBearing: () => number;
}

// from https://github.com/maptalks/maptalks.mapboxgl/blob/5db0b124981f59e597ae66fb68c9763c53578ac2/index.js#L201
const MAX_RES = 2 * CONST.R * Math.PI / (CONST.SIZE * Math.pow(2, CONST.MAX_ZOOM));

export function getZoom (res: number): number {
  return 19 - Math.log(res / MAX_RES) / Math.LN2;
}

function getViewState (map: MTK) {
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

// FIXME: https://github.com/uber/luma.gl/blob/master/modules/webgl/src/context/context.js#L166
function getViewport (deck, map: MTK, useMapboxProjection = true) {
  return new WebMercatorViewport(
    Object.assign(
      {
        x: 0,
        y: 0,
        width: deck.width,
        height: deck.height
      },
      getViewState(map),
      // https://github.com/mapbox/mapbox-gl-js/issues/7573
      useMapboxProjection
        ? {
          // match mapbox's projection matrix
          nearZMultiplier: deck.height ? 1 / deck.height : 1,
          farZMultiplier: 1.01
        }
        : {
          // use deck.gl's projection matrix
          nearZMultiplier: 0.1,
          farZMultiplier: 10
        }
    )
  );
}

export interface IOptions {
  [key: string]: any;
  doubleBuffer?: boolean;
  animation?: boolean;
  fps?: number;
  attribution?: string;
  minZoom?: number;
  maxZoom?: number;
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  hitDetect?: boolean;
  renderer?: 'canvas' | 'webgl';
  globalCompositeOperation?: string | null;
  cssFilter?: string | null;
  forceRenderOnMoving?: boolean;
  forceRenderOnZooming?: boolean;
  forceRenderOnRotating?: boolean;

  registerEvents?: boolean;
}

export interface IProps {
  [key: string]: any;
}

class DeckGLLayer extends CanvasLayer {
  public props: any;
  private _isLoad: boolean;
  public id: string | number;
  public options: Partial<IOptions>;
  private deckInstance: any;

  constructor (id: string | number, props: IProps, options: IOptions = {}) {
    super(id, Object.assign({}, _options, options));
    this.props = Object.assign({}, originProps, props);

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
  setProps (props: Partial<IProps>) {
    Object.assign(this.props, props, { id: this.id });
    // this.renderLayer();
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
    //
    // const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;
    // Deck.prototype._checkForCanvasSizeChange = function () {
    //   const { canvas } = this;
    //   if (!canvas) {
    //     return false;
    //   }
    //   // Fallback to width/height when clientWidth/clientHeight are 0 or undefined.
    //   const newWidth = (canvas.clientWidth || canvas.width) / retina;
    //   const newHeight = (canvas.clientHeight || canvas.height) / retina;
    //   if (newWidth !== this.width || newHeight !== this.height) {
    //     this.width = newWidth;
    //     this.height = newHeight;
    //     return true;
    //   }
    //   return false;
    // };
  }

  onMouseClick (event) {
    let ev = {};
    if (!event.offsetCenter) {
      ev = {
        type: 'click',
        offsetCenter: event.containerPoint,
        srcEvent: event.domEvent
      };
    }
    this.deckInstance._onEvent(ev);
  }

  onMouseMove (event) {
    let ev = {};
    if (!event.offsetCenter) {
      ev = {
        offsetCenter: event.containerPoint,
        srcEvent: event.domEvent
      };
    }
    this.deckInstance._onPointerMove(ev);
  }

  onMouseDown (event) {
    let ev = {};
    if (!event.offsetCenter) {
      ev = {
        offsetCenter: event.containerPoint,
        srcEvent: event.domEvent
      };
    }
    this.deckInstance._onPointerDown(ev);
  }

  onRemove () {}

  renderLayer () {
    const map = this.getMap();
    const renderer = this._getRenderer();

    if (!renderer || !map) return;

    const customRender = this.props._customRender;

    const { gl } = renderer;

    const deckProps = Object.assign(this.props, {
      gl,
      width: false,
      height: false,
      viewState: getViewState(map),
      _customRender: () => {
        // this._getRenderer() && this.requestMapToRender();
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
        this._drawLayer(map);
      }
    });

    if (!this.deckInstance && !this._isLoad) {
      this.deckInstance = new Deck(deckProps);

      if (this.options.registerEvents) {
        map.on('mousemove', this.onMouseMove, this);
        map.on('mousedown', this.onMouseDown, this);
        map.on('click', this.onMouseClick, this);
      }
    }

    if (this._isLoad) {
      // drawLayer(this.deckInstance, map, this);
      this.deckInstance.setProps(deckProps);
      this.deckInstance.props.userData.isExternal = true;
      this._drawLayer(map);
    }

    renderer.completeRender();
  }

  _drawLayer (map: MTK) {
    let { currentViewport } = this.deckInstance.props.userData;
    if (!currentViewport) {
      // This is the first layer drawn in this render cycle.
      // Generate viewport from the current map state.
      currentViewport = getViewport(this.deckInstance, map, true);
      this.deckInstance.props.userData.currentViewport = currentViewport;
    }

    if (this.deckInstance.layerManager) {
      this.deckInstance._drawLayers('maptalks-deck-repaint', {
        viewports: [currentViewport],
        // TODO - accept layerFilter in drawLayers' renderOptions
        // layers: getLayers(deckInstance, deckLayer => shouldDrawLayer(layer.getId(), deckLayer)),
        clearCanvas: false
      });
    }
  }

  remove () {
    const map = this.getMap();

    // Deck.prototype._checkForCanvasSizeChange = function () {
    //   const { canvas } = this;
    //   if (!canvas) {
    //     return false;
    //   }
    //   // Fallback to width/height when clientWidth/clientHeight are 0 or undefined.
    //   const newWidth = canvas.clientWidth || canvas.width;
    //   const newHeight = canvas.clientHeight || canvas.height;
    //   if (newWidth !== this.width || newHeight !== this.height) {
    //     this.width = newWidth;
    //     this.height = newHeight;
    //     return true;
    //   }
    //   return false;
    // };

    if (this.deckInstance && map) {
      if (this.options.registerEvents) {
        map.off('mousemove', this.onMouseMove, this);
        map.off('mousedown', this.onMouseDown, this);
        map.off('click', this.onMouseClick, this);
      }
      this.deckInstance.finalize();
      delete this.deckInstance;
    }

    super.remove();
  }

  public getMap(): any {
    return super.getMap();
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

  /**
   * create canvas
   */
  createCanvas () {
    if (!this.canvas && !this.gl) {
      const map = this.getMap();
      const size = map.getSize();
      const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;
      const [width, height] = [retina * size.width, retina * size.height];
      this.canvas = canvas2d.createCanvas(width, height, map.CanvasClass);
      if (this.canvas.style) {
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
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
    const map = this.getMap();
    const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;
    const size = canvasSize || map.getSize();
    if (this.canvas.width !== size.width * retina || this.canvas.height !== size.height * retina) {
      this.canvas.height = retina * size.height;
      this.canvas.width = retina * size.width;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
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

export default DeckGLLayer;
