import { Deck, WebMercatorViewport } from '@deck.gl/core';

// from https://github.com/maptalks/maptalks.mapboxgl/blob/5db0b124981f59e597ae66fb68c9763c53578ac2/index.js#L201
const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));

function getZoom (res) {
  return 19 - Math.log(res / MAX_RES) / Math.LN2;
}

function updateLayers (deck) {
  if (deck.props.userData.isExternal) {
    return;
  }

  const layers = [];
  deck.props.userData.layers.forEach(deckLayer => {
    const LayerType = deckLayer.props.type;
    const layer = new LayerType(deckLayer.props);
    layers.push(layer);
  });
  deck.setProps({ layers });
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

function onMapMove (deck, map) {
  deck.setProps({
    viewState: getViewState(map)
  });
  // Camera changed, will trigger a map repaint right after this
  // Clear any change flag triggered by setting viewState so that deck does not request
  // a second repaint
  deck.needsRedraw({ clearRedrawFlags: true });
}

console.log(onMapMove);

// FIXME: https://github.com/uber/luma.gl/blob/master/modules/webgl/src/context/context.js#L166
function getViewport (deck, map, useMapboxProjection = true) {
  return new WebMercatorViewport(
    Object.assign(
      {
        x: 0,
        y: 0,
        // width: deck.width,
        // height: deck.height
      },
      getViewState(map),
      // https://github.com/mapbox/mapbox-gl-js/issues/7573
      useMapboxProjection
        ? {
          // match mapbox's projection matrix
          nearZMultiplier: deck.height ? 1 / deck.height : 1,
          farZMultiplier: 1
        }
        : {
          // use deck.gl's projection matrix
          nearZMultiplier: 0.1,
          farZMultiplier: 10
        }
    )
  );
}

function getLayers (deck, layerFilter) {
  if (deck && deck.layerManager) {
    const layers = deck.layerManager.getLayers();
    return layers.filter(layerFilter);
  }

  return [];
}

function shouldDrawLayer (id, layer) {
  let layerInstance = layer;
  while (layerInstance) {
    if (layerInstance.id === id) {
      return true;
    }
    layerInstance = layerInstance.parent;
  }
  return false;
}

function afterRender (deck, map) {
  const {
    isExternal
  } = deck.props.userData;

  if (isExternal) {
    const mapboxLayerIds = Array.from(deck.props.userData.layers, layer => layer.id);
    const layers = getLayers(deck, deckLayer => {
      // eslint-disable-next-line no-restricted-syntax
      for (const id of mapboxLayerIds) {
        if (shouldDrawLayer(id, deckLayer)) {
          return false;
        }
      }
      return true;
    });
    if (layers.length > 0) {
      deck._drawLayers('maptalks-repaint', {
        viewports: [getViewport(deck, map, false)],
        layers,
        clearCanvas: false
      });
    }
  }

  // End of render cycle, clear generated viewport
  deck.props.userData.currentViewport = null;
}

export function getDeckInstance ({
  map, layer, gl, deck, onLoad
}) {
  const customRender = deck && deck.props._customRender;

  const deckProps = {
    useDevicePixels: true,
    autoResizeDrawingBuffer: true,
    _customRender: () => {
      layer._getRenderer() && layer.requestMapToRender();
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
    onLoad
  };

  if (deck) {
    deck.setProps(deckProps);
    deck.props.userData.isExternal = true;
  } else {
    // Using external gl context - do not set css size
    Object.assign(deckProps, {
      gl,
      width: false,
      height: false,
      viewState: getViewState(map)
    });
    deck = new Deck(deckProps);

    // If deck is externally provided (React use case), we use deck's viewState to
    // drive the map.
    // Otherwise (pure JS use case), we use the map's viewState to drive deck.
    // map.on('moving', () => onMapMove(deck, map));
    map.on('remove', () => {
      deck.finalize();
    });
  }

  layer.on('renderstart', () => afterRender(deck, map));

  return deck;
}

export function addLayer (deck, layer) {
  deck.props.userData.layers.add(layer);
  updateLayers(deck);
}

export function removeLayer (deck, layer) {
  deck.props.userData.layers.delete(layer);
  updateLayers(deck);
}

export function updateLayer (deck) {
  updateLayers(deck);
}

export function drawLayer (deck, map, layer) {
  let { currentViewport } = deck.props.userData;
  if (!currentViewport) {
    // This is the first layer drawn in this render cycle.
    // Generate viewport from the current map state.
    currentViewport = getViewport(deck, map, true);
    deck.props.userData.currentViewport = currentViewport;
  }

  if (deck.layerManager) {
    deck._drawLayers('maptalks-repaint', {
      viewports: [currentViewport],
      // TODO - accept layerFilter in drawLayers' renderOptions
      layers: getLayers(deck, deckLayer => shouldDrawLayer(layer.getId(), deckLayer)),
      clearCanvas: false
    });
  }
}
