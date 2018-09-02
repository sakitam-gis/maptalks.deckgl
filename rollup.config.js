// Config file for running Rollup in "normal" mode (non-watch)

const path = require('path');
const babel = require('rollup-plugin-babel'); // ES2015 tran
const cjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const { eslint } = require('rollup-plugin-eslint');
const { uglify } = require('rollup-plugin-uglify');
const friendlyFormatter = require('eslint-friendly-formatter');
const _package = require('./package.json');

const time = new Date();
const year = time.getFullYear();
const banner = `/*!\n * author: ${_package.author} 
 * ${_package.name} v${_package.version}
 * build-time: ${year}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}
 * LICENSE: ${_package.license}
 * (c) 2018-${year} ${_package.homepage}\n */`;

const resolve = (_path) => path.resolve(__dirname, '.', _path);

const isProduction = process.env.NODE_ENV === 'production';

console.log(isProduction);

const handleMinEsm = (name) => {
    if (typeof name === 'string') {
        let arr_ = name.split('.');
        let arrTemp = [];
        arr_.forEach((item, index) => {
            if (index < arr_.length - 1) {
                arrTemp.push(item);
            } else {
                arrTemp.push('min');
                arrTemp.push(item);
            }
        });
        return arrTemp.join('.');
    }
};

const plugins = [
    eslint({
        configFile: resolve('.eslintrc.js'),
        formatter: friendlyFormatter,
        exclude: [resolve('node_modules')]
    }),
    babel(),
    nodeResolve({
        jsnext: true,
        main: true,
        browser: true
    }),
    cjs()
];

if (isProduction) {
    plugins.push(uglify())
}

const output = [
    {
        sourcemap: 'inline',
        file: resolve(isProduction ? handleMinEsm(_package.unpkg) : _package.unpkg),
        format: 'umd',
        env: 'development',
        extend: true,
        banner,
        name: _package.namespace,
        globals: {
            'maptalks': 'maptalks',
            'deck.gl': 'deck'
        }
    },
    {
        file: resolve(_package.module),
        format: 'es',
        sourcemap: false,
        extend: true,
        banner,
        name: _package.namespace,
        globals: {
            'maptalks': 'maptalks',
            'deck.gl': 'deck'
        }
    },
    {
        sourcemap: false,
        file: resolve(_package.main),
        format: 'cjs',
        extend: true,
        banner,
        name: _package.namespace,
        globals: {
            'maptalks': 'maptalks',
            'deck.gl': 'deck'
        }
    }
];

module.exports = {
    input: resolve('src/index.js'),
    plugins: plugins,
    external: ['maptalks', 'deck.gl'],
    output: output
};
