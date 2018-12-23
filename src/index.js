import * as maptalks from 'maptalks';
import Renderer from './renderer';
import { Deck } from '@deck.gl/core';

const _options = {
  'renderer': 'webgl',
  'doubleBuffer': true,
  'glOptions': {
    'alpha': true,
    'antialias': true,
    'preserveDrawingBuffer': true
  }
};

// from https://github.com/maptalks/maptalks.mapboxgl/blob/5db0b124981f59e597ae66fb68c9763c53578ac2/index.js#L201
const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));

function getZoom (res) {
  return 19 - Math.log(res / MAX_RES) / Math.LN2;
}

function handleMouseEvent (deck, event) {
  // reset layerFilter to allow all layers during picking
  deck.layerManager.layerFilter = null;
  let callback;
  switch (event.type) {
    case 'click':
      callback = deck._onClick;
      break;

    case 'mousemove':
    case 'pointermove':
      callback = deck._onPointerMove;
      break;

    case 'mouseleave':
    case 'pointerleave':
      callback = deck._onPointerLeave;
      break;

    default:
      return;
  }
  if (!event.offsetCenter) {
    // Map from mapbox's MapMouseEvent object to mjolnir.js' Event object
    event = {
      offsetCenter: event.point,
      srcEvent: event.originalEvent
    };
  }
  callback(event);
}

class DeckGLLayer extends maptalks.CanvasLayer {
  static getTargetZoom (map) {
    return map.getMaxNativeZoom();
  }

  constructor (id, props, options = {}) {
    super(id, Object.assign(_options, options));
    this.props = props;
  }

  /**
   * set props
   * @param props
   * @returns {DeckGLLayer}
   */
  setProps (props) {
    this.props = Object.assign(this.props, props);
    return this;
  }

  /**
   * get props
   * @returns {*}
   */
  getProps () {
    return this.props;
  }

  draw () {
    this.renderScene();
  }

  drawOnInteracting () {
    this.renderScene();
  }

  _getViewState () {
    const map = this.getMap();
    const res = map.getResolution();
    const maxZoom = DeckGLLayer.getTargetZoom(map);
    const center = map.getCenter();
    const pitch = map.getPitch();
    const bearing = map.getBearing();
    return {
      latitude: center['y'],
      longitude: center['x'],
      zoom: getZoom(res),
      bearing: bearing,
      pitch: pitch,
      maxZoom: maxZoom
    }
  }

  renderScene () {
    const map = this.getMap()
    const renderer = this._getRenderer();
    const viewState = this._getViewState();
    const { layers } = this.props;
    if (this.deck) {
      this.deck.setProps({
        viewState,
        layers,
        targetMap: map
      });
      this.deck._drawLayers();
    } else {
      if (!renderer.gl) return;
      this.deck = new Deck({
        // width: false,
        // height: false,
        width: '100%',
        height: '100%',
        autoResizeDrawingBuffer: false,
        // _customRender: () => this.setCanvasUpdated(),
        _customRender: () => {},
        parameters: {
          depthMask: true,
          depthTest: true
        },
        viewState: viewState,
        glOptions: {
          'alpha': true,
          'antialias': true,
          'preserveDrawingBuffer': true
        }
      });
      this.deck._setGLContext(renderer.gl);
      this.deck.setProps({
        layers: layers,
        targetMap: map
      });
      this.initEvents(map, this.deck)
    }
    renderer.completeRender();
  }

  initEvents (map, deck) {
    const pickingEventHandler = event => handleMouseEvent(deck, event);
    if (deck.eventManager) {
      // Replace default event handlers with our own ones
      deck.eventManager.off({
        click: deck._onClick,
        pointermove: deck._onPointerMove,
        pointerleave: deck._onPointerLeave
      });
      deck.eventManager.on({
        click: pickingEventHandler,
        pointermove: pickingEventHandler,
        pointerleave: pickingEventHandler
      });
    } else {
      map.on('click', pickingEventHandler);
      map.on('mousemove', pickingEventHandler);
      map.on('mouseleave', pickingEventHandler);
    }
  }

  remove () {
    this.deck.finalize();
    super.remove();
  }
}

DeckGLLayer.registerRenderer('webgl', Renderer);

export default DeckGLLayer;
