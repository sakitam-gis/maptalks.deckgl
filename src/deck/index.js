import { Stats } from 'probe.gl';
import GL from 'luma.gl/constants';
import { trackContextState, setParameters } from 'luma.gl';
import EffectManager from '@deck.gl/core/dist/esm/experimental/lib/effect-manager';
import Effect from '@deck.gl/core/dist/esm/experimental/lib/effect';
import log from '@deck.gl/core/dist/esm/utils/log';
import VENDOR_PREFIX from '@deck.gl/core/dist/esm/utils/css-vendor-prefix';

import ViewManager from './view-manager';
import MapView from './views/map-view';
import LayerManager from './layer-manager';

function noop() {
}

const PREFIX = VENDOR_PREFIX === '-webkit-' ? VENDOR_PREFIX : '';

const CURSOR = {
    GRABBING: `${PREFIX}grabbing`,
    GRAB: `${PREFIX}grab`,
    POINTER: 'pointer'
};

const getCursor = ({ isDragging }) => (isDragging ? CURSOR.GRABBING : CURSOR.GRAB);

function getPropTypes(PropTypes) {
    // Note: Arrays (layers, views, ) can contain falsy values
    return {
        // layer/view/controller settings
        layers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
        layerFilter: PropTypes.func,
        views: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
        viewState: PropTypes.object,
        effects: PropTypes.arrayOf(PropTypes.instanceOf(Effect)),
        controller: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]),

        // GL settings
        gl: PropTypes.object,
        glOptions: PropTypes.object,
        parameters: PropTypes.object,
        pickingRadius: PropTypes.number,
        useDevicePixels: PropTypes.bool,

        // Callbacks
        onWebGLInitialized: PropTypes.func,
        onResize: PropTypes.func,
        onViewStateChange: PropTypes.func,
        onBeforeRender: PropTypes.func,
        onAfterRender: PropTypes.func,
        onLayerClick: PropTypes.func,
        onLayerHover: PropTypes.func,
        onLoad: PropTypes.func,

        // Debug settings
        debug: PropTypes.bool,
        drawPickingColors: PropTypes.bool,
        _animate: PropTypes.bool
    };
}

const defaultProps = {
    pickingRadius: 0,
    layerFilter: null,
    glOptions: {},
    gl: null,
    layers: [],
    effects: [],
    views: null,
    controller: null, // Rely on external controller, e.g. react-map-gl
    useDevicePixels: true,
    _animate: false,
    onWebGLInitialized: noop,
    onResize: noop,
    onViewStateChange: noop,
    onBeforeRender: noop,
    onAfterRender: noop,
    onLayerClick: null,
    onLayerHover: null,
    onLoad: noop,
    getCursor,
    debug: false,
    drawPickingColors: false
};

export default class Deck {
    constructor(props) {
        props = Object.assign({}, defaultProps, props);

        this.width = 0; // "read-only", auto-updated from canvas
        this.height = 0; // "read-only", auto-updated from canvas

        // Maps view descriptors to vieports, rebuilds when width/height/viewState/views change
        this.viewManager = null;
        this.layerManager = null;
        this.effectManager = null;

        this.stats = new Stats({ id: 'deck.gl' });

        this._needsRedraw = true;

        this.viewState = props.initialViewState || null; // Internal view state if no callback is supplied
        this.interactiveState = {
            isDragging: false // Whether the cursor is down
        };

        // Bind methods
        this._onClick = this._onClick.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerLeave = this._onPointerLeave.bind(this);
        this._pickAndCallback = this._pickAndCallback.bind(this);
        this._onRendererInitialized = this._onRendererInitialized.bind(this);
        this._onRenderFrame = this._onRenderFrame.bind(this);
        this._onViewStateChange = this._onViewStateChange.bind(this);
        this._onInteractiveStateChange = this._onInteractiveStateChange.bind(this);
        this.setProps(props);
    }

    finalize() {
        this.animationLoop.stop();
        this.animationLoop = null;

        if (this.layerManager) {
            this.layerManager.finalize();
            this.layerManager = null;
        }

        if (this.viewManager) {
            this.viewManager.finalize();
            this.viewManager = null;
        }
    }

    setProps(props) {
        this.stats.timeStart('deck.setProps');
        props = Object.assign({}, this.props, props);
        this.props = props;
        // We need to overwrite CSS style width and height with actual, numeric values
        const newProps = Object.assign({}, props, {
            views: this._getViews(props),
            width: this.width,
            height: this.height
        });

        const viewState = this._getViewState(props);
        if (viewState) {
            newProps.viewState = viewState;
        }

        // Update view manager props
        if (this.viewManager) {
            this.viewManager.setProps(newProps);
        }

        // Update layer manager props (but not size)
        if (this.layerManager) {
            this.layerManager.setProps(newProps);
        }

        // Update animation loop
        if (this.animationLoop) {
            this.animationLoop.setProps(newProps);
        }

        this.stats.timeEnd('deck.setProps');
    }

