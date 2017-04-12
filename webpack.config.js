const webpack = require('webpack')
const tsconfig = require('./tsconfig.json')
const fs = require('fs')
const _ = require('underscore')


const atOptions = { // awsome-typescript-loader
    useBabel: true,
    useCache: true
}


const config = {
    entry: "./src/app/main",
    output: {
        path: `${__dirname}/dist`,
        filename: "main.js"
    },
    resolve: {
        extensions: ['.ts', '.js', '.vue'],
        modules: [tsconfig.compilerOptions.baseUrl, "./node_modules"],
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
            { test: /\.ts$/, loader: 'awesome-typescript-loader', options: atOptions },
            {
                test: /\.vue$/, loader: 'vue-loader', options: {
                    esModule: false,
                    loaders: {
                        'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
                        'typescript': `awesome-typescript-loader?${JSON.stringify(atOptions)}`,
                    }
                }
            },
        ],
    },
    devServer: {
        proxy: require('./devel/proxy.js'),
        contentBase: "./dist",
    }
}


const imageServer = process.env.HSCMAP_IMAGE_SERVER || 'internal_release'
const define = {
    'process.env': _.mapObject({
        HSCMAP_IMAGE_SERVER: imageServer,
        NODE_ENV: process.env.NODE_ENV,
    }, (v, k) => JSON.stringify(v))
}
!(config.plugins || (config.plugins = [])).push(
    new webpack.DefinePlugin(define)
)


if (process.env.NODE_ENV != 'production') {
    config.devtool = 'source-map'
}
else {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: false }))
}


module.exports = config