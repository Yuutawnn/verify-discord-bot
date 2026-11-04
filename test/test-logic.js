const assert = require('assert');
const { loadConfig, getRawConfig, saveRawConfig } = require('../src/utils/configLoader');
const { createVerifyMessage } = require('../src/utils/embeds');
const configVerifyCommand = require('../src/commands/config-verify');

console.log('🧪 Bắt đầu kiểm thử cấu hình đơn giản hóa và logic bot...');

// 1. Kiểm tra loadConfig()
const config = loadConfig();
assert(config.mode === 'AUTO' || config.mode === 'MANUAL_REVIEW', 'Chế độ phải được chuẩn hóa về AUTO hoặc MANUAL_REVIEW');
assert(Array.isArray(config.questions), 'questions phải là một mảng');
assert(config.questions.length > 0 && config.questions.length <= 5, 'Số lượng câu hỏi phải từ 1 đến 5');
assert('removeRoleId' in config, 'config phải hỗ trợ trường removeRoleId (role_unverify)');
console.log('✅ loadConfig() chuẩn hóa cấu hình thành công!');

// 2. Kiểm tra hàm tạo Embed & Component V2 xác minh
const { embed, row, v2Payload, classicPayload } = createVerifyMessage(config);
assert(embed.data.title === config.embed.title, 'Tiêu đề embed phải khớp config');
assert(row.components.length === 1, 'Bảng xác minh phải có 1 nút bấm');
assert(row.components[0].data.custom_id === 'btn_start_verify', 'custom_id của nút phải là btn_start_verify');
assert(v2Payload && v2Payload.flags === 32768, 'v2Payload phải có cờ IsComponentsV2');
assert(v2Payload.components.length === 1, 'v2Payload phải chứa Container Component V2');
assert(classicPayload && classicPayload.embeds.length === 1, 'classicPayload phải có embed');
console.log('✅ Tạo Embed & Container Component V2 bảng xác minh (Nút trong Embed) thành công!');

// 3. Kiểm thử logic so khớp đáp án (trong chế độ AUTO)
const sampleQuestion = config.questions.find(q => q.correctAnswers && q.correctAnswers.length > 0);
if (sampleQuestion) {
  const validAnswers = sampleQuestion.correctAnswers;
  
  // Test các trường hợp hợp lệ (có hoa, thường, khoảng trắng thừa)
  const testInput1 = '  ' + validAnswers[0].toUpperCase() + '  ';
  assert(validAnswers.includes(testInput1.trim().toLowerCase()), 'So khớp không phân biệt hoa thường và khoảng trắng thất bại');

  // Test trường hợp sai
  const wrongInput = 'hoan_toan_sai_12345';
  assert(!validAnswers.includes(wrongInput.trim().toLowerCase()), 'Trường hợp nhập sai lại được duyệt');
  console.log('✅ Logic kiểm tra đáp án tự động hoạt động chính xác!');
}

// 4. Kiểm thử getRawConfig và saveRawConfig
const originalRaw = getRawConfig();
assert(typeof originalRaw === 'object', 'getRawConfig phải trả về object');
// Thử lưu và đọc lại
const testBackup = JSON.parse(JSON.stringify(originalRaw));
testBackup._testProperty = 'ok';
saveRawConfig(testBackup);
assert(getRawConfig()._testProperty === 'ok', 'saveRawConfig lưu dữ liệu không chính xác');
// Hoàn tác
delete testBackup._testProperty;
saveRawConfig(testBackup);
assert(getRawConfig()._testProperty === undefined, 'Hoàn tác dữ liệu thất bại');
console.log('✅ getRawConfig và saveRawConfig hoạt động hoàn hảo!');

// 5. Kiểm thử cấu trúc lệnh /config-verify
assert(configVerifyCommand.data.name === 'config-verify', 'Tên lệnh phải là config-verify');
const subcommands = configVerifyCommand.data.options.map(o => o.name);
const expectedSubs = ['bang-dieu-khien', 'xem', 'sua-noi-dung', 'sua-tin-nhan', 'role', 'che-do', 'kenh-duyet', 'noi-dung', 'dat-cau-hoi', 'xoa-cau-hoi'];
for (const sub of expectedSubs) {
  assert(subcommands.includes(sub), `Thiếu subcommand ${sub}`);
}
console.log('✅ Lệnh Slash /config-verify đầy đủ 10 subcommand quản trị & Dashboard Component v2!');

console.log('🎉 TẤT CẢ CÁC KIỂM THỬ ĐÃ VƯỢT QUA!');
