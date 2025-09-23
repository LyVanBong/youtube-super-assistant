# YouTube Super Assistant - Trợ lý YouTube Siêu Việt

Đây là một tiện ích mở rộng dành cho trình duyệt Chrome được thiết kế để trở thành trợ lý ảo của bạn trên YouTube. Công cụ này sử dụng trí tuệ nhân tạo (AI) để nâng cao trải nghiệm xem, tương tác và quản lý nội dung của bạn.

## ✨ Các tính năng chính

### 1\. Trung tâm AI đa năng

  - **Tạo bình luận thông minh:** Dựa vào nội dung và lời thoại video, AI có thể tạo ra những bình luận sâu sắc và phù hợp. Tiện ích tự động lấy dấu thời gian (timestamp) hiện tại của video để giúp bình luận trở nên cụ thể hơn.
  - **Tóm tắt video:** Nhanh chóng nắm bắt nội dung chính của video bằng tính năng tóm tắt do AI thực hiện. Kết quả sẽ được tự động sao chép vào clipboard.
  - **Trả lời bình luận:** AI giúp bạn tạo ra các câu trả lời thông minh cho bình luận của người khác, giúp tăng cường tương tác với cộng đồng.
  - **Sao chép lời thoại (Transcript):** Dễ dàng sao chép toàn bộ lời thoại của video chỉ với một cú nhấp chuột từ popup của tiện ích.

### 2\. Tự động hóa thông minh

  - **Tự động bình luận:** Khi xem video đến một ngưỡng thời gian được thiết lập (ví dụ: 80%), tiện ích có thể tự động đăng một bình luận do AI tạo ra.
  - **Ngăn chặn bình luận trùng lặp:** Tính năng tự động sẽ không hoạt động nếu video đó đã có trong lịch sử bình luận của bạn, tránh việc spam trên cùng một video.
  - **Kiểm soát linh hoạt:** Bạn có toàn quyền bật/tắt tính năng tự động thông qua cài đặt nhanh trong popup hoặc các nút điều khiển nổi trên trang.

### 3\. Công cụ & Giao diện tích hợp

  - **Các nút điều khiển nổi:** Khi xem video, một bộ nút điều khiển tiện dụng sẽ xuất hiện, bao gồm:
      - **Cuộn lên đầu trang (⬆️)**
      - **Cuộn đến phần bình luận (💬)**
      - **Xem lời thoại (📝):** Mở trang xem lời thoại và thông tin chi tiết của video.
      - **Tóm tắt video (📄):** Kích hoạt nhanh tính năng tóm tắt.
      - **Bật/Tắt tự động (🤖/🚫):** Dễ dàng kích hoạt hoặc vô hiệu hóa chế độ tự động.
  - **Tích hợp trực tiếp vào YouTube:**
      - **Nút "Bình luận AI":** Được thêm vào khung bình luận chính, cho phép bạn tạo bình luận AI chỉ với một cú nhấp chuột.
      - **Nút "Phản hồi AI":** Xuất hiện trong khung trả lời bình luận, giúp bạn tương tác nhanh chóng.

### 4\. Trung tâm Hoạt động & Xem Lời thoại

  - **Quản lý lịch sử toàn diện:** Tiện ích có một "Trung tâm Hoạt động" riêng để theo dõi mọi hoạt động của bạn, bao gồm:
      - **Lịch sử Bình luận:** Lưu lại các bình luận đã tạo kèm link video, nội dung, timestamp và thời gian thực.
      - **Lịch sử Tóm tắt:** Lưu lại các bản tóm tắt video đã tạo.
      - **Lịch sử Lời thoại:** Lưu lại các video bạn đã xem lời thoại.
  - **Trang xem Lời thoại & Thông tin chi tiết:**
      - Một trang chuyên dụng để xem toàn bộ lời thoại (transcript) của video.
      - Hiển thị thông tin chi tiết: video player, tiêu đề, kênh, lượt xem, lượt thích, mô tả, tags...
      - Lời thoại có dấu thời gian (timestamp) có thể nhấp vào để chuyển đến đoạn tương ứng trong video.
      - Hỗ trợ tìm kiếm và nhiều tùy chọn sao chép tiện lợi.

