import 'maptalks/dist/maptalks.css';
import '../assets/style/art.less';
import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
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
    name: 'fps',
    key: 'fps',
    route: {
      path: '/fps',
      component: loadable(() => import(/* webpackChunkName: 'fps' */ '../pages/Base'))
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
  // {
  //   name: 'highway',
  //   key: 'highway',
  //   route: {
  //     path: '/highway',
  //     component: loadable(() => import(/* webpackChunkName: 'Highway' */ '../pages/Highway'))
  //   }
  // },
  // {
  //   name: 'hexagon',
  //   key: 'hexagon',
  //   route: {
  //     path: '/hexagon',
  //     component: loadable(() => import(/* webpackChunkName: 'HexagonLayer' */ '../pages/HexagonLayer'))
  //   }
  // },
  // {
  //   name: 'brushing',
  //   key: 'brushing',
  //   route: {
  //     path: '/brushing',
  //     component: loadable(() => import(/* webpackChunkName: 'Brushing' */ '../pages/Brushing'))
  //   }
  // },
  // {
  //   name: 'vector',
  //   key: 'vector',
  //   route: {
  //     path: '/vector',
  //     component: loadable(() => import(/* webpackChunkName: 'Vector' */ '../pages/Vector'))
  //   }
  // },
  // {
  //   name: 'polygon',
  //   key: 'polygon',
  //   route: {
  //     path: '/polygon',
  //     component: loadable(() => import(/* webpackChunkName: 'Polygon' */ '../pages/Polygon'))
  //   }
  // },
  // {
  //   name: 'linelayer',
  //   key: 'linelayer',
  //   route: {
  //     path: '/linelayer',
  //     component: loadable(() => import(/* webpackChunkName: 'LineLayer' */ '../pages/LineLayer'))
  //   }
  // },
  // {
  //   name: '3dtiles',
  //   key: '3dtiles',
  //   route: {
  //     path: '/3dtiles',
  //     component: loadable(() => import(/* webpackChunkName: '3DTiles' */ '../pages/3DTiles'))
  //   }
  // },
  // {
  //   name: 'icon-layer',
  //   key: 'icon-layer',
  //   route: {
  //     path: '/icon-layer',
  //     component: loadable(() => import(/* webpackChunkName: 'IconLayer' */ '../pages/IconLayer'))
  //   }
  // },
  // {
  //   name: 'vancouver-polygon',
  //   key: 'vancouver-polygon',
  //   route: {
  //     path: '/vancouver-polygon',
  //     component: loadable(() => import(/* webpackChunkName: 'VancouverPolygon' */ '../pages/VancouverPolygon'))
  //   }
  // },
  // {
  //   name: 'vancouver-test',
  //   key: 'vancouver-test',
  //   route: {
  //     path: '/vancouver-test',
  //     component: loadable(() => import(/* webpackChunkName: 'VancouverPolygon' */ '../pages/Test/Test'))
  //   }
  // }
];

const routes = (
  <Switch>
    {mainRouter.map((route) => <Route key={route.key} {...route.route} />)}
    <Redirect to="./index" />
  </Switch>
);

export default routes;
