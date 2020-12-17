import DeckGLLayer from 'maptalks.deckgl';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
// @ts-ignore
import { BrushingExtension } from '@deck.gl/extensions';
import { scaleLinear } from 'd3-scale';
import Base from '../base';

const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/arc/counties.json'; // eslint-disable-line

const SOURCE_COLOR = [166, 3, 3];
const TARGET_COLOR = [35, 181, 184];

export const inFlowColors = [[35, 181, 184]];
export const outFlowColors = [[166, 3, 3]];

const brushingExtension = new BrushingExtension();

interface IProps {

}

interface IState {
  data: any;
  x?: number;
  y?: number;
  hoveredObject?: any;

  enableBrushing: boolean;
  brushRadius: number;
  strokeWidth: number;
  opacity: number;
}

function getLayerData(data: any[]) {
  if (!data || !data.length) {
    return {};
  }
  const arcs: any[] = [];
  const targets: any[] = [];
  const sources: any[] = [];
  const pairs: any = {};

  data.forEach((county, i) => {
    const {flows, centroid: targetCentroid} = county.properties;
    const value = {gain: 0, loss: 0};

    Object.keys(flows).forEach((toId: string | number) => {
      value[flows[toId] > 0 ? 'gain' : 'loss'] += flows[toId];

      // if number too small, ignore it
      if (Math.abs(flows[toId]) < 50) {
        return;
      }
      const pairKey = [i, Number(toId)].sort((a, b) => a - b).join('-');
      // @ts-ignore
      const sourceCentroid = data[toId].properties.centroid;
      const gain = Math.sign(flows[toId]);

      // add point at arc source
      sources.push({
        position: sourceCentroid,
        target: targetCentroid,
        // @ts-ignore
        name: data[toId].properties.name,
        radius: 3,
        gain: -gain
      });

      // eliminate duplicates arcs
      if (pairs[pairKey]) {
        return;
      }

      pairs[pairKey] = true;

      arcs.push({
        target: gain > 0 ? targetCentroid : sourceCentroid,
        source: gain > 0 ? sourceCentroid : targetCentroid,
        value: flows[toId]
      });
    });

    // add point at arc target
    targets.push({
      ...value,
      position: [targetCentroid[0], targetCentroid[1], 10],
      net: value.gain + value.loss,
      name: county.properties.name
    });
  });

  // sort targets by radius large -> small
  targets.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  const sizeScale = scaleLinear()
    .domain([0, Math.abs(targets[0].net)])
    .range([36, 400]);

  targets.forEach(pt => {
    pt.radius = Math.sqrt(sizeScale(Math.abs(pt.net)));
  });

  return {arcs, targets, sources};
}

class Brushing extends Base {
  private deckLayer: DeckGLLayer | null;

  state: IState = {
    data: [],
    enableBrushing: true,
    brushRadius: 100000,
    strokeWidth: 2,
    opacity: 0.7,
  }

  constructor (props: IProps) {
    super(props);
    this.deckLayer = null;

    this.viewState = {
      center: [-100, 40.7],
      zoom: 3,
      pitch: 40.5,
      bearing: 0,
    };
  }

  initMap() {
    super.initMap();
    fetch(DATA_URL)
      .then(response => response.json())
      .then(({features}) => {
        this.setState({
          data: features
        }, () => {
          this._renderLayers();
        })
      })
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      // @ts-ignore
      this.deckLayer.remove()
    }
    super.componentWillUnmount();
  }

  _renderLayers () {
    const {
      enableBrushing = true,
      brushRadius = 100000,
      strokeWidth = 2,
      opacity = 0.7,
      data,
    } = this.state;
    const { arcs, targets, sources } = getLayerData(data);
    try {
      const props = {
        layers: [
          new ScatterplotLayer({
            id: 'sources',
            data: sources,
            brushingRadius: brushRadius,
            brushingEnabled: enableBrushing,
            // only show source points when brushing
            radiusScale: enableBrushing ? 3000 : 0,
            getFillColor: (d: { gain: number; }) => (d.gain > 0 ? TARGET_COLOR : SOURCE_COLOR),
            extensions: [brushingExtension]
          }),
          new ScatterplotLayer({
            id: 'targets-ring',
            data: targets,
            brushingRadius: brushRadius,
            lineWidthMinPixels: 2,
            stroked: true,
            filled: false,
            brushingEnabled: enableBrushing,
            // only show rings when brushing
            radiusScale: enableBrushing ? 4000 : 0,
            getLineColor: (d: { net: number; }) => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR),
            extensions: [brushingExtension]
          }),
          new ScatterplotLayer({
            id: 'targets',
            data: targets,
            brushingRadius: brushRadius,
            brushingEnabled: enableBrushing,
            pickable: true,
            radiusScale: 3000,
            getFillColor: (d: { net: number; }) => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR),
            extensions: [brushingExtension]
          }),
          new ArcLayer({
            id: 'arc',
            data: arcs,
            getWidth: strokeWidth,
            opacity,
            brushingRadius: brushRadius,
            brushingEnabled: enableBrushing,
            getSourcePosition: (d: { source: any; }) => d.source,
            getTargetPosition: (d: { target: any; }) => d.target,
            getSourceColor: SOURCE_COLOR,
            getTargetColor: TARGET_COLOR,
            extensions: [brushingExtension]
          })
        ],
      }
      if (!this.deckLayer) {
        console.log(this.deckLayer);
        this.deckLayer = new DeckGLLayer('deck', props, {
          animation: true,
          forceRenderOnMoving: true,
          forceRenderOnZooming: true,
          renderStart: () => {
            this.renderState?.update();
          },
        });

        this.map.addLayer(this.deckLayer);

        console.log(this.deckLayer);
      } else {
        this.deckLayer.setProps(props);
      }
    } catch (e) {
      console.error(e)
    }
  }
}

export default Brushing;
