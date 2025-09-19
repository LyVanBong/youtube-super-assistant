// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

// Xuất ra một hàm thay vì một đối tượng tĩnh
module.exports = (env, argv) => {
  // Kiểm tra xem có phải là chế độ production hay không
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      background: './background.js',
      content: './content.js',
      popup: './popup.js',
      dashboard: './history.js',
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
          { from: 'history.html', to: 'history.html' },
          { from: 'icons', to: 'icons' },
        ],
      }),

      // Chỉ chạy WebpackObfuscator khi ở chế độ production
      isProduction && new WebpackObfuscator({
        rotateStringArray: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
      })
      // Lọc ra các plugin không hợp lệ (giá trị false)
    ].filter(Boolean),

    // Bật source maps trong chế độ development để dễ debug
    // Tắt trong chế độ production
    devtool: isProduction ? false : 'cheap-module-source-map',
  };
};