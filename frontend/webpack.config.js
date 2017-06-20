const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const CompressionPlugin = require("compression-webpack-plugin")
const productDir = `${__dirname}/dist`
const buildTarget = process.env.HSCMAP_BUILD_TARGET || 'development'
if (['development', 'production'].indexOf(buildTarget) < 0)
    throw 'HSCMAP_BUILD_TARGET must be one of development and production.'


const ioConfig = {
    entry: [
        'file-loader?name=index.html!./src/app/index.html',
        './src/app/main.ts',
    ],
    output: {
        path: productDir,
        filename: 'bundle.js',
    },
}


const moduleConfig = (() => {
    const tsLoader = [
        { loader: 'babel-loader' },
        { loader: 'ts-loader', options: { appendTsSuffixTo: [/\.vue$/] } }
    ]
    const vueLoader = [{
        loader: 'vue-loader', options: {
            loaders: { ts: tsLoader },
            esModule: true,
        }
    }]
    return {
        resolve: {
            modules: ['./src', 'node_modules'],
            extensions: ['.js', '.ts', '.vue', '.json'],
        },
        module: {
            rules: [
                { test: /\.ts$/, use: tsLoader },
                { test: /\.vue$/, use: vueLoader },
                { test: /\.js$/, use: 'babel-loader', exclude: `${__dirname}/node_modules` }
            ]
        },
    }
})()


const polyfillConfig = {
    entry: ['polyfill/web']
}


const dataServer = process.env.HSCMAP_DATA_SERVER || 'public'
const proxySetting = require('./proxy.config')[dataServer]


if (!proxySetting) {
    throw new Error(`HSCMAP_DATA_SERVER must be one of ${Object.keys(require('./proxy.config')).join(', ')}`)
}


const defineConfig = {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(buildTarget), // for vue optimization
            },
            BUILD_SETTINGS: {
                RUN_TEST: buildTarget == 'development',
                DEBUG: buildTarget == 'development',
            }
        })
    ]
}


const devConfig = buildTarget == 'development' ? {
    devtool: 'source-map',
    devServer: {
        contentBase: dataServer == 'local' ? `${process.env.HOME}/Desktop/hscMap-htdocs` : productDir,
        proxy: proxySetting,
    },
} : {}


const optimizationConfig = buildTarget == 'production' ? {
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ mangle: false }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.(js|json)$/,
        })
    ]
} : {}


module.exports = webpackMerge(polyfillConfig, ioConfig, moduleConfig, defineConfig, devConfig, optimizationConfig)