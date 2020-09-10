import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import magnifier from '../assets/images/magnifier.png';
import '../assets/style/index.less';

interface IProps {

}

interface IState {
  charts: any[];
}

class Index extends Component<IProps, IState> {
  state: IState = {
    charts: []
  }

  constructor (props: IProps, context?: any) {
    super(props, context);
  }

  componentDidMount () {
    fetch('./json/config.json')
      .then(res => res.json())
      .then((res: any[]) => {
        this.setState({
          charts: res,
        })
      })
  }

  /**
   * 获取示例列表
   * @returns {*}
   */
  getArtList () {
    const { charts } = this.state;
    return charts.map((item, index) => {
      return (
        <li className="chart" key={index}>
          <div className="chart_wrap">
            <span
              className="chart_bg"
              style={{
                backgroundImage: `url('${item.imgSrc}')`
              }}>
              <div className="chart_hover animation clearfix">
                <Link to={item.link}>
                  <div className="chart_magnifier_right">
                    <div>
                      <img src={magnifier} />
                    </div>
                    <div>查看示例</div>
                  </div>
                </Link>
              </div>
            </span>
            <div className="chart_info">
              <div className="chart_name">{item.chart_name}</div>
              <div className="chart_detail clearfix">
                <div className="chart_author pull-left">
                  <span className="chart_icon chart_author_icon" />
                  <span className="chart_icontxt">{item.chart_author}</span>
                </div>
                <div className="chart_time pull-right">
                  <span className="chart_icon chart_time_icon" />
                  <span className="chart_icontxt">{item.chart_time}</span>
                </div>
              </div>
            </div>
          </div>
        </li>
      )
    })
  }

  /**
   * render
   * @returns {*}
   */
  render () {
    return (
      <div style={{
        height: '100%'
      }}>
        <Header />
        <div className="main">
          <div className="charts-list">
            <ul id="charts-list-ul" className="charts-list-ul clearfix">
              {this.getArtList()}
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

export default Index;
