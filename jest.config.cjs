/** @type {import('jest').Config} */
const config = {
  // Chỉ định môi trường test là node, phù hợp cho unit test logic
  testEnvironment: 'node',
  // Mẫu để tìm các file test
  // Sẽ khớp với các file .test.js hoặc .spec.js trong thư mục src
  testMatch: [
    '**/src/**/*.test.js',
    '**/src/**/*.spec.js',
  ],
  // Chuyển đổi file sử dụng Babel, cần thiết cho ES Modules (import/export)
  transform: {
    '^.+\.js$': 'babel-jest',
  },
};

module.exports = config;
