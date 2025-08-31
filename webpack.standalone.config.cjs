const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/browser-standalone.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.browser.json'
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "crypto": false,
      "fs": false,
      "path": false,
      "os": false,
      "stream": false,
      "util": false,
      "child_process": false,
      "net": false,
      "tls": false,
      "buffer": false,
      "events": false,
      "url": false
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global': 'globalThis',
    }),
  ],
  output: {
    filename: 'standalone.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: {
      name: 'AzureVoiceLive',
      type: 'umd',
    },
    globalObject: 'this',
    clean: false,
  },
  optimization: {
    minimize: true,
  }
};