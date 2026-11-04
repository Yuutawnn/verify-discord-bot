const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const { getRawConfig, saveRawConfig, loadConfig } = require('../utils/configLoader');
const { createVerifyMessage } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-verify')
    .setDescription('Xem và chỉnh sửa cấu hình hệ thống xác minh của bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // 1. Xem cấu hình
    .addSubcommand(sub =>
      sub
        .setName('xem')
        .setDescription('Xem các thiết lập xác minh hiện tại của server')
    )
    // 2. Đặt Role xác minh
    .addSubcommand(sub =>
      sub
        .setName('role')
        .setDescription('Đặt Role sẽ cấp cho thành viên sau khi xác minh thành công')
        .addRoleOption(opt =>
          opt
            .setName('vai-tro')
            .setDescription('Chọn Role thành viên cần cấp')
            .setRequired(true)
        )
    )
    // 3. Đổi chế độ xác minh
    .addSubcommand(sub =>
      sub
        .setName('che-do')
        .setDescription('Đổi chế độ xác minh giữa Tự động và Admin duyệt')
        .addStringOption(opt =>
          opt
            .setName('loai')
            .setDescription('Chọn chế độ xác minh')
            .setRequired(true)
            .addChoices(
              { name: 'Tự động chấm đúng/sai (TU_DONG)', value: 'TU_DONG' },
              { name: 'Gửi vào kênh để Admin duyệt (ADMIN_DUYET)', value: 'ADMIN_DUYET' }
            )
        )
    )
    // 4. Đặt kênh duyệt cho Admin
    .addSubcommand(sub =>
      sub
        .setName('kenh-duyet')
        .setDescription('Đặt kênh nhận phiếu duyệt xác minh cho Admin/Mod')
        .addChannelOption(opt =>
          opt
            .setName('kenh')
            .setDescription('Chọn kênh văn bản của Admin')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    // 5. Chỉnh sửa nội dung tin nhắn bảng xác minh
    .addSubcommand(sub =>
      sub
        .setName('noi-dung')
        .setDescription('Chỉnh sửa tiêu đề, mô tả, nút bấm của bảng xác minh')
        .addStringOption(opt =>
          opt
            .setName('tieu-de')
            .setDescription('Tiêu đề bảng xác minh (Ví dụ: 🛡️ XÁC MINH THÀNH VIÊN)')
            .setMaxLength(256)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('mo-ta')
            .setDescription('Nội dung hướng dẫn xác minh (Dùng \\n để xuống dòng)')
            .setMaxLength(2000)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('chu-nut')
            .setDescription('Chữ hiển thị trên nút bấm (Ví dụ: Bắt đầu xác minh)')
            .setMaxLength(80)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('icon-nut')
            .setDescription('Biểu tượng cảm xúc trên nút (Ví dụ: ✅, 🛡️, ⭐)')
            .setMaxLength(20)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('mau-sac')
            .setDescription('Mã màu Hex cho khung Embed (Ví dụ: #5865F2, #57F287, #ED4245)')
            .setMaxLength(10)
            .setRequired(false)
        )
    )
    // 6. Thêm/Sửa câu hỏi
    .addSubcommand(sub =>
      sub
        .setName('dat-cau-hoi')
        .setDescription('Thêm hoặc chỉnh sửa câu hỏi xác minh (Tối đa 5 câu)')
        .addIntegerOption(opt =>
          opt
            .setName('so-thu-tu')
            .setDescription('Số thứ tự câu hỏi (từ 1 đến 5)')
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('cau-hoi')
            .setDescription('Nội dung câu hỏi muốn hỏi (tối đa 45 ký tự)')
            .setMaxLength(45)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('dap-an')
            .setDescription('Đáp án đúng (cách nhau bằng dấu phẩy). Để trống nếu là câu hỏi khảo sát.')
            .setRequired(false)
        )
    )
    // 7. Xóa câu hỏi
    .addSubcommand(sub =>
      sub
        .setName('xoa-cau-hoi')
        .setDescription('Xóa bớt một câu hỏi xác minh')
        .addIntegerOption(opt =>
          opt
            .setName('so-thu-tu')
            .setDescription('Số thứ tự câu hỏi muốn xóa (1 đến 5)')
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Chỉ có Quản trị viên (Administrator) mới có quyền dùng lệnh này!',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const raw = getRawConfig();

    // Đảm bảo các thuộc tính cốt lõi luôn tồn tại
    if (!raw.danh_sach_cau_hoi || !Array.isArray(raw.danh_sach_cau_hoi)) {
      raw.danh_sach_cau_hoi = [];
    }
    if (!raw.embed || typeof raw.embed !== 'object') {
      raw.embed = {};
    }

    // --- 1. LỆNH XEM CẤU HÌNH ---
    if (sub === 'xem') {
      const normalized = loadConfig();

      const roleDisplay = normalized.verifiedRoleId
        ? `<@&${normalized.verifiedRoleId}> (\`${normalized.verifiedRoleId}\`)`
        : '⚠️ *Chưa thiết lập (Dùng `/config-verify role`)*';

      const modeDisplay = normalized.mode === 'AUTO'
        ? '🤖 **Tự động (TU_DONG)** (So khớp từ khóa)'
        : '👮 **Admin duyệt (ADMIN_DUYET)** (Bấm nút trên phiếu duyệt)';

      const reviewChannelDisplay = normalized.reviewChannelId
        ? `<#${normalized.reviewChannelId}>`
        : (normalized.mode === 'MANUAL_REVIEW' ? '⚠️ *Chưa đặt kênh duyệt!*' : '*Không áp dụng ở chế độ tự động*');

      const embed = new EmbedBuilder()
        .setTitle('⚙️ Cấu Hình Hệ Thống Xác Minh Hiện Tại')
        .setColor('#5865F2')
        .addFields(
          { name: '🎭 Role sẽ cấp', value: roleDisplay, inline: false },
          { name: '🛡️ Chế độ xác minh', value: modeDisplay, inline: true },
          { name: '📋 Kênh Admin duyệt', value: reviewChannelDisplay, inline: true },
          { 
            name: '📝 Nội dung bảng xác minh', 
            value: `**Tiêu đề:** ${normalized.embed.title}\n**Nút bấm:** ${normalized.embed.buttonEmoji} ${normalized.embed.buttonLabel}\n*(Dùng \`/config-verify noi-dung\` để chỉnh sửa)*`, 
            inline: false 
          }
        );

      // Hiển thị danh sách câu hỏi
      if (normalized.questions.length === 0) {
        embed.addFields({
          name: '❓ Danh sách câu hỏi',
          value: '⚠️ *Chưa có câu hỏi nào! Dùng lệnh `/config-verify dat-cau-hoi` để thêm.*'
        });
      } else {
        const questionLines = normalized.questions.map((q, idx) => {
          const ansText = q.correctAnswers && q.correctAnswers.length > 0
            ? `\`${q.correctAnswers.join(', ')}\``
            : '*Không chấm điểm (Khảo sát/Admin đọc)*';
          return `**${idx + 1}.** ${q.label}\n👉 Đáp án đúng: ${ansText}`;
        });

        embed.addFields({
          name: `❓ Danh sách câu hỏi (${normalized.questions.length}/5)`,
          value: questionLines.join('\n\n')
        });
      }

      embed.setFooter({ text: 'Dùng /config-verify để thay đổi cài đặt bất kỳ lúc nào' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // --- 2. LỆNH ĐẶT ROLE ---
    if (sub === 'role') {
      const selectedRole = interaction.options.getRole('vai-tro');

      const botMember = interaction.guild.members.me;
      if (botMember.roles.highest.position <= selectedRole.position) {
        return interaction.reply({
          content: `⚠️ Cảnh báo: Role ${selectedRole} đang nằm **CAO HƠN hoặc BẰNG** Role của Bot!\n👉 Vui lòng vào *Server Settings -> Roles* và kéo Role của Bot lên trên ${selectedRole} để bot có quyền cấp role này.`,
          ephemeral: true
        });
      }

      raw.role_id = selectedRole.id;
      saveRawConfig(raw);

      return interaction.reply({
        content: `✅ Đã lưu thành công! Thành viên sau khi xác minh sẽ được cấp Role: ${selectedRole}`,
        ephemeral: true
      });
    }

    // --- 3. LỆNH ĐỔI CHẾ ĐỘ ---
    if (sub === 'che-do') {
      const mode = interaction.options.getString('loai');
      raw.che_do = mode;
      saveRawConfig(raw);

      const desc = mode === 'TU_DONG'
        ? '🤖 **Tự động:** Thành viên nhập đúng từ khóa đáp án sẽ được nhận role ngay lập tức.'
        : '👮 **Admin duyệt:** Câu trả lời của thành viên sẽ được gửi vào kênh Admin để duyệt bằng nút bấm.';

      return interaction.reply({
        content: `✅ Đã chuyển chế độ xác minh thành: **${mode}**\n${desc}`,
        ephemeral: true
      });
    }

    // --- 4. LỆNH ĐẶT KÊNH DUYỆT ---
    if (sub === 'kenh-duyet') {
      const channel = interaction.options.getChannel('kenh');
      raw.kenh_admin_duyet = channel.id;
      saveRawConfig(raw);

      return interaction.reply({
        content: `✅ Đã đặt kênh nhận phiếu duyệt xác minh thành: ${channel}`,
        ephemeral: true
      });
    }

    // --- 5. LỆNH CHỈNH NỘI DUNG BẢNG VERIFY ---
    if (sub === 'noi-dung') {
      const title = interaction.options.getString('tieu-de');
      const description = interaction.options.getString('mo-ta');
      const buttonLabel = interaction.options.getString('chu-nut');
      const buttonEmoji = interaction.options.getString('icon-nut');
      const color = interaction.options.getString('mau-sac');

      if (!title && !description && !buttonLabel && !buttonEmoji && !color) {
        return interaction.reply({
          content: '⚠️ Bạn chưa điền nội dung nào cần thay đổi!\n👉 Hãy chọn ít nhất 1 tùy chọn: `tieu-de`, `mo-ta`, `chu-nut`, `icon-nut`, hoặc `mau-sac`.',
          ephemeral: true
        });
      }

      if (title) raw.embed.title = title;
      if (description) raw.embed.description = description.replace(/\\n/g, '\n');
      if (buttonLabel) raw.embed.buttonLabel = buttonLabel;
      if (buttonEmoji) raw.embed.buttonEmoji = buttonEmoji;
      if (color) {
        const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        if (!hexRegex.test(color)) {
          return interaction.reply({
            content: '❌ Mã màu không hợp lệ! Vui lòng dùng định dạng Hex (ví dụ: `#5865F2`, `#57F287`, `#ED4245`).',
            ephemeral: true
          });
        }
        raw.embed.color = color;
      }

      saveRawConfig(raw);

      // Tạo giao diện xem trước
      const currentConfig = loadConfig();
      const { embed: previewEmbed, row: previewRow } = createVerifyMessage(currentConfig);

      return interaction.reply({
        content: '✅ **Đã cập nhật nội dung bảng xác minh thành công!**\n*(Nếu muốn cập nhật lại bảng xác minh trong kênh chat, Admin chỉ cần gõ lại lệnh `/setup-verify`)*.\n\n👇 **Giao diện xem trước:**',
        embeds: [previewEmbed],
        components: [previewRow],
        ephemeral: true
      });
    }

    // --- 6. LỆNH THÊM / SỬA CÂU HỎI ---
    if (sub === 'dat-cau-hoi') {
      const index = interaction.options.getInteger('so-thu-tu') - 1;
      const questionText = interaction.options.getString('cau-hoi').trim();
      const answerText = (interaction.options.getString('dap-an') || '').trim();

      while (raw.danh_sach_cau_hoi.length <= index) {
        raw.danh_sach_cau_hoi.push({ cau_hoi: '', dap_an: '' });
      }

      raw.danh_sach_cau_hoi[index] = {
        cau_hoi: questionText,
        dap_an: answerText
      };

      raw.danh_sach_cau_hoi = raw.danh_sach_cau_hoi.slice(0, 5);
      saveRawConfig(raw);

      const ansInfo = answerText ? `\`${answerText}\`` : '*Không chấm điểm (Khảo sát)*';

      return interaction.reply({
        content: `✅ Đã cập nhật **Câu hỏi ${index + 1}** thành công!\n- **Nội dung:** ${questionText}\n- **Đáp án đúng:** ${ansInfo}`,
        ephemeral: true
      });
    }

    // --- 7. LỆNH XÓA CÂU HỎI ---
    if (sub === 'xoa-cau-hoi') {
      const index = interaction.options.getInteger('so-thu-tu') - 1;

      if (index >= raw.danh_sach_cau_hoi.length) {
        return interaction.reply({
          content: `❌ Không tìm thấy câu hỏi số ${index + 1} (Hiện tại server chỉ có ${raw.danh_sach_cau_hoi.length} câu hỏi)!`,
          ephemeral: true
        });
      }

      const deleted = raw.danh_sach_cau_hoi.splice(index, 1);
      saveRawConfig(raw);

      return interaction.reply({
        content: `✅ Đã xóa câu hỏi: "${deleted[0]?.cau_hoi || ''}"!\nHiện tại còn lại **${raw.danh_sach_cau_hoi.length}** câu hỏi.`,
        ephemeral: true
      });
    }
  }
};
