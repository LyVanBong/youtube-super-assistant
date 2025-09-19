// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  // Chế độ 'production' sẽ tự động minify (thu nhỏ) code
  mode: 'production',

  // Entry points: Các tệp JavaScript chính của bạn
  // Webpack sẽ bắt đầu từ các tệp này
  entry: {
    background: './background.js',
    content: './content.js',
    popup: './popup.js',
    dashboard: './dashboard.js',
  },

  // Output: Nơi các tệp đã xử lý sẽ được lưu
  output: {
    // Thư mục đầu ra
    path: path.resolve(__dirname, 'dist'),
    // Giữ nguyên tên tệp gốc
    filename: '[name].js', 
    // Xóa thư mục 'dist' trước mỗi lần build
    clean: true,
  },

  // Plugins: Nơi chúng ta thực hiện các tác vụ phức tạp
  plugins: [
    // 1. Sao chép các tệp tĩnh sang thư mục 'dist'
    new CopyPlugin({
      patterns: [
        // Sao chép manifest.json
        { from: 'manifest.json', to: 'manifest.json' },
        // Sao chép các tệp HTML
        { from: 'popup.html', to: 'popup.html' },
        { from: 'dashboard.html', to: 'dashboard.html' },
        // Sao chép toàn bộ thư mục icons
        { from: 'icons', to: 'icons' },
      ],
    }),

    // 2. Làm rối (obfuscate) các tệp JavaScript đầu ra
    // Plugin này sẽ chạy sau khi Webpack đã đóng gói xong các file JS
    new WebpackObfuscator({
      // Bật tính năng làm rối mã
      rotateStringArray: true,
      stringArray: true,
      stringArrayThreshold: 0.75,
      // Các tùy chọn khác bạn có thể tham khảo trên trang của plugin
    }, 
    // Loại trừ các tệp không cần làm rối (nếu có)
    // Ví dụ: ['exclude_this_file.js']
    []),
  ],

  // Tắt source maps trong chế độ production để tăng tính bảo mật
  devtool: false, 
};