    // Check if a redraw is needed
    // Returns `false` or a string summarizing the redraw reason
    needsRedraw({ clearRedrawFlags = true } = {}) {
        if (this.props._animate) {
            return 'Deck._animate';
        }
        let redraw = this._needsRedraw;
        if (clearRedrawFlags) {
            this._needsRedraw = false;
        }
        const viewManagerNeedsRedraw = this.viewManager.needsRedraw({ clearRedrawFlags });
        const layerManagerNeedsRedraw = this.layerManager.needsRedraw({ clearRedrawFlags });
        redraw = redraw || viewManagerNeedsRedraw || layerManagerNeedsRedraw;
        return redraw;
    }

    getViews() {
        return this.viewManager.views;
    }

    // Get a set of viewports for a given width and height
    getViewports(rect) {
        return this.viewManager.getViewports(rect);
    }

    pickObject({ x, y, radius = 0, layerIds = null }) {
        this.stats.timeStart('deck.pickObject');
        const selectedInfos = this.layerManager.pickObject({
            x,
            y,
            radius,
            layerIds,
            viewports: this.getViewports({ x, y }),
            mode: 'query',
            depth: 1
        });
        this.stats.timeEnd('deck.pickObject');
        return selectedInfos.length ? selectedInfos[0] : null;
    }

    pickMultipleObjects({ x, y, radius = 0, layerIds = null, depth = 10 }) {
        this.stats.timeStart('deck.pickMultipleObjects');
        const selectedInfos = this.layerManager.pickObject({
            x,
            y,
            radius,
            layerIds,
            viewports: this.getViewports({ x, y }),
            mode: 'query',
            depth
        });
        this.stats.timeEnd('deck.pickMultipleObjects');
        return selectedInfos;
    }

    pickObjects({ x, y, width = 1, height = 1, layerIds = null }) {
        this.stats.timeStart('deck.pickObjects');
        const infos = this.layerManager.pickObjects({
            x,
            y,
            width,
            height,
            layerIds,
            viewports: this.getViewports({ x, y, width, height })
        });
        this.stats.timeEnd('deck.pickObjects');
        return infos;
    }

    // If canvas size has changed, updates
    _updateCanvasSize() {
        if (this._checkForCanvasSizeChange()) {
            const { width, height } = this;
            this.viewManager.setProps({ width, height });
            this.props.onResize({ width: this.width, height: this.height });
        }
    }

    // If canvas size has changed, reads out the new size and returns true
    _checkForCanvasSizeChange() {
        const { canvas } = this;
        if (canvas && (this.width !== canvas.width || this.height !== canvas.height)) {
            this.width = canvas.width;
            this.height = canvas.height;
            return true;
        }
        return false;
    }

    // _createAnimationLoop(props) {
    //     const { width, height, gl, glOptions, debug, useDevicePixels, autoResizeDrawingBuffer } = props;
    //     return new AnimationLoop({
    //         width,
    //         height,
    //         useDevicePixels,
    //         autoResizeDrawingBuffer,
    //         onCreateContext: opts =>
    //             gl || createGLContext(Object.assign({}, glOptions, opts, { canvas: this.canvas, debug })),
    //         onInitialize: this._onRendererInitialized,
    //         onRender: this._onRenderFrame,
    //         onBeforeRender: props.onBeforeRender,
    //         onAfterRender: props.onAfterRender
    //     });
    // }

    // Get the most relevant view state: props.viewState, if supplied, shadows internal viewState
    // TODO: For backwards compatibility ensure numeric width and height is added to the viewState
    _getViewState(props) {
        return props.viewState || this.viewState;
    }

    // Get the view descriptor list
    _getViews(props) {
        // Default to a full screen map view port
        let views = props.views || [new MapView({ id: 'default-view', targetMap: props.targetMap })];
        views = Array.isArray(views) ? views : [views];
        if (views.length && props.controller) {
            // Backward compatibility: support controller prop
            views[0].props.controller = props.controller;
        }
        return views;
    }

    _pickAndCallback(options) {
        const pos = options.event.offsetCenter;
        // Do not trigger callbacks when click/hover position is invalid. Doing so will cause a
        // assertion error when attempting to unproject the position.
        if (!pos) {
            return;
        }

        const radius = this.props.pickingRadius;
        const selectedInfos = this.layerManager.pickObject({
            x: pos.x,
            y: pos.y,
            radius,
            viewports: this.getViewports(pos),
            mode: options.mode,
            depth: 1
        });
        if (options.callback && selectedInfos) {
            const firstInfo = selectedInfos.find(info => info.index >= 0) || null;
            // As per documentation, send null value when no valid object is picked.
            options.callback(firstInfo, selectedInfos, options.event.srcEvent);
        }
    }

