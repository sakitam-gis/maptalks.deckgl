import './base.less';
import 'maptalks/dist/maptalks.css'
import React from 'react';
import Stats from 'stats.js';
import * as maptalks from 'maptalks';

interface IProps {

}

interface IState {

}

export default class Base extends React.Component<IProps, IState> {
  static noLayout = true;

  public renderState: Stats | undefined;

  public map: any;
  public container: HTMLDivElement | undefined;
  public viewState: {
    bearing: number;
    center: number[];
    zoom: number;
    pitch: number;
  };

  constructor(props: IProps) {
    super(props);

    this.viewState = {
      center: [-74, 40.72],
      zoom: 13,
      pitch: 40.5,
      bearing: 0,
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    this.removeMap();
  }

  initMap() {
    this.map = new maptalks.Map(this.container, {
      ...this.viewState,
      centerCross: true,
      baseLayer: new maptalks.TileLayer('tile', {
        urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        // urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
      })
    });

    this.renderState = new Stats();
    // @ts-ignore
    this.renderState.domElement.style.zIndex = 100;
    // @ts-ignore
    this.container.appendChild(this.renderState.domElement);
  }

  renderTooltip () {
    return <div></div>
  }

  removeMap() {
    if (this.map) {
      this.map.remove();
    }
  }

  setRef = (x: HTMLDivElement) => {
    if (x) {
      this.container = x;
      this.initMap();
    }
  };

  render () {
    return (
      <div className="map-wrap">
        <div ref={this.setRef} className="map-content">
          { this.renderTooltip() }
        </div>
      </div>
    );
  }
}
