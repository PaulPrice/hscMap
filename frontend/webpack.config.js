const merge = require('webpack-merge')


const productDir = `${__dirname}/dist`


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


const baseConfig = {
    entry: [
        'file-loader?name=index.html!./src/index.html',
        './src/main.ts',
    ],
    output: {
        path: productDir,
        filename: 'bundle.js',
    },
    module: {
        rules: [
            { test: /\.ts$/, use: tsLoader },
            { test: /\.vue$/, use: vueLoader },
        ]
    },
}


const polyfills = {
    entry: [
        'babel-polyfill',
        'whatwg-fetch',
    ]
}


const develConfig = {
    devtool: 'source-map',
    devServer: { contentBase: productDir }
}


module.exports = merge(polyfills, baseConfig, develConfig)