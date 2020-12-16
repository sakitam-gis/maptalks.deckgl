import * as React from 'react';

interface IProps {
  width?: number,
  height?: number,
  colorCode?: string,
  className?: string,
  UnitCaption?: string,
}

interface IState {
  saveTime: number,
  frameCounterArray: number[],
  fpsRate: number,
}

export default class FpsComponents extends React.Component<IProps, IState> {
  canvas: HTMLCanvasElement | undefined;
  static frameCounter: number = 0;

  static defaultProps = {
    width: 60,
    height: 40,
    colorCode: '#00FF00',
    className: 'fps-rate',
    UnitCaption: 'fps'
  }

  static getDerivedStateFromProps(nextProps: IProps, prevState: IState) {
    const { width } = nextProps;
    const { saveTime, frameCounterArray } = prevState;
    if((Date.now() - saveTime) >= 1000){
      frameCounterArray.push(FpsComponents.frameCounter);
      if(frameCounterArray.length > ((width as number) / 2)){
        frameCounterArray.shift();
      }
      const returnObject = {
        saveTime: Date.now(),
        frameCounterArray: frameCounterArray,
        fpsRate: FpsComponents.frameCounter,
      }
      FpsComponents.frameCounter = 1;
      return returnObject;
    }
    FpsComponents.frameCounter = FpsComponents.frameCounter + 1;
    return null;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      saveTime: Date.now(),
      frameCounterArray: [],
      fpsRate: 0,
    };
  }

  componentDidUpdate(prevProps: IProps, prevState: IState) {
    if(this.state !== prevState){
      const { width, height, colorCode } = prevProps;
      const { frameCounterArray } = prevState;
      if (!this.canvas) return;
      const context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
      const maxValue = Math.max.apply(null, frameCounterArray);
      context.clearRect(0,0, (width as number), (height as number));
      frameCounterArray.forEach((frameCounter: number, idx: number) => {
        const value = (frameCounter / maxValue) * (height as number);
        if (colorCode) {
          context.fillStyle = colorCode;
        }
        context.fillRect((idx * 2), ((height as number) - value), 1, value);
      });
    }
  }

  setRef = (el: HTMLCanvasElement) => {
    if (el) {
      this.canvas = el;
    }
  };

  render() {
    const { width, height, className, UnitCaption } = this.props;

    return (
      <div className={className}>
        <div>
          <span>{this.state.fpsRate}</span>
          <span>{UnitCaption}</span>
        </div>
        <canvas
          ref={this.setRef}
          width={width} height={height}
        />
      </div>
    );
  }
}
