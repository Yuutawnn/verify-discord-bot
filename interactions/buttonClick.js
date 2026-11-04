const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const { createLogEmbed, createDashboard, createVerifyMessage } = require('../utils/embeds');
const { getRawConfig, saveRawConfig, loadConfig } = require('../utils/configLoader');

/**
 * Xử lý các sự kiện bấm nút
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {object} config 
 */
async function handleButtonClick(interaction, config) {
  const { customId, member, guild } = interaction;

  // ==========================================
  // A. NÚT DÀNH CHO THÀNH VIÊN XÁC MINH
  // ==========================================

  // 1. Khi người dùng bấm nút "Bắt đầu xác minh"
  if (customId === 'btn_start_verify') {
    if (config.verifiedRoleId && member.roles.cache.has(config.verifiedRoleId)) {
      return interaction.reply({
        content: config.messages?.alreadyVerified || '❌ Bạn đã được xác minh trước đó rồi!',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_verify')
      .setTitle('Xác Minh Thành Viên');

    const questions = (config.questions || []).slice(0, 5);

    if (questions.length === 0) {
      return interaction.reply({
        content: '⚠️ Chưa có câu hỏi xác minh nào được cấu hình trong config.json!',
        ephemeral: true
      });
    }

    const rows = questions.map((q) => {
      const textInput = new TextInputBuilder()
        .setCustomId(`question_${q.id}`)
        .setLabel(q.label.slice(0, 45))
        .setStyle(q.style === 'Paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(q.required !== false);

      if (q.placeholder) textInput.setPlaceholder(q.placeholder.slice(0, 100));
      if (q.minLength) textInput.setMinLength(q.minLength);
      if (q.maxLength) textInput.setMaxLength(q.maxLength);

      return new ActionRowBuilder().addComponents(textInput);
    });

    modal.addComponents(rows);
    return interaction.showModal(modal);
  }

  // ==========================================
  // B. CÁC NÚT BẢNG ĐIỀU KHIỂN (DASHBOARD COMPONENT V2)
  // ==========================================

  // 2. Mở Popup sửa nội dung & ảnh
  if (customId === 'btn_cfg_edit_content') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_edit_content')
      .setTitle('Sửa Bảng Xác Minh (Enter xuống dòng)');

    const titleInput = new TextInputBuilder()
      .setCustomId('edit_title')
      .setLabel('Tiêu đề bảng xác minh'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.title || '🛡️ XÁC MINH THÀNH VIÊN').slice(0, 100))
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('edit_description')
      .setLabel('Nội dung (Nhấn Enter xuống dòng)'.slice(0, 45))
      .setStyle(TextInputStyle.Paragraph)
      .setValue((config.embed.description || '').slice(0, 2000))
      .setPlaceholder('Nhập lời chào & hướng dẫn. Nhấn Enter để xuống dòng!')
      .setRequired(true);

    const imageInput = new TextInputBuilder()
      .setCustomId('edit_image')
      .setLabel('Link ảnh Banner lớn (.png/.jpg)'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.image || '').slice(0, 400))
      .setPlaceholder('https://example.com/banner.png')
      .setRequired(false);

    const thumbInput = new TextInputBuilder()
      .setCustomId('edit_thumbnail')
      .setLabel('Link ảnh Logo nhỏ góc phải'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.thumbnail || '').slice(0, 400))
      .setPlaceholder('https://example.com/logo.png')
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId('edit_footer')
      .setLabel('Chân trang / Footer (Tùy chọn)'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.footer || '').slice(0, 200))
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

  // 3. Mở Modal tùy chỉnh tin nhắn phản hồi thành viên
  if (customId === 'btn_cfg_edit_reply_msg') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_edit_reply_msg')
      .setTitle('Sửa Tin Nhắn Reply Thành Viên');

    const successInput = new TextInputBuilder()
      .setCustomId('reply_success')
      .setLabel('Khi xác minh thành công (Tự động)'.slice(0, 45))
      .setStyle(TextInputStyle.Paragraph)
      .setValue((config.messages?.successAuto || '🎉 Chúc mừng bạn đã xác minh thành công!').slice(0, 500))
      .setRequired(true);

    const failedInput = new TextInputBuilder()
      .setCustomId('reply_failed')
      .setLabel('Khi trả lời sai đáp án (Thất bại)'.slice(0, 45))
      .setStyle(TextInputStyle.Paragraph)
      .setValue((config.messages?.failedAuto || '❌ Câu trả lời của bạn chưa chính xác. Vui lòng kiểm tra lại!').slice(0, 500))
      .setRequired(true);

    const reviewInput = new TextInputBuilder()
      .setCustomId('reply_review')
      .setLabel('Khi gửi câu trả lời chờ Admin duyệt'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.messages?.submittedReview || '📋 Câu trả lời đã được gửi tới Ban Quản Trị. Vui lòng chờ xét duyệt!').slice(0, 300))
      .setRequired(true);

    const alreadyInput = new TextInputBuilder()
      .setCustomId('reply_already')
      .setLabel('Khi đã xác minh trước đó rồi'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.messages?.alreadyVerified || '❌ Bạn đã được xác minh trước đó rồi!').slice(0, 200))
      .setRequired(true);

    const dmInput = new TextInputBuilder()
      .setCustomId('reply_dm')
      .setLabel('Tin nhắn DM khi Admin duyệt ({server})'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.messages?.approvedDirect || '🎉 Yêu cầu xác minh của bạn tại **{server}** đã được phê duyệt!').slice(0, 300))
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(successInput),
      new ActionRowBuilder().addComponents(failedInput),
      new ActionRowBuilder().addComponents(reviewInput),
      new ActionRowBuilder().addComponents(alreadyInput),
      new ActionRowBuilder().addComponents(dmInput)
    );

    return interaction.showModal(modal);
  }

  // 4. Đảo chế độ (Tự Động <-> Admin Duyệt)
  if (customId === 'btn_cfg_toggle_mode') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const raw = getRawConfig();
    const currentMode = String(raw.che_do || raw.mode || '').toUpperCase();
    const newMode = (currentMode === 'ADMIN_DUYET' || currentMode === 'MANUAL_REVIEW') ? 'TU_DONG' : 'ADMIN_DUYET';
    raw.che_do = newMode;
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    return interaction.update({ embeds: [embed], components });
  }

  // 5. Đổi màu nút bấm (Xám không màu <-> Xanh lá <-> Xanh dương <-> Đỏ)
  if (customId === 'btn_cfg_toggle_btn_color') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const raw = getRawConfig();
    if (!raw.embed || typeof raw.embed !== 'object') raw.embed = {};
    if (!raw.nut_xac_minh || typeof raw.nut_xac_minh !== 'object') raw.nut_xac_minh = {};

    const colorCycle = ['XAM', 'XANH_LA', 'XANH_DUONG', 'DO'];
    const currentBtn = String(raw.nut_xac_minh?.mau_nut || raw.embed.buttonStyle || raw.kieu_nut || raw.mau_nut || 'XAM').toUpperCase();
    let nextIdx = (colorCycle.indexOf(currentBtn) + 1) % colorCycle.length;
    if (nextIdx < 0) nextIdx = 0;

    raw.nut_xac_minh.mau_nut = colorCycle[nextIdx];
    raw.embed.buttonStyle = colorCycle[nextIdx];
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    return interaction.update({ embeds: [embed], components });
  }

  // 6. Bật / Tắt đường kẻ phân cách (Divider Component V2)
  if (customId === 'btn_cfg_toggle_divider') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const raw = getRawConfig();
    const currentDivider = raw.duong_ke ?? raw.divider ?? true;
    raw.duong_ke = !currentDivider;
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    return interaction.update({ embeds: [embed], components });
  }

  // 7. Mở Modal tùy chỉnh Chữ nút xác minh & Nút liên kết phụ (Link Button)
  if (customId === 'btn_cfg_edit_buttons') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_edit_buttons')
      .setTitle('Chỉnh Nút Xác Minh & Link Phụ');

    const btnLabelInput = new TextInputBuilder()
      .setCustomId('btn_label')
      .setLabel('Chữ trên nút xác minh'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed?.buttonLabel || 'Xác minh').slice(0, 80))
      .setPlaceholder('VD: Xác minh, Bắt đầu xác minh...')
      .setRequired(true);

    const btnEmojiInput = new TextInputBuilder()
      .setCustomId('btn_emoji')
      .setLabel('Icon emoji nút xác minh'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed?.buttonEmoji || '🛡️').slice(0, 20))
      .setPlaceholder('VD: 🛡️, ✅, 🔄...')
      .setRequired(false);

    const linkLabelInput = new TextInputBuilder()
      .setCustomId('btn_link_label')
      .setLabel('Chữ nút phụ / Link (Bỏ trống nếu tắt)'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed?.secondButton?.label || 'Hỗ Trợ').slice(0, 80))
      .setPlaceholder('VD: Hỗ Trợ, Ticket, Nội Quy...')
      .setRequired(false);

    const linkEmojiInput = new TextInputBuilder()
      .setCustomId('btn_link_emoji')
      .setLabel('Icon emoji nút phụ / Link'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed?.secondButton?.emoji || '🎫').slice(0, 20))
      .setPlaceholder('VD: 🎫, 📖, 🌐...')
      .setRequired(false);

    const linkUrlInput = new TextInputBuilder()
      .setCustomId('btn_link_url')
      .setLabel('Link URL nút phụ (https://...)'.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed?.secondButton?.url || '').slice(0, 400))
      .setPlaceholder('https://discord.gg/linkserver (để trống để tắt)')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(btnLabelInput),
      new ActionRowBuilder().addComponents(btnEmojiInput),
      new ActionRowBuilder().addComponents(linkLabelInput),
      new ActionRowBuilder().addComponents(linkEmojiInput),
      new ActionRowBuilder().addComponents(linkUrlInput)
    );

    return interaction.showModal(modal);
  }

  // 4. Mở Popup sửa câu hỏi & đáp án
  if (customId === 'btn_cfg_edit_questions') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_edit_questions')
      .setTitle('Sửa Câu Hỏi Xác Minh');

    const q1 = config.questions[0] || {};
    const q2 = config.questions[1] || {};

    const q1Text = new TextInputBuilder()
      .setCustomId('q1_text')
      .setLabel('Câu hỏi 1 (Tối đa 45 ký tự)')
      .setStyle(TextInputStyle.Short)
      .setValue((q1.label || '').slice(0, 45))
      .setRequired(true);

    const q1Ans = new TextInputBuilder()
      .setCustomId('q1_ans')
      .setLabel('Đáp án đúng câu 1 (cách nhau dấu phẩy)')
      .setStyle(TextInputStyle.Short)
      .setValue((q1.correctAnswers ? q1.correctAnswers.join(', ') : '').slice(0, 100))
      .setPlaceholder('VD: dong y, agree, pass123')
      .setRequired(false);

    const q2Text = new TextInputBuilder()
      .setCustomId('q2_text')
      .setLabel('Câu hỏi 2 (Tùy chọn, tối đa 45 ký tự)')
      .setStyle(TextInputStyle.Short)
      .setValue((q2.label || '').slice(0, 45))
      .setRequired(false);

    const q2Ans = new TextInputBuilder()
      .setCustomId('q2_ans')
      .setLabel('Đáp án đúng câu 2 (bỏ trống = khảo sát)')
      .setStyle(TextInputStyle.Short)
      .setValue((q2.correctAnswers ? q2.correctAnswers.join(', ') : '').slice(0, 100))
      .setPlaceholder('Bỏ trống nếu không cần chấm điểm')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1Text),
      new ActionRowBuilder().addComponents(q1Ans),
      new ActionRowBuilder().addComponents(q2Text),
      new ActionRowBuilder().addComponents(q2Ans)
    );

    return interaction.showModal(modal);
  }

  // 6. Gửi bảng xác minh ra kênh chat (Ưu tiên Component V2, tự động fallback về Embed truyền thống)
  if (customId === 'btn_cfg_deploy_verify') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const verifyMsg = createVerifyMessage(config);
    try {
      await interaction.channel.send(verifyMsg.v2Payload);
    } catch (v2Err) {
      console.warn('⚠️ Server chưa kích hoạt Components V2 từ Discord, gửi dạng Embed chuẩn:', v2Err.message);
      await interaction.channel.send(verifyMsg.classicPayload);
    }

    return interaction.reply({
      content: `✅ Đã gửi bảng xác minh ra kênh ${interaction.channel} thành công!`,
      ephemeral: true
    });
  }

  // ==========================================
  // C. CÁC NÚT PHÊ DUYỆT / TỪ CHỐI CỦA ADMIN
  // ==========================================

  // 6. Khi Admin bấm nút "Phê duyệt" (Approve)
  if (customId.startsWith('btn_approve_')) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles) &&
        !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền duyệt thành viên!',
        ephemeral: true
      });
    }

    const targetUserId = customId.replace('btn_approve_', '');
    let targetMember;
    try {
      targetMember = await guild.members.fetch(targetUserId);
    } catch {
      return interaction.reply({
        content: '❌ Thành viên này đã rời khỏi server!',
        ephemeral: true
      });
    }

    try {
      if (config.verifiedRoleId) {
        await targetMember.roles.add(config.verifiedRoleId);
      }
      if (config.removeRoleId) {
        await targetMember.roles.remove(config.removeRoleId).catch(() => {});
      }

      try {
        const approvedText = (config.messages?.approvedDirect || '🎉 Yêu cầu xác minh của bạn tại **{server}** đã được phê duyệt!')
          .replace(/\{server\}/g, guild.name)
          .replace(/\{member\}/g, `${targetMember}`);
        await targetMember.send(approvedText);
      } catch {}

      const oldEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(oldEmbed)
        .setColor('#57F287')
        .addFields({
          name: '📌 Trạng thái',
          value: `✅ **ĐÃ DUYỆT** bởi ${interaction.user} vào <t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: false
        });

      await interaction.update({
        embeds: [updatedEmbed],
        components: []
      });

      if (config.logChannelId) {
        const logChannel = guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          const logEmbed = createLogEmbed({
            member: targetMember,
            action: 'Phê duyệt thủ công',
            moderator: interaction.member,
            color: '#57F287'
          });
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Lỗi khi cấp role duyệt:', err);
      return interaction.followUp({
        content: '❌ Lỗi khi cấp Role. Hãy đảm bảo Role của bot nằm TRÊN Role cần cấp trong Server Settings!',
        ephemeral: true
      });
    }
  }

  // 7. Khi Admin bấm nút "Từ chối" (Reject)
  if (customId.startsWith('btn_reject_')) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles) &&
        !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền từ chối thành viên!',
        ephemeral: true
      });
    }

    const targetUserId = customId.replace('btn_reject_', '');
    let targetMember;
    try {
      targetMember = await guild.members.fetch(targetUserId);
    } catch {
      targetMember = null;
    }

    if (targetMember) {
      try {
        const rejectedText = (config.messages?.rejectedDirect || '❌ Yêu cầu xác minh của bạn tại **{server}** đã bị từ chối.')
          .replace(/\{server\}/g, guild.name)
          .replace(/\{member\}/g, `${targetMember}`);
        await targetMember.send(rejectedText);
      } catch {}
    }

    const oldEmbed = interaction.message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(oldEmbed)
      .setColor('#ED4245')
      .addFields({
        name: '📌 Trạng thái',
        value: `❌ **ĐÃ TỪ CHỐI** bởi ${interaction.user} vào <t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false
      });

    await interaction.update({
      embeds: [updatedEmbed],
      components: []
    });

    if (config.logChannelId && targetMember) {
      const logChannel = guild.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const logEmbed = createLogEmbed({
          member: targetMember,
          action: 'Từ chối duyệt',
          moderator: interaction.member,
          color: '#ED4245'
        });
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
  }
}

module.exports = { handleButtonClick };
