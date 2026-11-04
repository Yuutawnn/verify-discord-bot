const fs = require('fs');
const path = require('path');

function findConfigPath() {
  const candidates = [
    path.join(process.cwd(), 'config.json'),
    path.join(__dirname, '../config.json'),
    path.join(__dirname, '../../config.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(process.cwd(), 'config.json');
}

/**
 * Đọc và chuẩn hóa cấu hình từ config.json
 * Giúp người dùng có thể cấu hình cực kỳ đơn giản bằng tiếng Việt hoặc tiếng Anh.
 */
function loadConfig() {
  const configPath = findConfigPath();
  let raw = {};

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      raw = JSON.parse(content);
    }
  } catch (error) {
    console.error('❌ Lỗi khi đọc file config.json:', error);
  }

  // 1. Chuẩn hóa ID Role
  const verifiedRoleId = raw.role_id || raw.verifiedRoleId || raw.ROLE_ID || '';
  const removeRoleId = raw.removeRoleId || raw.remove_role_id || '';

  // 2. Chuẩn hóa Chế độ (Tự động hoặc Admin duyệt)
  let mode = 'AUTO';
  const rawMode = String(raw.che_do || raw.mode || '').toUpperCase();
  if (rawMode === 'ADMIN_DUYET' || rawMode === 'MANUAL_REVIEW' || rawMode === 'DUYET') {
    mode = 'MANUAL_REVIEW';
  }

  // 3. Chuẩn hóa Kênh
  const reviewChannelId = raw.kenh_admin_duyet || raw.reviewChannelId || '';
  const logChannelId = raw.kenh_log || raw.logChannelId || '';

  // 4. Chuẩn hóa Embed & Nút bấm
  const embed = {
    title: raw.embed?.title || raw.tieu_de || '🛡️ XÁC MINH THÀNH VIÊN',
    description: raw.embed?.description || raw.loi_chao || 
      'Chào mừng bạn đến với server!\n\nĐể mở khóa các kênh và trò chuyện cùng mọi người, vui lòng bấm nút **Bắt đầu xác minh** bên dưới và trả lời câu hỏi xác thực.',
    color: raw.embed?.color || raw.mau_sac || '#5865F2',
    buttonLabel: raw.embed?.buttonLabel || raw.chu_nut_bam || 'Bắt đầu xác minh',
    buttonEmoji: raw.embed?.buttonEmoji || raw.icon_nut || '✅'
  };

  // 5. Chuẩn hóa Danh sách câu hỏi
  let rawQuestions = raw.danh_sach_cau_hoi || raw.questions || raw.cau_hoi || [];
  
  if (!Array.isArray(rawQuestions)) {
    if (typeof rawQuestions === 'object') {
      rawQuestions = [rawQuestions];
    } else if (typeof rawQuestions === 'string') {
      rawQuestions = [{ cau_hoi: rawQuestions, dap_an: raw.dap_an || raw.answers || '' }];
    }
  }

  const questions = rawQuestions.slice(0, 5).map((q, idx) => {
    const questionText = q.cau_hoi || q.question || q.label || `Câu hỏi ${idx + 1}`;
    
    let correctAnswers = [];
    const rawAnswers = q.dap_an ?? q.answers ?? q.correctAnswers ?? q.answer ?? '';
    if (Array.isArray(rawAnswers)) {
      correctAnswers = rawAnswers.map(a => String(a).trim().toLowerCase()).filter(Boolean);
    } else if (typeof rawAnswers === 'string' && rawAnswers.trim() !== '') {
      correctAnswers = rawAnswers.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    }

    return {
      id: q.id || `q_${idx + 1}`,
      label: String(questionText).slice(0, 45),
      placeholder: q.placeholder || q.goi_y || 'Nhập câu trả lời của bạn...',
      style: q.style || (correctAnswers.length > 0 ? 'Short' : 'Paragraph'),
      required: q.required !== false,
      minLength: q.minLength || 1,
      maxLength: q.maxLength || (correctAnswers.length > 0 ? 100 : 300),
      correctAnswers: correctAnswers
    };
  });

  // 6. Tin nhắn phản hồi
  const messages = {
    alreadyVerified: raw.messages?.alreadyVerified || raw.thong_bao_da_verify || '❌ Bạn đã được xác minh trước đó rồi!',
    successAuto: raw.messages?.successAuto || raw.thong_bao_thanh_cong || '🎉 Chúc mừng bạn đã trả lời chính xác và được cấp quyền thành viên!',
    failedAuto: raw.messages?.failedAuto || raw.thong_bao_that_bai || '❌ Câu trả lời của bạn chưa chính xác. Vui lòng đọc lại nội quy và thử lại!',
    submittedReview: raw.messages?.submittedReview || '📋 Câu trả lời của bạn đã được gửi tới Ban Quản Trị. Vui lòng chờ xét duyệt!',
    approvedDirect: raw.messages?.approvedDirect || '🎉 Yêu cầu xác minh của bạn đã được Admin phê duyệt thành công!',
    rejectedDirect: raw.messages?.rejectedDirect || '⚠️ Yêu cầu xác minh của bạn đã bị từ chối.'
  };

  return {
    mode,
    verifiedRoleId,
    removeRoleId,
    reviewChannelId,
    logChannelId,
    embed,
    questions,
    messages
  };
}

/**
 * Lấy nội dung gốc chưa chuẩn hóa của file config.json
 */
function getRawConfig() {
  const configPath = findConfigPath();
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Lỗi khi đọc file config.json:', error);
    return {};
  }
}

/**
 * Ghi đè nội dung mới vào file config.json
 */
function saveRawConfig(data) {
  const configPath = findConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { loadConfig, getRawConfig, saveRawConfig };