### 5\. Tùy chỉnh nâng cao

  - **Ngôn ngữ AI:** Chọn ngôn ngữ bạn muốn AI sử dụng để tạo bình luận và tóm tắt.
  - **Prompt tùy chỉnh:** Tự tạo chỉ dẫn riêng cho AI bằng cách sử dụng các biến như `{videoTitle}`, `{videoTranscript}` để kết quả đầu ra phù hợp hơn với phong cách của bạn.
  - **Ngưỡng kích hoạt tự động:** Tùy chỉnh khoảng thời gian (tính theo % thời lượng video) mà bạn muốn tính năng tự động bình luận được kích hoạt.
  - **Quản lý API Key:** Cung cấp API Key và Access Token của riêng bạn để sử dụng các dịch vụ AI.

## 🚀 Hướng dẫn sử dụng

1.  **Cài đặt tiện ích:** Sau khi cài đặt, biểu tượng của tiện ích sẽ xuất hiện trên thanh công cụ của Chrome.
2.  **Sử dụng qua Popup:**
      * Mở một video YouTube bất kỳ.
      * Nhấp vào biểu tượng tiện ích để mở popup.
      * Sử dụng các nút: **✨ Tạo BL**, **📄 Tóm tắt**, **📝 Chép Lời thoại**.
      * Vào **📜 Trung tâm Hoạt động** để xem lịch sử hoặc **⚙️ Mở Cài đặt** để tùy chỉnh sâu hơn.
3.  **Sử dụng trực tiếp trên trang YouTube:**
      * **Tạo bình luận mới:** Cuộn xuống phần bình luận và nhấn nút màu xanh **"Bình luận AI"**.
      * **Trả lời bình luận:** Nhấn vào nút "Phản hồi" dưới một bình luận bất kỳ, sau đó nhấn nút **"Phản hồi AI"**.
      * **Điều khiển nhanh:** Sử dụng các nút bấm nổi ở góc dưới bên phải màn hình.

## 📦 Hướng dẫn Build dự án với Webpack

Để đóng gói tiện ích này từ mã nguồn, bạn cần có Node.js và npm đã được cài đặt.

### 1\. Cài đặt các gói phụ thuộc

Mở terminal hoặc command prompt trong thư mục gốc của dự án và chạy lệnh sau để cài đặt tất cả các `devDependencies` cần thiết được định nghĩa trong file `package.json`:

```bash
npm install
```

### 2\. Build cho môi trường Development (Phát triển)

Nếu bạn đang trong quá trình phát triển và muốn Webpack tự động build lại dự án mỗi khi có thay đổi trong mã nguồn, hãy sử dụng lệnh sau:

```bash
npm run dev
```

Lệnh này sẽ tạo ra một thư mục `dist` chứa các file đã được đóng gói nhưng chưa được làm rối (obfuscate), giúp bạn dễ dàng gỡ lỗi (debug). Cờ `--watch` sẽ theo dõi sự thay đổi của file.

### 3\. Build cho môi trường Production (Sản phẩm)

Khi bạn đã sẵn sàng để phát hành tiện ích, hãy chạy lệnh sau:

```bash
npm run build
```

Lệnh này sẽ thực hiện các công việc sau:

  * Đóng gói tất cả các file JavaScript cần thiết.
  * Sao chép các file tĩnh (HTML, CSS, manifest.json, icons) vào thư mục `dist`.
  * Áp dụng **WebpackObfuscator** để làm rối mã nguồn JavaScript, giúp bảo vệ mã nguồn của bạn khi phát hành.
  * Tối ưu hóa các file cho môi trường production.

Sau khi chạy lệnh này, toàn bộ tiện ích sẵn sàng để sử dụng sẽ nằm trong thư mục `dist`. Bạn có thể nén thư mục này thành file `.zip` để tải lên Chrome Web Store hoặc tải trực tiếp thư mục này vào Chrome ở chế độ nhà phát triển (Developer Mode).