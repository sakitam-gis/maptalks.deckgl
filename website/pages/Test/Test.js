// eslint-disable-next-line no-unused-vars
import React, {
  useState,
  useRef,
  useEffect,
  // useLayoutEffect,
  useCallback
} from 'react';
import * as maptalks from 'maptalks';
import { scaleThreshold } from 'd3-scale';
import { PolygonLayer, GeoJsonLayer } from '@deck.gl/layers';
import { LightingEffect, AmbientLight, _SunLight as SunLight, Deck, WebMercatorViewport } from '@deck.gl/core';
import { getDevicePixelRatio } from '../../../src/utils';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line

export const COLOR_SCALE = scaleThreshold()
  .domain([-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2])
  .range([
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],
    // zero
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [189, 0, 38],
    [128, 0, 38]
  ]);

const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const dirLight = new SunLight({
  timestamp: Date.UTC(2019, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.0,
  _shadow: true
});

const landCover = [[[-123.0, 49.196], [-123.0, 49.324], [-123.306, 49.324], [-123.306, 49.196]]];

const lightingEffect = new LightingEffect({ ambientLight, dirLight });
lightingEffect.shadowColor = [0, 0, 0, 0.5];
const _effects = [lightingEffect];

// from https://github.com/maptalks/maptalks.mapboxgl/blob/5db0b124981f59e597ae66fb68c9763c53578ac2/index.js#L201
const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));

function createGLContext (canvas, options) {
  const names = ['webgl2', 'webgl', 'experimental-webgl'];
  let context = null;
  for (let i = 0; i < names.length; ++i) {
    try {
      context = canvas.getContext(names[i], options);
    } catch (e) {}
    if (context) {
      break;
    }
  }
  return context;
}

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

