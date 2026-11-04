# 📖 HƯỚNG DẪN CÀI ĐẶT & TÙY CHỈNH BOT VERIFY SIÊU ĐƠN GIẢN

Tài liệu này hướng dẫn bạn cài đặt bot xác minh Discord nhanh chóng và dễ hiểu nhất, ngay cả khi bạn chưa từng lập trình bot trước đây.

---

## 🎯 Phần 1: Tùy Chỉnh File `config.json` (Chỉ cần 3 mục)

Mở file **`config.json`** trong thư mục. Bạn sẽ thấy giao diện cực kỳ ngắn gọn như sau:

```json
{
  "role_id": "DÁN_ID_ROLE_THÀNH_VIÊN_VÀO_ĐÂY",

  "che_do": "TU_DONG",

  "danh_sach_cau_hoi": [
    {
      "cau_hoi": "Mật khẩu xác minh trong nội quy là gì?",
      "dap_an": "dong y, đồng ý, pass123"
    },
    {
      "cau_hoi": "Bạn biết đến server qua đâu?",
      "dap_an": ""
    }
  ],

  "kenh_admin_duyet": ""
}
```

### Giải thích từng dòng:
1. **`role_id`**: Dán ID của Role mà bạn muốn cấp cho thành viên sau khi họ xác minh thành công.
2. **`che_do`**:
   - `"TU_DONG"`: Người dùng gõ đúng từ khóa trong `dap_an` $\rightarrow$ Bot tự cấp role ngay lập tức!
   - `"ADMIN_DUYET"`: Người dùng gửi câu trả lời $\rightarrow$ Bot gửi phiếu vào kênh của Admin để bạn bấm nút `[Duyệt]` hoặc `[Từ chối]`.
3. **`danh_sach_cau_hoi`**:
   - `"cau_hoi"`: Tiêu đề câu hỏi muốn hỏi.
   - `"dap_an"`: Các từ khóa đúng (viết hoa/thường đều được, cách nhau bằng dấu phẩy `,`). **Nếu câu hỏi dạng khảo sát không cần chấm điểm, chỉ cần để trống: `""`**.
4. **`kenh_admin_duyet`**: Dán ID kênh riêng của Admin (chỉ cần điền nếu bạn chọn chế độ `"ADMIN_DUYET"`).

---

## 🖱️ Phần 2: Cách Lấy ID Trong Discord (30 Giây)

Mặc định Discord ẩn các dãy số ID, bạn chỉ cần bật lên 1 lần duy nhất:

### Bước 1: Bật chế độ Nhà phát triển (Developer Mode)
1. Mở Discord $\rightarrow$ Bấm biểu tượng bánh răng **Cài đặt người dùng (User Settings)** (góc dưới bên trái, cạnh tên bạn).
2. Kéo xuống mục **Nâng cao (Advanced)**.
3. Gạt bật **Chế độ nhà phát triển (Developer Mode)**.

### Bước 2: Lấy các ID bạn cần
- **Lấy ID Role:** Vào *Cài đặt máy chủ (Server Settings)* $\rightarrow$ *Vai trò (Roles)* $\rightarrow$ Chuột phải vào Role cần cấp $\rightarrow$ Bấm **Sao chép ID vai trò (Copy Role ID)**.
- **Lấy ID Kênh:** Chuột phải vào tên kênh $\rightarrow$ Bấm **Sao chép ID kênh (Copy Channel ID)**.
- **Lấy ID Server:** Chuột phải vào ảnh đại diện/tên Server ở cột ngoài cùng bên trái $\rightarrow$ Bấm **Sao chép ID máy chủ (Copy Server ID)**.

---

## 🔒 Phần 3: Cách Thiết Lập Kênh Trên Server Để Hoạt Động Chuẩn

Để người mới vào chỉ thấy kênh xác minh và không xem được các kênh khác:

1. **Tạo Role thành viên:**
   - Đặt tên ví dụ: `Thành Viên` hoặc `Member`.
