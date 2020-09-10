import './index.less';
import React, { useState, useEffect } from 'react';
import { Link } from 'gatsby';
import magnifier from '../images/magnifier.png';

function Page() {
  const [charts, setCharts] = useState<any[]>([]);

  function getArtList () {
    return charts.map((item: any, index: number) => {
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

  function getData() {
    fetch('./json/config.json')
      .then(res => res.json())
      .then((res: any[]) => {
        setCharts(res);
      })
  }

  useEffect(() => {
    getData();
    return () => {
      // clearTimeout(timeout);
    };
  }, []);

  return <div className="main">
    <div className="charts-list">
      <ul id="charts-list-ul" className="charts-list-ul clearfix">
        {getArtList()}
      </ul>
    </div>
  </div>
}

// Page.noLayout = true;

export default Page;
