import { ArcLayer } from '@deck.gl/layers';

import arcVertex from './arc-brushing-layer-vertex.glsl';
import arcFragment from './arc-brushing-layer-fragment.glsl';

const defaultProps = {
    ...ArcLayer.defaultProps,
    // show arc if source is in brush
    brushSource: true,
    // show arc if target is in brush
    brushTarget: true,
    enableBrushing: true,
    getStrokeWidth: d => d.strokeWidth,
    // brush radius in meters
    brushRadius: 100000,
    mousePosition: [0, 0]
};

export default class ArcBrushingLayer extends ArcLayer {
    getShaders() {
    // use customized shaders
        return Object.assign({}, super.getShaders(), {
            vs: arcVertex,
            fs: arcFragment
        });
    }

    draw(opts) {
    // add uniforms
        const uniforms = Object.assign({}, opts.uniforms, {
            brushSource: this.props.brushSource,
            brushTarget: this.props.brushTarget,
            brushRadius: this.props.brushRadius,
            mousePos: this.props.mousePosition ?
                new Float32Array(this.unproject(this.props.mousePosition)) :
                defaultProps.mousePosition,
            enableBrushing: this.props.enableBrushing
        });
        const newOpts = Object.assign({}, opts, { uniforms });
        super.draw(newOpts);
    }
}

ArcBrushingLayer.layerName = 'ArcBrushingLayer';
ArcBrushingLayer.defaultProps = defaultProps;
