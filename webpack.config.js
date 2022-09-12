
// const webpack = require('webpack');
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname((new URL(import.meta.url)).pathname);

const config = {
    mode: 'development',
    entry: './client/client.js',
    output: {
        path: path.resolve(__dirname, 'built'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: [/\.svg$/, /.gif$/],
                use: 'file-loader'
            }
        ]
    },
    resolve: {
        extensions: [
            '.tsx',
            '.ts',
            '.js'
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: 'body',
            template: 'client/index.html'
        })
    ]
};

export default config;
