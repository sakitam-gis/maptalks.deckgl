import Viewport from './viewport';

class MixinsViewport extends Viewport {
    constructor(options) {
        const {
            latitude = 0,
            longitude = 0,
            zoom = 11,
            pitch = 0,
            bearing = 0,
            farZMultiplier = 10,
            orthographic = false,
            targetMap = null
        } = options;

        let { width, height, altitude = 1.5 } = options;

        // Silently allow apps to send in 0,0 to facilitate isomorphic render etc
        width = width || 1;
        height = height || 1;

        // Altitude - prevent division by 0
        // TODO - just throw an Error instead?
        altitude = Math.max(0.75, altitude);

        const { fov, aspect, focalDistance, near, far } = getProjectionParameters({
            width,
            height,
            pitch,
            altitude,
            farZMultiplier
        });

        // The uncentered matrix allows us two move the center addition to the
        // shader (cheap) which gives a coordinate system that has its center in
        // the layer's center position. This makes rotations and other modelMatrx
        // transforms much more useful.
        const viewMatrixUncentered = getViewMatrix({
            height,
            pitch,
            bearing,
            altitude,
            flipY: true
        });

        // TODO / hack - prevent vertical offsets if not FirstPersonViewport
        const position = options.position && [options.position[0], options.position[1], 0];

        const viewportOpts = Object.assign({}, options, {
            // x, y,
            width,
            height,
            // view matrix
            viewMatrix: viewMatrixUncentered,
            longitude,
            latitude,
            zoom,
            position,
            // projection matrix parameters
            orthographic,
            fovyRadians: fov,
            aspect,
            // TODO Viewport is already carefully set up to "focus" on ground, so can't use focal distance
            orthographicFocalDistance: focalDistance,
            near,
            far
        });

        super(viewportOpts);

        // Save parameters
        this.latitude = latitude;
        this.longitude = longitude;
        this.zoom = zoom;
        this.pitch = pitch;
        this.bearing = bearing;
        this.altitude = altitude;

        this.orthographic = orthographic;

        // Bind methods
        this.metersToLngLatDelta = this.metersToLngLatDelta.bind(this);
        this.lngLatDeltaToMeters = this.lngLatDeltaToMeters.bind(this);
        this.addMetersToLngLat = this.addMetersToLngLat.bind(this);

        Object.freeze(this);
    }
}

export default MixinsViewport;
