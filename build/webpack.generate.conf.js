'use strict'
const rm = require('rimraf');
const path = require('path');
const utils = require('./utils');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('mini-css-extract-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

const webpackConfig = merge(require('./webpack.base.conf'), {
  mode: 'production',
  entry: {
    app: './website/index.js'
  },
  module: {
    rules: utils.styleLoaders({
      sourceMap: true,
      extract: true,
      usePostCSS: true
    })
  },
  devtool: false,
  output: {
    path: utils.resolve('_site'),
    filename: utils.assetsPath('scripts/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('scripts/[id].[chunkhash].js'),
    publicPath: './',
    library: undefined,
    libraryTarget: 'var',
    umdNamedDefine: false
  },
  plugins: [
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
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      allChunks: true
    }),
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true,
        map: {
          inline: false
        }
      }
    }),
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'website/index.html',
      inject: true,
      chunksSortMode: 'auto',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      version: new Date().toLocaleString('zh', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }),
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      inlineSource: 'manifest.*.js'
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin(),

    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: 'website/static',
        to: 'static',
        ignore: ['.*']
      }
    ])
  ],
  optimization: {
    // chunk for the webpack runtime code and chunk manifest
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        deckgl: {
          name: 'chunk-deckgl', // split elementUI into a single package
          priority: 50, // the weight needs to be larger than libs and app or it will be packaged into libs or app
          test: /[\\/]?src[\\/][\S]*?(\.js)?/, // in order to adapt to cnpm
          chunks: 'initial', // only package third parties that are initially dependent
        },
        maptalks: {
          name: 'chunk-maptalks', // split elementUI into a single package
          priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
          test: /[\\/]?node_modules[\\/]maptalks[\\/][\S]*?(\.js)?/, // in order to adapt to cnpm
          chunks: 'initial', // only package third parties that are initially dependent
        },
        decks: {
          name: 'chunk-deck',
          test: /[\\/]?node_modules[\\/]@deck.gl[\\/][\S]*?(\.js)?/,
          priority: 20,
          chunks: 'initial', // only package third parties that are initially dependent
        },
        libs: {
          name: 'chunk-libs',
          test: /[\\/]?node_modules[\\/]/,
          priority: 10,
          chunks: 'initial', // only package third parties that are initially dependent
        },
      },
    }
  }
});

module.exports = new Promise((resolve, reject) => {
  if (process.env.GZ_ENV) {
    const CompressionWebpackPlugin = require('compression-webpack-plugin');

    webpackConfig.plugins.push(
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        threshold: 10240,
        minRatio: 0.8,
        test: /\.(js|css|html|svg)$/,
        // compressionOptions: { level: 11 },
        deleteOriginalAssets: false,
      })
    )
  }

  if (process.env.REPORT_ENV) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    webpackConfig.plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    }))
  }

  rm(path.join(utils.resolve('_site')), err => {
    if (err) throw err;
    resolve(webpackConfig)
  })
});
