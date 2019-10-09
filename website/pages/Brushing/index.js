import * as React from 'react';
import { scaleLinear } from 'd3-scale';
import { DeckGLLayer } from '../../../src';
import ArcBrushingLayer from './arc-brushing-layer/arc-brushing-layer';
import ScatterplotBrushingLayer from './scatterplot-brushing-layer/scatterplot-brushing-layer';
import * as maptalks from 'maptalks';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/arc/counties.json';

const SOURCE_COLOR = [166, 3, 3];
const TARGET_COLOR = [35, 181, 184];

class Index extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {
      zoom: 14,
      fov: 0,
      pitch: 0,
      bearing: 0
    };

    this.container = null;
    this.map = null;
    this.deckLayer = null;
    this.inited = false;
    this.mousePosition = null;
  }

  componentDidMount () {
    this.map = new maptalks.Map(this.container, {
      center: [-100, 40.7],
      zoom: 3,
      pitch: 40.5,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg'
      })
    });

    fetch(DATA_URL).then(response => response.json()).then(({ features }) => {
      this._animate(features);
    });
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  _animate = (features) => {
    const [
      enableBrushing,
      brushRadius,
      strokeWidth,
      opacity
    ] = [true, 100000, 2, 0.7];
    const { mousePosition } = this;
    const { arcs, targets, sources } = this._getLayerData(features);
    const startBrushing = !enableBrushing;
    const layers = [
      new ScatterplotBrushingLayer({
        id: 'sources',
        data: sources,
        brushRadius,
        brushTarget: true,
        mousePosition,
        opacity: 1,
        enableBrushing: startBrushing,
        pickable: false,
        // only show source points when brushing
        radiusScale: startBrushing ? 3000 : 0,
        getColor: d => (d.gain > 0 ? TARGET_COLOR : SOURCE_COLOR),
        getTargetPosition: d => [d.position[0], d.position[1], 0]
      }),
      new ScatterplotBrushingLayer({
        id: 'targets-ring',
        data: targets,
        brushRadius,
        mousePosition,
        strokeWidth: 2,
        outline: true,
        opacity: 1,
        enableBrushing: startBrushing,
        // only show rings when brushing
        radiusScale: startBrushing ? 4000 : 0,
        getColor: d => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR)
      }),
      new ScatterplotBrushingLayer({
        id: 'targets',
        data: targets,
        brushRadius,
        mousePosition,
        opacity: 1,
        enableBrushing: startBrushing,
        pickable: true,
        radiusScale: 3000,
        getColor: d => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR)
      }),
      new ArcBrushingLayer({
        id: 'arc',
        data: arcs,
        strokeWidth,
        opacity,
        brushRadius,
        enableBrushing: startBrushing,
        mousePosition,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: d => SOURCE_COLOR,
        getTargetColor: d => TARGET_COLOR
      })
    ];
    const props = {
      layers: layers
    };
    if (!this.inited) {
      this.inited = true;
      this.deckLayer = new DeckGLLayer('deck', props, {
        animation: true,
        renderer: 'webgl'
      });

      this.map.addLayer(this.deckLayer);
    } else if (this.deckLayer) {
      this.deckLayer.setProps(props);
    }
  };

  _getLayerData = (data) => {
    if (!data) {
      return null;
    }
    const arcs = [];
    const targets = [];
    const sources = [];
    const pairs = {};

    data.forEach((county, i) => {
      const { flows, centroid: targetCentroid } = county.properties;
      const value = { gain: 0, loss: 0 };
      Object.keys(flows).forEach(toId => {
        value[flows[toId] > 0 ? 'gain' : 'loss'] += flows[toId];
        // if number too small, ignore it
        if (Math.abs(flows[toId]) < 50) {
          return;
        }
        const pairKey = [i, Number(toId)].sort((a, b) => a - b).join('-');
        const sourceCentroid = data[toId].properties.centroid;
        const gain = Math.sign(flows[toId]);
        // add point at arc source
        sources.push({
          position: sourceCentroid,
          target: targetCentroid,
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

    return { arcs, targets, sources };
  };

  setRef = (x = null) => {
    this.container = x;
  };

  render () {
    return (<div ref={this.setRef} className="map-content"></div>);
  }
}

export default Index;
