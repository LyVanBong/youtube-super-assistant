// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      background: './background.js',
      content: './content.js',
      popup: './popup.js',
      history: './history.js',
      settings: './settings.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'popup.html', to: 'popup.html' },
          { from: 'popup.css', to: 'popup.css' },
          { from: 'history.html', to: 'history.html' },
          { from: 'history.css', to: 'history.css' },
          { from: 'settings.html', to: 'settings.html' },
          { from: 'settings.css', to: 'settings.css' },
          { from: 'icons', to: 'icons' },
        ],
      }),
      isProduction && new WebpackObfuscator({
        rotateStringArray: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
      })
    ].filter(Boolean),
    devtool: isProduction ? false : 'cheap-module-source-map',
  };
};