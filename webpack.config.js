const resolve = require('path').resolve;

const CONFIG = {
    mode: 'development',
    // mode: 'production',

    entry: {
        app: resolve('src/index.js')
        // app: resolve('mapbox/index.js')
    },

    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                include: [
                    resolve('src'),
                    resolve('mapbox')
                ]
            }
        ]
    },

    resolve: {
        alias: {
        }
    },

    devServer: {
        stats: {
            warnings: false
        }
    },

    devtool: 'source-map',

    plugins: [

    ]
};

module.exports = CONFIG;
