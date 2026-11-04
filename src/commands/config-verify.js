const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const { getRawConfig, saveRawConfig, loadConfig } = require('../utils/configLoader');
const { createVerifyMessage, createDashboard } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-verify')
    .setDescription('Xem và chỉnh sửa cấu hình hệ thống xác minh của bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // 1. Mở Bảng điều khiển tương tác (Component v2)
    .addSubcommand(sub =>
      sub
        .setName('bang-dieu-khien')
        .setDescription('Mở Bảng điều khiển tương tác (Component v2) với menu chọn Role, Kênh và nút bấm')
    )
    // 2. Xem cấu hình dạng tóm tắt
    .addSubcommand(sub =>
      sub
        .setName('xem')
        .setDescription('Xem các thiết lập xác minh hiện tại của server')
    )
    // 3. Mở Popup Modal để sửa nội dung (Xuống dòng tự nhiên bằng phím Enter)
    .addSubcommand(sub =>
      sub
        .setName('sua-noi-dung')
        .setDescription('Mở hộp thoại chỉnh sửa trực quan (Nhấn phím Enter xuống dòng, thêm link ảnh)')
    )
    // 4. Đặt Role xác minh
    .addSubcommand(sub =>
      sub
        .setName('role')
        .setDescription('Cài đặt Role sẽ cấp và Role sẽ gỡ (Unverify) khi xác minh')
        .addRoleOption(opt =>
          opt
            .setName('vai-tro')
            .setDescription('Chọn Role thành viên cần cấp khi xác minh')
            .setRequired(false)
        )
        .addRoleOption(opt =>
          opt
            .setName('role-unverify')
            .setDescription('Chọn Role cần GỠ khi xác minh (Role chưa xác minh / Unverified)')
            .setRequired(false)
        )
    )
    // 5. Đổi chế độ xác minh
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
    // 6. Đặt kênh duyệt cho Admin
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
    // 7. Chỉnh sửa nhanh bằng option (Thêm link ảnh Banner, ảnh Logo)
    .addSubcommand(sub =>
      sub
        .setName('noi-dung')
        .setDescription('Chỉnh sửa nhanh tiêu đề, mô tả, ảnh banner hoặc màu sắc')
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
            .setDescription('Mô tả/lời chào (Dùng Enter, \\n hoặc dấu | để xuống dòng)')
            .setMaxLength(2000)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('anh-banner')
            .setDescription('Link URL ảnh Banner lớn nằm ở dưới (VD: https://.../banner.png)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('anh-nho')
            .setDescription('Link URL ảnh Logo nhỏ ở góc phải (VD: https://.../logo.png)')
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
    // 8. Thêm/Sửa câu hỏi
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
    // 9. Xóa câu hỏi
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

    if (!raw.danh_sach_cau_hoi || !Array.isArray(raw.danh_sach_cau_hoi)) {
      raw.danh_sach_cau_hoi = [];
    }
    if (!raw.embed || typeof raw.embed !== 'object') {
      raw.embed = {};
    }

    // --- 1. MỞ BẢNG ĐIỀU KHIỂN TƯƠNG TÁC (COMPONENT V2) HOẶC XEM ---
    if (sub === 'bang-dieu-khien' || sub === 'xem') {
      const normalized = loadConfig();
      const { embed, components } = createDashboard(interaction.guild, normalized);

      return interaction.reply({
        embeds: [embed],
        components: components,
        ephemeral: true
      });
    }

    // --- 2. LỆNH MỞ POPUP SỬA NỘI DUNG (NHẤN ENTER XUỐNG DÒNG) ---
    if (sub === 'sua-noi-dung') {
      const current = loadConfig();
      const modal = new ModalBuilder()
        .setCustomId('modal_edit_content')
        .setTitle('Sửa Bảng Xác Minh (Enter xuống dòng)');

      const titleInput = new TextInputBuilder()
        .setCustomId('edit_title')
        .setLabel('Tiêu đề bảng xác minh'.slice(0, 45))
        .setStyle(TextInputStyle.Short)
        .setValue((current.embed.title || '🛡️ XÁC MINH THÀNH VIÊN').slice(0, 100))
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('edit_description')
        .setLabel('Nội dung (Nhấn Enter xuống dòng)'.slice(0, 45))
        .setStyle(TextInputStyle.Paragraph)
        .setValue((current.embed.description || '').slice(0, 2000))
        .setPlaceholder('Nhập lời chào & hướng dẫn. Nhấn Enter để xuống dòng!')
        .setRequired(true);

      const imageInput = new TextInputBuilder()
        .setCustomId('edit_image')
        .setLabel('Link ảnh Banner lớn (.png/.jpg)'.slice(0, 45))
        .setStyle(TextInputStyle.Short)
        .setValue((current.embed.image || '').slice(0, 400))
        .setPlaceholder('https://example.com/banner.png')
        .setRequired(false);

      const thumbInput = new TextInputBuilder()
        .setCustomId('edit_thumbnail')
        .setLabel('Link ảnh Logo nhỏ góc phải'.slice(0, 45))
        .setStyle(TextInputStyle.Short)
        .setValue((current.embed.thumbnail || '').slice(0, 400))
        .setPlaceholder('https://example.com/logo.png')
        .setRequired(false);

      const footerInput = new TextInputBuilder()
        .setCustomId('edit_footer')
        .setLabel('Chân trang / Footer (Tùy chọn)'.slice(0, 45))
        .setStyle(TextInputStyle.Short)
        .setValue((current.embed.footer || '').slice(0, 200))
        .setPlaceholder('VD: Server Name | discord.gg/linkserver')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(imageInput),
        new ActionRowBuilder().addComponents(thumbInput),
        new ActionRowBuilder().addComponents(footerInput)
      );

      return interaction.showModal(modal);
    }

    // --- 3. LỆNH ĐẶT ROLE ---
    if (sub === 'role') {
      const giveRole = interaction.options.getRole('vai-tro');
      const removeRole = interaction.options.getRole('role-unverify');

      if (!giveRole && !removeRole) {
        return interaction.reply({
          content: '❌ Bạn cần chọn ít nhất một role (`vai-tro` để cấp hoặc `role-unverify` để gỡ)!',
          ephemeral: true
        });
      }

      const botMember = interaction.guild.members.me;
      const responseLines = [];

      if (giveRole) {
        if (botMember && botMember.roles.highest.position <= giveRole.position) {
          responseLines.push(`⚠️ **Lưu ý:** Role cấp ${giveRole} đang cao hơn hoặc bằng Role của Bot. Hãy vào *Server Settings -> Roles* kéo Role của Bot lên trên!`);
        }
        raw.role_id = giveRole.id;
        responseLines.push(`✅ **Đã lưu Role cấp:** ${giveRole}`);
      }

      if (removeRole) {
        if (botMember && botMember.roles.highest.position <= removeRole.position) {
          responseLines.push(`⚠️ **Lưu ý:** Role gỡ ${removeRole} đang cao hơn hoặc bằng Role của Bot. Hãy vào *Server Settings -> Roles* kéo Role của Bot lên trên để bot có quyền gỡ!`);
        }
        raw.role_unverify = removeRole.id;
        responseLines.push(`✅ **Đã lưu Role gỡ (Unverify):** ${removeRole}`);
      }

      saveRawConfig(raw);

      return interaction.reply({
        content: responseLines.join('\n'),
        ephemeral: true
      });
    }

    // --- 4. LỆNH ĐỔI CHẾ ĐỘ ---
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

    // --- 5. LỆNH ĐẶT KÊNH DUYỆT ---
    if (sub === 'kenh-duyet') {
      const channel = interaction.options.getChannel('kenh');
      raw.kenh_admin_duyet = channel.id;
      saveRawConfig(raw);

      return interaction.reply({
        content: `✅ Đã đặt kênh nhận phiếu duyệt xác minh thành: ${channel}`,
        ephemeral: true
      });
    }

    // --- 6. LỆNH CHỈNH NHANH NỘI DUNG QUA OPTION ---
    if (sub === 'noi-dung') {
      const title = interaction.options.getString('tieu-de');
      let description = interaction.options.getString('mo-ta');
      const banner = interaction.options.getString('anh-banner');
      const thumbnail = interaction.options.getString('anh-nho');
      const buttonLabel = interaction.options.getString('chu-nut');
      const buttonEmoji = interaction.options.getString('icon-nut');
      const color = interaction.options.getString('mau-sac');

      if (!title && !description && !banner && !thumbnail && !buttonLabel && !buttonEmoji && !color) {
        return interaction.reply({
          content: '⚠️ Bạn chưa điền tùy chọn nào!\n👉 Mẹo: Bạn có thể gõ lệnh `/config-verify bang-dieu-khien` để chỉnh sửa trực tiếp bằng nút bấm!',
          ephemeral: true
        });
      }

      if (title) raw.embed.title = title;
      if (description) {
        raw.embed.description = description.replace(/\\n/g, '\n').replace(/\|/g, '\n');
      }
      if (banner !== null) raw.embed.image = banner;
      if (thumbnail !== null) raw.embed.thumbnail = thumbnail;
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

      const currentConfig = loadConfig();
      const { embed: previewEmbed, row: previewRow } = createVerifyMessage(currentConfig);

      return interaction.reply({
        content: '✅ **Đã cập nhật nội dung bảng xác minh thành công!**\n\n👇 **Giao diện xem trước:**',
        embeds: [previewEmbed],
        components: [previewRow],
        ephemeral: true
      });
    }

    // --- 7. LỆNH THÊM / SỬA CÂU HỎI ---
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

    // --- 8. LỆNH XÓA CÂU HỎI ---
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
