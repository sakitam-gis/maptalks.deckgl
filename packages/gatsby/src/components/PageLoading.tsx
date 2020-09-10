import React from 'react';
import './pageloading.less';

const PageLoading = () => (
  <div className="cube-wrapper">
    <div className="cube-folding">
      <span className="leaf1" />
      <span className="leaf2" />
      <span className="leaf3" />
      <span className="leaf4" />
    </div>
    <span className="loading" data-name="Loading">Loading</span>
  </div>
);

export default PageLoading;
