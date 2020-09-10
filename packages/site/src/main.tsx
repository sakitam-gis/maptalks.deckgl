import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'; // eslint-disable-line
import './index.css'
import routes from './routers/index';

const env = process.env.NODE_ENV || 'development';

const RootApp = () => {
  return (
    <Router>
      {routes}
    </Router>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
  document.getElementById('root')
)
