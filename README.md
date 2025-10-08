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

---

## 🏛️ Kiến trúc Dự án (Project Architecture)

Dự án này tuân theo một kiến trúc hiện đại, có khả năng mở rộng cao, lấy cảm hứng từ **Feature-Sliced Design (FSD)**. Triết lý cốt lõi là phân tách mã nguồn theo các lát cắt tính năng (feature slices) và phân lớp (layers) một cách rõ ràng.

### Nguyên tắc chính

1.  **Phân lớp (Layered Architecture):** Mã nguồn được chia thành các lớp có sự phụ thuộc một chiều. Lớp cao hơn có thể sử dụng lớp thấp hơn, nhưng không được ngược lại. Điều này giúp giảm sự耦合 (coupling) và tăng tính module hóa.
2.  **Phân lát theo tính năng (Sliced by Feature):** Thay vì nhóm file theo loại (ví dụ: `components`, `hooks`), chúng ta nhóm chúng theo chức năng nghiệp vụ mà chúng phục vụ.

### Cấu trúc thư mục

Đây là cấu trúc thư mục chính trong `src/`:

```
src/
├── app/         # Lớp cao nhất, khởi tạo ứng dụng
├── pages/       # Các trang hoàn chỉnh (ví dụ: trang Cài đặt)
├── features/    # Các chức năng nghiệp vụ người dùng có thể tương tác
├── entities/    # Các thực thể nghiệp vụ cốt lõi (ví dụ: Video, Comment)
└── shared/      # Mã nguồn chung, có thể tái sử dụng ở bất kỳ đâu
```

--- 

### Chức năng của từng lớp

#### 📂 `app`
Lớp cao nhất, chịu trách nhiệm khởi tạo toàn bộ ứng dụng dashboard.
- **Chứa:**
  - `index.tsx`: Điểm vào (entry point) chính của ứng dụng React, thiết lập layout và routing.
  - `styles/`: Chứa các file CSS toàn cục.
  - `providers/`: (Dành cho tương lai) Chứa các React Context Provider (ví dụ: Theme, Auth).
- **Phụ thuộc:** Có thể sử dụng tất cả các lớp bên dưới.

#### 📂 `pages`
Đại diện cho một màn hình hoàn chỉnh mà người dùng thấy trên dashboard.
- **Chứa:** Các thư mục con, mỗi thư mục là một trang (ví dụ: `settings/`, `history/`). Một trang được lắp ráp từ các `features` và `entities`.
- **Phụ thuộc:** Có thể sử dụng `features`, `entities`, và `shared`.
- **Quy tắc:** Không được phép import từ `app` hoặc từ một `page` khác.

#### 📂 `features`
Một phần chức năng nghiệp vụ mà người dùng có thể tương tác.
- **Ví dụ:** `AiActions` (các nút tạo bình luận/tóm tắt AI), `HistoryFilter` (bộ lọc lịch sử).
- **Chứa:** Các component React, hook, và logic cần thiết cho một tính năng cụ thể.
- **Phụ thuộc:** Có thể sử dụng `entities` và `shared`.
- **Quy tắc:** Không được phép import từ `app` hoặc `pages`.

#### 📂 `entities`
Các thực thể nghiệp vụ cốt lõi của ứng dụng. Chúng không có logic nghiệp vụ phức tạp mà chỉ định nghĩa dữ liệu và cách hiển thị.
- **Ví dụ:** `History` (định nghĩa một `HistoryItem` và cách nó hiển thị trong bảng).
- **Chứa:**
  - `ui/`: Các component để hiển thị thực thể (ví dụ: `HistoryTable`).
  - `model.ts`: Các interface TypeScript định nghĩa cấu trúc dữ liệu.
- **Phụ thuộc:** Chỉ có thể sử dụng `shared`.

#### 📂 `shared`
Lớp thấp nhất, chứa mọi thứ có thể tái sử dụng và hoàn toàn độc lập với logic nghiệp vụ.
- **Chứa:**
  - `api/`: Các hàm giao tiếp với API bên ngoài.
  - `lib/`: Các hàm tiện ích chung, các custom hook có thể tái sử dụng.
  - `ui/`: Bộ UI Kit chung của ứng dụng (ví dụ: `Layout`, `Sidebar`, `Card`, `Button`).
- **Phụ thuộc:** Không phụ thuộc vào bất kỳ lớp nào khác trong dự án.

### Luồng hoạt động (Ví dụ)

1.  Người dùng truy cập `dashboard.html`.
2.  `app/index.tsx` được chạy. Nó render ra `shared/ui/Layout`.
3.  Dựa trên URL hash (ví dụ: `#history`), `app/index.tsx` quyết định render `pages/history`.
4.  `pages/history` lấy dữ liệu từ `chrome.storage` (sử dụng hook từ `shared/lib`) và có thể hiển thị một `features/HistoryFilter`.
5.  Dữ liệu lịch sử được truyền xuống `entities/History/ui/HistoryTable` để hiển thị.
6.  Tất cả các component trên đều sử dụng các component cơ bản từ `shared/ui` như `Card`, `Button`.

Kiến trúc này giúp dự án trở nên dễ đoán, dễ tìm kiếm và cực kỳ dễ dàng để thêm các tính năng mới mà không làm ảnh hưởng đến các phần khác.
