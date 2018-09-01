const package_ = require('./package.json');
const babel = require('rollup-plugin-babel');
// const resolve = (_path) => path.resolve(__dirname, '.', _path);

module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '.',
        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'expect', 'sinon', 'happen'],
        client: {
            mocha: {
                timeout: 8000
            }
        },
        files: [
            'dist/' + package_.name + '.js',
            'test/**/*.js'
        ],
        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/**/*.js': ['rollup', 'coverage'],
            'test/**/*.js': ['rollup']
        },

        rollupPreprocessor: {
            output: {
                format: 'iife', // Helps prevent naming collisions.
                name: package_.namespace, // Required for 'iife' format.
                sourcemap: 'inline' // Sensible for testing.
            },
            plugins: [
                babel()
            ]
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['mocha', 'progress', 'coverage'],
        coverageReporter: {
            type: 'html',
            dir: 'coverage/',
            reporters: [
                { type: 'lcov', subdir: '.' },
                { type: 'text-summary', subdir: '.' },
            ],
            instrumenterOptions: {
                istanbul: { noCompact: true }
            }
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        // browsers: ['Chrome', 'Firefox', 'IE'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,
        logLevel: config.LOG_INFO
    });
};