    _updateCursor() {
        if (this.canvas) {
            this.canvas.style.cursor = this.props.getCursor(this.interactiveState);
        }
    }

    // Updates animation props on the layer context
    _updateAnimationProps(animationProps) {
        this.layerManager.context.animationProps = animationProps;
    }

    // Deep integration (Mapbox styles)
    _setGLContext(gl) {
        if (this.layerManager) {
            return;
        }

        // if external context...
        if (!this.canvas) {
            this.canvas = gl.canvas;
            trackContextState(gl, { enable: true, copyState: true });
        }
        setParameters(gl, {
            blend: true,
            blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
            polygonOffsetFill: true,
            depthTest: true,
            depthFunc: GL.LEQUAL
        });

        this.props.onWebGLInitialized(gl);

        this.viewManager = new ViewManager({
            onViewStateChange: this._onViewStateChange,
            onInteractiveStateChange: this._onInteractiveStateChange
        });

        // Note: avoid React setState due GL animation loop / setState timing issue
        this.layerManager = new LayerManager(gl, { stats: this.stats });

        this.effectManager = new EffectManager({ gl, layerManager: this.layerManager });

        for (const effect of this.props.effects) {
            this.effectManager.addEffect(effect);
        }
        this.setProps(this.props);
        this._updateCanvasSize();
        this.props.onLoad();
    }

    _drawLayers(redrawReason) {
        const { gl } = this.layerManager.context;
        setParameters(gl, this.props.parameters);
        this.props.onBeforeRender({ gl });
        this.layerManager.drawLayers({
            pass: 'screen',
            viewports: this.viewManager.getViewports(),
            views: this.viewManager.getViews(),
            redrawReason,
            drawPickingColors: this.props.drawPickingColors, // Debug picking, helps in framebuffered layers
            customRender: Boolean(this.props._customRender)
        });

        this.props.onAfterRender({ gl });
    }

    // Callbacks

    _onRendererInitialized({ gl }) {
        this._setGLContext(gl);
    }

    _onRenderFrame(animationProps) {
        // Log perf stats every second
        if (this.stats.oneSecondPassed()) {
            const table = this.stats.getStatsTable();
            this.stats.reset();
            log.table(3, table)();
        }

        this._updateCanvasSize();

        this._updateCursor();

        // Update layers if needed (e.g. some async prop has loaded)
        // Note: This can trigger a redraw
        this.layerManager.updateLayers();

        this.stats.bump('fps');

        // Needs to be done before drawing
        this._updateAnimationProps(animationProps);

        // Check if we need to redraw
        const redrawReason = this.needsRedraw({ clearRedrawFlags: true });
        if (!redrawReason) {
            return;
        }

        this.stats.bump('render-fps');
        if (this.props._customRender) {
            this.props._customRender();
        } else {
            this._drawLayers(redrawReason);
        }
    }

    // Callbacks

    _onViewStateChange(params) {
        // Let app know that view state is changing, and give it a chance to change it
        const viewState = this.props.onViewStateChange(params) || params.viewState;

        // If initialViewState was set on creation, auto track position
        if (this.viewState) {
            this.viewState[params.viewId] = viewState;
            this.viewManager.setProps({ viewState });
        }
    }

    _onInteractiveStateChange({ isDragging = false }) {
        if (isDragging !== this.interactiveState.isDragging) {
            this.interactiveState.isDragging = isDragging;
        }
    }

    // Route move events to layers. call the `onHover` prop of any picked layer,
    // and `onLayerHover` is called directly from here with any picking info generated by `pickLayer`.
    // @param {Object} event  A mjolnir.js event
    _onClick(event) {
        this._pickAndCallback({
            callback: this.props.onLayerClick,
            event,
            mode: 'click'
        });
    }

    _onPointerMove(event) {
        if (event.leftButton || event.rightButton) {
            // Do not trigger onHover callbacks if mouse button is down.
            return;
        }
        this._pickAndCallback({
            callback: this.props.onLayerHover,
            event,
            mode: 'hover'
        });
    }

    _onPointerLeave(event) {
        this.layerManager.pickObject({
            x: -1,
            y: -1,
            viewports: [],
            radius: 1,
            mode: 'hover'
        });
        if (this.props.onLayerHover) {
            this.props.onLayerHover(null, [], event.srcEvent);
        }
    }
}

Deck.getPropTypes = getPropTypes;
Deck.defaultProps = defaultProps;
