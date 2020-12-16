// @ts-ignore
import { Deck, WebMercatorViewport } from '@deck.gl/core';

// @ts-ignore
import { CanvasLayer, renderer } from 'maptalks';

import { createContext, getDevicePixelRatio } from './utils';

const _options = {
  registerEvents: true, // register map events default
  renderer: 'gl',
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
  // useDevicePixels: true,
  // autoResizeDrawingBuffer: true
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

type handleFunc = (...args: any[]) => void;

interface MTK {
  getResolution: () => number;
  getMaxNativeZoom: () => number;
  getCenter: () => Point;
  getPitch: () => number;
  getBearing: () => number;
  on: (type: string, func: handleFunc, ctx: any) => void;
  off: (type: string, func: handleFunc, ctx: any) => void;
  getDevicePixelRatio: () => number;
  getSize: () => {
    width: number;
    height: number;
  }
}

type IDeck = any;

interface ICanvasSize {
  width: number;
  height: number;
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
function getViewport (deck: IDeck, map: MTK, useMapboxProjection = true) {
  // const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;
  return new WebMercatorViewport(
    Object.assign(
      {
        x: 0,
        y: 0,
        width: deck.width,
        height: deck.height,
        repeat: true
      },
      getViewState(map),
      // https://github.com/mapbox/mapbox-gl-js/issues/7573
      useMapboxProjection
        ? {
          // match mapbox's projection matrix
          nearZMultiplier: deck.height ? 1 / deck.height : 0.02,
        }
        : {
          // use deck.gl's projection matrix
          nearZMultiplier: 0.1,
        }
    )
  );
}

function proxyCanvas(canvas: HTMLCanvasElement, retina: number) {
  Object.defineProperty(canvas, 'clientWidth', {
    // writable: true,
    get() { return canvas.width / retina; }
  });
  Object.defineProperty(canvas, 'clientHeight', {
    // writable: true,
    get() { return canvas.height / retina; }
  });
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
  renderer?: 'canvas' | 'gl';
  globalCompositeOperation?: string | null;
  cssFilter?: string | null;
  forceRenderOnMoving?: boolean;
  forceRenderOnZooming?: boolean;
  forceRenderOnRotating?: boolean;

  registerEvents?: boolean;

  renderStart?: () => void;
  renderEnd?: () => void;
}

export interface IProps {
  [key: string]: any;
}

class DeckGLLayer extends CanvasLayer {
  public props: any;
  public id: string | number;
  public options: Partial<IOptions>;

  constructor (id: string | number, props: IProps, options: IOptions = {}) {
    super(id, Object.assign({}, _options, options));
    this.props = Object.assign({}, originProps, props);
  }

  /**
   * set props
   * @param props
   * @returns {DeckGLLayer}
   */
  setProps (props: Partial<IProps>) {
    Object.assign(this.props, props, { id: this.id });
    // @ts-ignore
    const renderer = this._getRenderer();
    if (renderer) {
      renderer.setToRedraw();
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

  public getMap(): MTK {
    return super.getMap();
  }
}

interface IRenderer {
  getMap: () => MTK | null;
}

export class Renderer extends renderer.CanvasLayerRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private layer: DeckGLLayer;
  private isLoad: boolean;
  private isProxyed: boolean;
  private deckInstance: any;

  draw () {
    if (this.layer.options?.renderStart) {
      this.layer.options?.renderStart()
    }
    this.prepareCanvas();
    this.renderInner();
  }

  drawOnInteracting() {
    this.draw();
  }

  hitDetect() {
    return false;
  }

  onMouseClick (event: any) {
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

  onMouseMove (event: any) {
    let ev = {};
    if (!event.offsetCenter) {
      ev = {
        offsetCenter: event.containerPoint,
        srcEvent: event.domEvent
      };
    }
    this.deckInstance._onPointerMove(ev);
  }

  onMouseDown (event: any) {
    let ev = {};
    if (!event.offsetCenter) {
      ev = {
        offsetCenter: event.containerPoint,
        srcEvent: event.domEvent
      };
    }
    this.deckInstance._onPointerDown(ev);
  }

  renderInner() {
    const map = this.getMap();
    const props = this.layer.getProps();
    const options = this.layer.options;
    const deckProps = {
      useDevicePixels: true,
      useDevicePixelRatio: true,
      autoResizeViewport: true,
      autoResizeDrawingBuffer: true,
      _customRender: () => {
        this.setCanvasUpdated()
        if (props?.customRender) {
          // customRender may be subscribed by DeckGL React component to update child props
          // make sure it is still called
          props.customRender();
        }
      },
      // TODO: import these defaults from a single source of truth
      parameters: {
        depthMask: true,
        depthTest: true,
      },
      userData: {
        isExternal: false,
        layers: new Set()
      },
      onLoad: () => {
        this.isLoad = true;
        this.repaintDeck();
        setTimeout(() => {
          this.setToRedraw();
        }, 100);
      }
    };

    if (!this.deckInstance && !this.isLoad) {
      // FIXME: 为什么不直接使用canvas - 经过测试发现直接使用this.canvas也是可行的，但是在地图交互时 deck.gl
      //  的清空逻辑无法和maptalks保持一致，会出现可视化图层显示问题（偏移），虽然直接使用gl实例也会出现可视化图层消失，但是整体观感要好一些。

      this.deckInstance = new Deck(Object.assign(deckProps, props, {
        gl: this.gl,
        width: false,
        height: false,
        viewState: getViewState(map),
      }));

      if (options.registerEvents) {
        map.on('mousemove', this.onMouseMove, this);
        map.on('mousedown', this.onMouseDown, this);
        map.on('click', this.onMouseClick, this);
      }
    }

    if (this.isLoad) {
      this.deckInstance.setProps(Object.assign(deckProps, props));
      this.deckInstance.props.userData.isExternal = true;
      this.repaintDeck();
    }

    if (this.layer.options?.renderEnd) {
      this.layer.options?.renderEnd()
    }

    this.completeRender();
  }

  repaintDeck() {
    const map = this.getMap();
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

  createContext() {
    // @ts-ignore
    if (this.canvas?.gl && this.canvas?.gl.wrap) {
      // @ts-ignore
      this.gl = this.canvas?.gl.wrap();
    } else {
      const layer = this.layer;
      const attributes = layer.options?.glOptions || {
        alpha: true,
        depth: true,
        antialias: true,
        stencil : true
      };
      attributes.preserveDrawingBuffer = true;
      this.gl = this.gl || createContext(this.canvas, attributes);
    }
  }

  /**
   * when map changed, call canvas change
   * @param canvasSize
   */
  resizeCanvas (canvasSize: ICanvasSize) {
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
    if (!this.canvas || !this.gl) return;
    // eslint-disable-next-line no-bitwise
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  onZoomStart (...args: any[]) {
    super.onZoomStart(args);
  }

  onZoomEnd (...args: any[]) {
    super.onZoomEnd(args);
  }

  remove () {
    if (this.deckInstance) {
      const map = this.getMap();
      const options = this.layer.options;
      if (options.registerEvents) {
        map.off('mousemove', this.onMouseMove, this);
        map.off('mousedown', this.onMouseDown, this);
        map.off('click', this.onMouseClick, this);
      }
      this.deckInstance?.finalize();
      this.deckInstance = null;
      this.isLoad = false;
    }
    super.remove();
  }

  getMap(): MTK {
    return super.getMap();
  }

  prepareCanvas() {
    const cv = super.prepareCanvas();
    if (!this.isProxyed && this.canvas) {
      const map = this.getMap();
      const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;
      proxyCanvas(this.canvas, retina);
      this.isProxyed = true;
    }
    return cv;
  }

  completeRender() {
    return super.completeRender();
  }

  setCanvasUpdated() {
    return super.setCanvasUpdated();
  }

  setToRedraw() {
    super.setToRedraw();
  }
}

// @ts-ignore
DeckGLLayer.registerRenderer('gl', Renderer);

export default DeckGLLayer;
