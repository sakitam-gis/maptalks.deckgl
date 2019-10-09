import * as React from 'react';
import * as maptalks from 'maptalks';
import { scaleLinear } from 'd3-scale';

import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { BrushingExtension } from '@deck.gl/extensions';

import DeckGLLayer from '../../../src';
import { getDevicePixelRatio } from '../../../src/utils';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/arc/counties.json';

const SOURCE_COLOR = [166, 3, 3];
const TARGET_COLOR = [35, 181, 184];

export const inFlowColors = [[35, 181, 184]];
export const outFlowColors = [[166, 3, 3]];

const brushingExtension = new BrushingExtension();

class Index extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.state = {
      arcs: [],
      targets: [],
      sources: []
    };

    this.container = null;
    this.map = null;
    this.deckLayer = null;
    this.inited = false;
    this._onHover = this._onHover.bind(this);
  }

  componentDidMount () {
    this.map = new maptalks.Map(this.container, {
      center: [-100, 40.7],
      zoom: 3,
      pitch: 0,
      bearing: 0,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}${getDevicePixelRatio() > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`
      })
    });

    fetch(DATA_URL)
      .then(response => response.json())
      .then(({ features }) => {
        this._animate();
        this.setState({
          ...this._getLayerData(features)
        })
      });
  }

  componentWillUnmount () {
    // this.map.remove()
    if (this.deckLayer) {
      this.deckLayer.remove()
    }
  }

  _onHover ({ x, y, object }) {
    this.setState({ x, y, hoveredObject: object });
  }

  _animate = () => {
    const [
      enableBrushing,
      brushRadius,
      strokeWidth,
      opacity
    ] = [true, 100000, 2, 0.7];
    const { arcs, targets, sources } = this.state;

    if (!arcs || !targets) {
      return null;
    }

    const layers = [
      new ScatterplotLayer({
        id: 'sources',
        data: sources,
        brushingRadius: brushRadius,
        opacity: 1,
        brushingEnabled: enableBrushing,
        pickable: false,
        // only show source points when brushing
        radiusScale: enableBrushing ? 3000 : 0,
        getFillColor: d => (d.gain > 0 ? TARGET_COLOR : SOURCE_COLOR),
        extensions: [brushingExtension]
      }),
      new ScatterplotLayer({
        id: 'targets-ring',
        data: targets,
        brushingRadius: brushRadius,
        lineWidthMinPixels: 2,
        stroked: true,
        filled: false,
        opacity: 1,
        brushingEnabled: enableBrushing,
        // only show rings when brushing
        radiusScale: enableBrushing ? 4000 : 0,
        getLineColor: d => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR),
        extensions: [brushingExtension]
      }),
      new ScatterplotLayer({
        id: 'targets',
        data: targets,
        brushingRadius: brushRadius,
        opacity: 1,
        brushingEnabled: enableBrushing,
        pickable: true,
        radiusScale: 3000,
        onHover: this._onHover,
        getFillColor: d => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR),
        extensions: [brushingExtension]
      }),
      new ArcLayer({
        id: 'arc',
        data: arcs,
        getWidth: strokeWidth,
        opacity,
        brushingRadius: brushRadius,
        brushingEnabled: enableBrushing,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: SOURCE_COLOR,
        getTargetColor: TARGET_COLOR,
        extensions: [brushingExtension]
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
    if (this.deckLayer) {
      this._animate();
    }

    return (<div ref={this.setRef} className="map-content"/>);
  }
}

export default Index;
