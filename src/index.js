import { Deck, WebMercatorViewport } from '@deck.gl/core';

import {
  Canvas as canvas2d,
  CanvasLayer,
  renderer
} from 'maptalks';

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
  forceRenderOnZooming: true
};

const originProps = {
  useDevicePixels: false,
  autoResizeDrawingBuffer: true
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

// FIXME: https://github.com/uber/luma.gl/blob/master/modules/webgl/src/context/context.js#L166
function getViewport (deck, map, useMapboxProjection = true) {
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

class DeckGLLayer extends CanvasLayer {
  constructor (id, props, options = {}) {
    super(id, Object.assign(_options, options));
    props.id = id;
    this.props = Object.assign({}, originProps, props);

    /**
     * layer is load
     * @type {boolean}
     * @private
     */
    this._isLoad = false;

    // this.on('renderstart', this.handleRenderStart, this);
    // this.on('renderend', this.handleRenderEnd, this);
  }

  /**
   * set props
   * @param props
   * @returns {DeckGLLayer}
   */
  setProps (props) {
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

    if (!this.deck && !this._isLoad) {
      this.deck = new Deck(deckProps)
    }

    if (this._isLoad) {
      // drawLayer(this.deck, map, this);
      this.deck.setProps(deckProps);
      this.deck.props.userData.isExternal = true;
      this._drawLayer(map);
    }

    renderer.completeRender();
  }

  _drawLayer (map) {
    let { currentViewport } = this.deck.props.userData;
    if (!currentViewport) {
      // This is the first layer drawn in this render cycle.
      // Generate viewport from the current map state.
      currentViewport = getViewport(this.deck, map, true);
      this.deck.props.userData.currentViewport = currentViewport;
    }

    if (this.deck.layerManager) {
      this.deck._drawLayers('maptalks-deck-repaint', {
        viewports: [currentViewport],
        // TODO - accept layerFilter in drawLayers' renderOptions
        // layers: getLayers(deck, deckLayer => shouldDrawLayer(layer.getId(), deckLayer)),
        clearCanvas: false
      });
    }
  }

  handleRenderEnd (event) {
    console.log(event);
  }

  handleRenderStart (event) {
    console.log(event);
  }

  remove () {
    if (this.deck) {
      this.deck.finalize();
      delete this.deck;
    }

    this.off('renderstart', this.handleRenderStart, this);
    this.off('renderend', this.handleRenderEnd, this);

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
      // const width = size.width;
      // const height = size.height;
      const retina = map.getDevicePixelRatio() || 1;
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
    const retina = map.getDevicePixelRatio() || 1;
    const size = canvasSize || map.getSize();
    this.canvas.height = retina * size.height;
    this.canvas.width = retina * size.width;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.requestMapToRender();
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
