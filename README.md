# 🛡️ Discord Verification Bot (Xác Minh Bằng Câu Hỏi)

Bot Discord chuyên dụng hỗ trợ xác minh thành viên mới thông qua hộp thoại câu hỏi (**Discord Modal**), hỗ trợ cả chế độ **Tự động chấm điểm (AUTO)** và chế độ **Ban Quản Trị duyệt thủ công (MANUAL_REVIEW)**.

> 💡 **Bạn mới bắt đầu?** Xem ngay tài liệu [HUONG_DAN_CAI_DAT.md](file:///c:/Users/nguye/Downloads/verify/HUONG_DAN_CAI_DAT.md) để xem cách lấy ID và tùy chỉnh siêu nhanh!

---

## 🌟 Tính Năng Nổi Bật

- **Bảng xác minh Component V2 hiện đại:** Nút xác minh nằm trọn bên trong khung Embed/Container, giao diện sạch đẹp, không viền thừa, hỗ trợ Logo nhỏ góc phải, Banner lớn và chân trang.
- **Tùy chỉnh toàn bộ tin nhắn phản hồi (Reply Messages):** Dễ dàng thay đổi tin nhắn khi member làm đúng, làm sai, chờ duyệt, hoặc tin nhắn DM riêng.
- **Giao diện Modal Popup tiện lợi:** Người dùng bấm nút sẽ hiện bảng nhập câu hỏi popup native trên app Discord (cả điện thoại lẫn máy tính).
- **Cấu hình siêu đơn giản:** File `config.json` gồm các mục cơ bản bằng tiếng Việt, hỗ trợ tự động nhận dạng đáp án qua dấu phẩy.
- **Bảng điều khiển tương tác (Component Dashboard):** Dùng `/config-verify bang-dieu-khien` để chọn Role cấp, Role gỡ, Kênh duyệt, đổi màu nút, sửa nội dung và sửa câu hỏi trực quan 100%!
- **Hỗ trợ 2 chế độ linh hoạt:**
  - `TU_DONG`: Tự động so sánh câu trả lời với từ khóa quy định. Đúng $\rightarrow$ Tự cấp Role ngay.
  - `ADMIN_DUYET`: Chuyển phiếu câu trả lời vào kênh kín của Admin kèm nút bấm `[Phê duyệt]` và `[Từ chối]`.
- **Cấp Role thành viên và Gỡ Role Unverify tự động.**

---

## 📁 Cấu Trúc Thư Mục

```text
verify/
├── config.json              # File cấu hình câu hỏi, chế độ, ID role (Đã tối giản)
├── HUONG_DAN_CAI_DAT.md     # Hướng dẫn chi tiết bằng hình ảnh/bước làm cho người mới
├── package.json             # Khai báo thư viện & scripts
├── .env.example             # Mẫu biến môi trường
├── .env                     # Nơi dán Token & Client ID của bot
├── src/
│   ├── index.js             # File khởi động bot chính
│   ├── deploy-commands.js   # Script đăng ký lệnh Slash (/setup-verify)
│   ├── commands/
│   │   └── setup-verify.js  # Lệnh gửi bảng xác minh vào kênh
│   ├── interactions/
│   │   ├── buttonClick.js   # Xử lý bấm nút xác minh & nút Admin duyệt
│   │   └── modalSubmit.js   # Xử lý nộp câu hỏi xác minh
│   └── utils/
│       ├── configLoader.js  # Bộ chuẩn hóa cấu hình thông minh
│       └── embeds.js        # Tạo các mẫu Embed đẹp mắt
└── test/
    └── test-logic.js        # Bộ kiểm thử logic cấu hình & so khớp
```

---

## ⚙️ Cấu Hình Siêu Đơn Giản (`config.json`)

Bạn chỉ cần chỉnh sửa file [`config.json`](file:///c:/Users/nguye/Downloads/verify/config.json) với vài dòng đơn giản:

```json
{
  "role_id": "DÁN_ID_ROLE_THÀNH_VIÊN_VÀO_ĐÂY",
  "role_unverify": "DÁN_ID_ROLE_UNVERIFY_VÀO_ĐÂY_HOẶC_ĐỂ_TRỐNG",
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

- **`role_id`**: Dán ID Role thành viên muốn cấp.
- **`che_do`**: `"TU_DONG"` hoặc `"ADMIN_DUYET"`.
- **`danh_sach_cau_hoi`**:
  - `cau_hoi`: Nội dung câu hỏi.
  - `dap_an`: Các đáp án được tính là đúng (cách nhau bởi dấu phẩy `,`). Để trống `""` nếu không cần chấm điểm câu đó.

---

## 🚀 Khởi Động Bot

1. Điền token vào [`.env`](file:///c:/Users/nguye/Downloads/verify/.env).
2. Đăng ký lệnh Slash:
   ```powershell
   npm run deploy-commands
   ```
3. Bật bot:
   ```powershell
   npm start
   ```
4. Vào server Discord gõ `/setup-verify`.
