import View from './view';
import WebMercatorViewport from '../viewport/web-mercator-viewport';
import MapController from '@deck.gl/core/dist/esm/controllers/map-controller';

export default class MapView extends View {
    constructor(props) {
        super(
            Object.assign({}, props, {
                type: WebMercatorViewport
            })
        );
    }

    get controller() {
        return this._getControllerProps({
            type: MapController
        });
    }
}

MapView.displayName = 'MapView';
