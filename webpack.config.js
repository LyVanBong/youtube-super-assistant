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
      settings: './settings.js',
      transcript: './transcript.js',
      activity_history: './activity_history.js',
      about: './about.js',
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
          { from: 'settings.html', to: 'settings.html' },
          { from: 'settings.css', to: 'settings.css' },
          { from: 'transcript.html', to: 'transcript.html' },
          { from: 'transcript.css', to: 'transcript.css' },
          { from: 'activity_history.html', to: 'activity_history.html' },
          { from: 'activity_history.css', to: 'activity_history.css' },
          { from: 'about.html', to: 'about.html' },
          { from: 'about.css', to: 'about.css' },
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