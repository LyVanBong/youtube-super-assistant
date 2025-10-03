// webpack.config.js
const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const srcPath = path.resolve(__dirname, 'src');

  const entryPoints = {
    'background/background': './src/background/background.js',
    'content/content': './src/content/content.js',
  };

  const copyPatterns = [
    { from: 'src/manifest.json', to: 'manifest.json' },
    { from: 'src/icons', to: 'icons' },
  ];

  // Function to get subdirectories
  const getDirectories = (source) =>
    fs.readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  // Process 'popup'
  const popupPath = path.join(srcPath, 'popup');
  if (fs.existsSync(popupPath)) {
    entryPoints['popup/popup'] = './src/popup/popup.js';
    copyPatterns.push(
      { from: 'src/popup/popup.html', to: 'popup/popup.html' },
      { from: 'src/popup/popup.css', to: 'popup/popup.css' }
    );
  }

  // Process 'pages'
  const pagesDir = path.join(srcPath, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageNames = getDirectories(pagesDir);
    pageNames.forEach(pageName => {
      const pageJsPath = `./src/pages/${pageName}/${pageName}.js`;
      const pageHtmlPath = `src/pages/${pageName}/${pageName}.html`;
      const pageCssPath = `src/pages/${pageName}/${pageName}.css`;

      if (fs.existsSync(path.resolve(__dirname, pageJsPath))) {
        entryPoints[`pages/${pageName}/${pageName}`] = pageJsPath;
      }
      if (fs.existsSync(path.resolve(__dirname, pageHtmlPath))) {
        copyPatterns.push({ from: pageHtmlPath, to: `pages/${pageName}/${pageName}.html` });
      }
      if (fs.existsSync(path.resolve(__dirname, pageCssPath))) {
        copyPatterns.push({ from: pageCssPath, to: `pages/${pageName}/${pageName}.css` });
      }
    });
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry: entryPoints,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    plugins: [
      new CopyPlugin({
        patterns: copyPatterns,
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