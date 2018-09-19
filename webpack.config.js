const resolve = require('path').resolve;

const CONFIG = {
    mode: 'development',
    // mode: 'production',

    entry: {
        // app1: resolve('src/index.js'),
        // app2: resolve('examples/HexagonLayer.js'),
        app3: resolve('examples/highway.js'),
        // app4: resolve('examples/trips.js'),
        // app5: resolve('examples/brushing/index.js'),
    },

    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                include: [
                    resolve('src'),
                    resolve('examples')
                ]
            }
        ]
    },

    resolve: {
        alias: {
        }
    },

    devServer: {
        host: '127.0.0.1',
        stats: {
            warnings: false
        }
    },

    devtool: 'source-map',

    plugins: [

    ]
};

module.exports = CONFIG;
