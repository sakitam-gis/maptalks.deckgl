'use strict'
const rm = require('rimraf');
const path = require('path');
const utils = require('./utils');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const webpackConfig = merge(require('./webpack.base.conf'), {
  mode: 'production',
  entry: {
    app: './src/index.js'
  },
  devtool: false,
  output: {
    path: utils.resolve('dist'),
    filename: 'ol-deckgl.js',
    publicPath: './',
    library: undefined,
    libraryTarget: 'umd',
    umdNamedDefine: 'DeckLayer'
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          warnings: false
        }
      },
      sourceMap: false,
      parallel: true
    })
  ],
  optimization: {
    // chunk for the webpack runtime code and chunk manifest
    runtimeChunk: {
      name: 'manifest'
    },
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          test: 'vendor',
          name: 'vendor',
          enforce: true
        }
      }
    }
  }
});

module.exports = new Promise((resolve, reject) => {
  rm(path.join(utils.resolve('_site')), err => {
    if (err) throw err;
    resolve(webpackConfig)
  })
});
