import React from 'react'; // eslint-disable-line
import { Route, Switch, Redirect } from 'react-router-dom'; // eslint-disable-line
import Index from '../pages/Index';
import Brushing from '../pages/Brushing';
import Building from '../pages/Building';
import Highway from '../pages/Highway';
import HexagonLayer from '../pages/HexagonLayer';
import Vector from '../pages/Vector';

const mainRouter = [
  {
    name: 'index',
    key: 'index',
    route: {
      path: '/index',
      component: Index
    }
  },
  {
    name: 'building',
    key: 'building',
    route: {
      path: '/building',
      component: Building
    }
  },
  {
    name: 'highway',
    key: 'highway',
    route: {
      path: '/highway',
      component: Highway
    }
  },
  {
    name: 'hexagon',
    key: 'hexagon',
    route: {
      path: '/hexagon',
      component: HexagonLayer
    }
  },
  {
    name: 'brushing',
    key: 'brushing',
    route: {
      path: '/brushing',
      component: Brushing
    }
  },
  {
    name: 'vector',
    key: 'vector',
    route: {
      path: '/vector',
      component: Vector
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