2. **Cài đặt quyền cho `@everyone` (Người mới chưa verify):**
   - Vào kênh `#xac-thuc`: Cho phép `@everyone` có quyền **Xem kênh (View Channel)** và **Đọc lịch sử tin nhắn (Read History)**.
   - Với **TẤT CẢ các kênh còn lại** (chat chung, voice, thông báo,...): Tắt quyền **Xem kênh (View Channel)** của `@everyone`.
3. **Cài đặt quyền cho Role `Member`:**
   - Cho phép Role `Member` quyền **Xem kênh (View Channel)** ở các kênh bạn muốn họ trò chuyện.
4. Khi người mới vào server $\rightarrow$ Họ chỉ thấy duy nhất kênh `#xac-thuc`. Sau khi trả lời câu hỏi $\rightarrow$ Nhận Role `Member` $\rightarrow$ Tự động mở toàn bộ server!

---

## ⚠️ Lưu Ý Sống Còn: Vị Trí Role Của Bot

> [!WARNING]
> Nếu bạn thấy bot chạy bình thường nhưng khi verify xong bị báo lỗi không cấp được role, **99% là do vị trí Role:**
>
> 1. Vào **Cài đặt máy chủ** $\rightarrow$ **Vai trò (Roles)**.
> 2. Tìm role có tên của Bot.
> 3. **Nhấn giữ chuột và kéo Role của Bot lên TRÊN Role `Member`**.
>
> *(Discord có luật bảo mật: Bot chỉ có thể cấp các role nằm BÊN DƯỚI role cao nhất của nó).*

---

## 🛠️ Phần 5: Bảng Điều Khiển Tương Tác Component v2 (`/config-verify`)

Giờ đây bạn không cần nhớ cú pháp lệnh hay copy dãy số ID phức tạp nữa. Chỉ cần gõ:
```text
/config-verify bang-dieu-khien
```
*(Hoặc gõ `/config-verify xem`)* $\rightarrow$ Bot sẽ gửi một **Bảng điều khiển tương tác (Component Dashboard)** gồm đầy đủ Dropdown và Nút bấm:

1. **Menu chọn Role (Dropdown):** Bấm vào danh sách role của server $\rightarrow$ Chọn Role thành viên cần cấp (Tự động lưu và kiểm tra quyền).
2. **Menu chọn Kênh duyệt (Dropdown):** Bấm chọn kênh văn bản Admin duyệt từ danh sách kênh của server.
3. **Nút `[📝 Sửa Nội Dung & Ảnh]`:** Bật Popup để bạn sửa Tiêu đề, nhấn phím Enter xuống dòng lời chào, dán link ảnh Banner và Logo.
4. **Nút `[🛡️ Đổi Chế Độ]`:** Nhấn 1 chạm để chuyển đổi qua lại giữa `Tự Động (AUTO)` và `Admin Duyệt (MANUAL_REVIEW)`.
5. **Nút `[❓ Sửa Câu Hỏi]`:** Bật Popup để sửa câu hỏi 1, câu hỏi 2 và đáp án tương ứng.
6. **Nút `[🚀 Gửi Bảng Xác Minh]`:** Gửi ngay bảng xác minh hoàn chỉnh ra kênh chat mà không cần gõ thêm lệnh nào khác!

---

## 🚀 Phần 4: Các Bước Khởi Chạy

1. Mở file `.env` điền Token bot và Client ID:
   ```env
   DISCORD_TOKEN=MTA4xxxxxxxx...
   CLIENT_ID=134xxxxxxxx...
   GUILD_ID=120xxxxxxxx...
   ```
2. Mở cửa sổ dòng lệnh (Terminal/PowerShell) tại thư mục này:
   ```powershell
   # 1. Đăng ký lệnh Slash
   npm run deploy-commands

   # 2. Bật bot
   npm start
   ```
3. Trong Discord, vào kênh `#xac-thuc` và gõ:
   ```text
   /setup-verify
   ```
4. Bảng xác minh kèm nút bấm xanh **[Bắt đầu xác minh]** sẽ xuất hiện!