function Test (props) {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);

  const [inited, setInit] = useState(false);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  let map = null;
  let deckLayer = null;

  function renderTooltip () {
    return (
      hoveredObject && (
        <div className="tooltip" style={{ top: y, left: x }}>
          <div>
            <b>Average Property Value</b>
          </div>
          <div>
            <div>${hoveredObject.properties.valuePerParcel} / parcel</div>
            <div>
              ${hoveredObject.properties.valuePerSqm} / m<sup>2</sup>
            </div>
          </div>
          <div>
            <b>Growth</b>
          </div>
          <div>{Math.round(hoveredObject.properties.growth * 100)}%</div>
        </div>
      )
    );
  }

  function onHover ({ x, y, object }) {
    setX(x);
    setY(y);
    setHoveredObject(object);
  }

  const drawLayer = useCallback(
    () => {
      deckLayer.setProps({
        viewState: getViewState(map),
        layers: [
          new PolygonLayer({
            id: 'ground',
            data: landCover,
            stroked: false,
            getPolygon: f => f,
            getFillColor: [0, 0, 0, 0]
          }),
          new GeoJsonLayer({
            id: 'geojson',
            data: DATA_URL,
            opacity: 0.8,
            stroked: false,
            filled: true,
            extruded: true,
            wireframe: true,
            getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
            getFillColor: f => COLOR_SCALE(f.properties.growth),
            getLineColor: [255, 255, 255],
            pickable: true,
            onHover: onHover
          })
        ],
        width: false,
        height: false,
        effects: _effects,
        _customRender: () => {

        },
        userData: {
          isExternal: false,
          layers: new Set()
        },
        onLoad: drawLayer,
        useDevicePixels: true,
        autoResizeDrawingBuffer: false
      });

      let { currentViewport } = deckLayer.props.userData;
      if (!currentViewport) {
        // This is the first layer drawn in this render cycle.
        // Generate viewport from the current map state.
        currentViewport = getViewport(deckLayer, map, true);
        deckLayer.props.userData.currentViewport = currentViewport;
      }
      if (deckLayer.layerManager) {
        deckLayer._drawLayers('maptalks-deck-repaint', {
          viewports: [currentViewport],
          // TODO - accept layerFilter in drawLayers' renderOptions
          // layers: getLayers(deck, deckLayer => shouldDrawLayer(layer.getId(), deckLayer)),
          clearCanvas: false
        });
      }
    },
    []
  );

  const onMouseClick = useCallback(
    (event) => {
      let ev = {};
      if (!event.offsetCenter) {
        ev = {
          type: 'click',
          offsetCenter: event.containerPoint,
          srcEvent: event.domEvent
        };
      }
      deckLayer && deckLayer._onEvent(ev);
    },
    []
  );

  const onMouseMove = useCallback(
    (event) => {
      let ev = {};
      if (!event.offsetCenter) {
        ev = {
          offsetCenter: event.containerPoint,
          srcEvent: event.domEvent
        };
      }
      deckLayer && deckLayer._onPointerMove(ev);
    },
    []
  );

  const onMouseDown = useCallback(
    (event) => {
      let ev = {};
      if (!event.offsetCenter) {
        ev = {
          offsetCenter: event.containerPoint,
          srcEvent: event.domEvent
        };
      }
      deckLayer && deckLayer._onPointerDown(ev);
    },
    []
  );

  useEffect(() => {
    if (inited) {
    } else {
      map = new maptalks.Map(mapRef.current, {
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        maxZoom: INITIAL_VIEW_STATE.maxZoom,
        centerCross: true,
        baseLayer: new maptalks.TileLayer('tile', {
          urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`
        })
        // devicePixelRatio: 2
      });

      const size = map.getSize();

      const retina = (map.getDevicePixelRatio ? map.getDevicePixelRatio() : getDevicePixelRatio()) || 1;

      const gl = createGLContext(canvasRef.current, {
        alpha: true,
        depth: true,
        antialias: true,
        stencil: true
      });

      if (canvasRef.current.width !== size.width * retina || canvasRef.current.height !== size.height * retina) {
        canvasRef.current.height = retina * size.height;
        canvasRef.current.width = retina * size.width;
        gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      Deck.prototype._checkForCanvasSizeChange = function () {
        const { canvas } = this;
        if (!canvas) {
          return false;
        }
        // Fallback to width/height when clientWidth/clientHeight are 0 or undefined.
        const newWidth = canvas.width / 2 || size.width;
        const newHeight = canvas.height / 2 || size.height;
        if (newWidth !== this.width || newHeight !== this.height) {
          this.width = newWidth;
          this.height = newHeight;
          return true;
        }
        return false;
      };

      deckLayer = new Deck({
        layers: [
          new PolygonLayer({
            id: 'ground',
            data: landCover,
            stroked: false,
            getPolygon: f => f,
            getFillColor: [0, 0, 0, 0]
          }),
          new GeoJsonLayer({
            id: 'geojson',
            data: DATA_URL,
            opacity: 0.8,
            stroked: false,
            filled: true,
            extruded: true,
            wireframe: true,
            getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
            getFillColor: f => COLOR_SCALE(f.properties.growth),
            getLineColor: [255, 255, 255],
            pickable: true,
            onHover: onHover
          })
        ],
        gl,
        width: false,
        height: false,
        effects: _effects,
        _customRender: () => {

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
        viewState: getViewState(map),
        onLoad: drawLayer,
        useDevicePixels: true,
        autoResizeDrawingBuffer: false
      });

      map.on('moving resize pitch zooming', drawLayer);
      map.on('mousemove', onMouseMove);
      map.on('mousedown', onMouseDown);
      map.on('click', onMouseClick);

      setInit(true);
    }

    return () => {
      if (map) {
        map.remove();
        map.off('moving resize pitch zooming', drawLayer);
        map.off('mousemove', onMouseMove);
        map.off('mousedown', onMouseDown);
        map.off('click', onMouseClick);
      }

      if (deckLayer) {
        deckLayer.finalize();
      }
    }
  }, []);

  return (<div className="map-wrap" style={{
    position: 'relative'
  }}>
    <div ref={mapRef} className="map-content" />
    { renderTooltip() }
    <canvas ref={canvasRef} style={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 2,
      pointerEvents: 'none',
      width: '100%',
      height: '100%'
    }}/>
  </div>);
}

export default Test;
