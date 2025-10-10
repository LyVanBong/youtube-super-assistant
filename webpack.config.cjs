const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      'background/background': './src/background/index.ts',
      'content/content': './src/content/index.ts',
      'popup/popup': './src/features/popup/Popup.tsx',
      'dashboard': './src/app/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/icons', to: 'icons' },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/shared/template.html',
        filename: 'popup/popup.html',
        chunks: ['popup/popup'],
      }),
      new HtmlWebpackPlugin({
        template: './src/shared/template.html',
        filename: 'dashboard.html',
        chunks: ['dashboard'],
      }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
  };
};