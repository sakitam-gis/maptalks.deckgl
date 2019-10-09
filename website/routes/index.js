import React from 'react'; // eslint-disable-line
import { Route, Switch, Redirect } from 'react-router-dom'; // eslint-disable-line
import 'maptalks/dist/maptalks.css';
import '../assets/style/art.scss';
import loadable from '@loadable/component';

const mainRouter = [
  {
    name: 'index',
    key: 'index',
    route: {
      path: '/index',
      component: loadable(() => import(/* webpackChunkName: 'index' */ '../pages/index'))
    }
  },
  {
    name: 'building',
    key: 'building',
    route: {
      path: '/building',
      component: loadable(() => import(/* webpackChunkName: 'Building' */ '../pages/Building'))
    }
  },
  {
    name: 'highway',
    key: 'highway',
    route: {
      path: '/highway',
      component: loadable(() => import(/* webpackChunkName: 'Highway' */ '../pages/Highway'))
    }
  },
  {
    name: 'hexagon',
    key: 'hexagon',
    route: {
      path: '/hexagon',
      component: loadable(() => import(/* webpackChunkName: 'HexagonLayer' */ '../pages/HexagonLayer'))
    }
  },
  {
    name: 'brushing',
    key: 'brushing',
    route: {
      path: '/brushing',
      component: loadable(() => import(/* webpackChunkName: 'Brushing' */ '../pages/Brushing'))
    }
  },
  {
    name: 'vector',
    key: 'vector',
    route: {
      path: '/vector',
      component: loadable(() => import(/* webpackChunkName: 'Brushing' */ '../pages/Vector'))
    }
  },
  {
    name: 'polygon',
    key: 'polygon',
    route: {
      path: '/polygon',
      component: loadable(() => import(/* webpackChunkName: 'Brushing' */ '../pages/Polygon'))
    }
  },
  {
    name: 'linelayer',
    key: 'linelayer',
    route: {
      path: '/linelayer',
      component: loadable(() => import(/* webpackChunkName: 'Brushing' */ '../pages/LineLayer'))
    }
  }
];

const routes = (
  <Switch>
    {mainRouter.map((route) => <Route key={route.key} {...route.route} />)}
    <Redirect to="./index" />
  </Switch>
);

export default routes;
