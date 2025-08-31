const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/browser.ts',
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
    },
    alias: {
      // Ensure we don't bundle Node.js adapters
      '../adapters/node': false,
      './adapters/node': false,
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global': 'globalThis',
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^(mic|speaker|ws)$/,
      contextRegExp: /adapters/,
    }),
  ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: {
      name: 'AzureVoiceLive',
      type: 'umd',
    },
    globalObject: 'this',
    clean: true,
  },
  externals: {
    '@azure/identity': {
      commonjs: '@azure/identity',
      commonjs2: '@azure/identity',
      amd: '@azure/identity',
      root: 'AzureIdentity'
    },
    'react': {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM'
    }
  },
  optimization: {
    minimize: true,
  }
};