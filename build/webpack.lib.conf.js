'use strict'
const rm = require('rimraf');
const path = require('path');
const utils = require('./utils');
const merge = require('webpack-merge');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

const webpackConfig = merge(require('./webpack.base.conf'), {
  mode: process.env.NODE_ENV || 'production',
  entry: {
    app: './src/index.js'
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  output: {
    path: utils.resolve('dist'),
    filename: process.env.NODE_ENV === 'production' ? 'maptalks-deckgl.min.js' : 'maptalks-deckgl.js',
    publicPath: './',
    library: 'DeckGLLayer',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this',
    libraryExport: 'default'
  },
  plugins: process.env.NODE_ENV === 'production' ? [
    new ParallelUglifyPlugin({
      cacheDir: path.join(__dirname, '../cache/'),
      sourceMap: false,
      uglifyES: {
        output: {
          comments: false
        },
        compress: {
          inline: 1, // https://github.com/mishoo/UglifyJS2/issues/2842
          warnings: false,
          drop_console: true
        }
      }
    })
  ] : [],
  optimization: {
    // chunk for the webpack runtime code and chunk manifest
    runtimeChunk: false,
    splitChunks: false
  },
  externals : {
    maptalks: {
      commonjs: 'maptalks',
      commonjs2: 'maptalks',
      amd: 'maptalks',
      root: 'maptalks' // indicates global variable
    },
    // 'deck.gl': {
    //   commonjs: 'maptalks',
    //   amd: 'maptalks',
    //   root: 'maptalks' // indicates global variable
    // },
    '@deck.gl/core': {
      commonjs: '@deck.gl/core',
      commonjs2: '@deck.gl/core',
      amd: '@deck.gl/core',
      root: 'window' // indicates global variable
    },
  },
});

// module.exports = new Promise((resolve, reject) => {
//   rm(path.join(utils.resolve('dist')), err => {
//     if (err) throw err;
//     resolve(webpackConfig)
//   })
// });

module.exports = webpackConfig;
