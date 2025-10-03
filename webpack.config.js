// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      background: './src/background/background.js',
      content: './src/content/content.js',
      popup: './src/popup/popup.js',
      settings: './src/pages/settings/settings.js',
      transcript: './src/pages/transcript/transcript.js',
      activity_history: './src/pages/activity_history/activity_history.js',
      about: './src/pages/about/about.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/popup/popup.html', to: 'popup.html' },
          { from: 'src/popup/popup.css', to: 'popup.css' },
          { from: 'src/pages/settings/settings.html', to: 'settings.html' },
          { from: 'src/pages/settings/settings.css', to: 'settings.css' },
          { from: 'src/pages/transcript/transcript.html', to: 'transcript.html' },
          { from: 'src/pages/transcript/transcript.css', to: 'transcript.css' },
          { from: 'src/pages/activity_history/activity_history.html', to: 'activity_history.html' },
          { from: 'src/pages/activity_history/activity_history.css', to: 'activity_history.css' },
          { from: 'src/pages/about/about.html', to: 'about.html' },
          { from: 'src/pages/about/about.css', to: 'about.css' },
          { from: 'src/icons', to: 'icons' },
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