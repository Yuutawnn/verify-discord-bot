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
      .setLabel('Tiêu đề bảng xác minh')
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.title || '🛡️ XÁC MINH THÀNH VIÊN').slice(0, 100))
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('edit_description')
      .setLabel('Nội dung (Nhấn Enter để xuống dòng)')
      .setStyle(TextInputStyle.Paragraph)
      .setValue((config.embed.description || '').slice(0, 2000))
      .setPlaceholder('Nhập lời chào & hướng dẫn. Nhấn Enter để xuống dòng thoải mái!')
      .setRequired(true);

    const thumbInput = new TextInputBuilder()
      .setCustomId('edit_thumbnail')
      .setLabel('Link ảnh Logo nhỏ góc phải (URL ảnh)')
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.thumbnail || '').slice(0, 400))
      .setPlaceholder('https://example.com/logo.png')
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId('edit_footer')
      .setLabel('Chữ chân trang (Footer - Bỏ trống nếu không dùng)')
      .setStyle(TextInputStyle.Short)
      .setValue((config.embed.footer || '').slice(0, 200))
      .setPlaceholder('VD: Ares Store | discord.gg/aresstore')
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

  // 3. Đảo chế độ (Tự Động <-> Admin Duyệt)
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

  // 4. Đổi màu nút bấm (Xám không màu <-> Xanh lá <-> Xanh dương <-> Đỏ)
  if (customId === 'btn_cfg_toggle_btn_color') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const raw = getRawConfig();
    if (!raw.embed || typeof raw.embed !== 'object') raw.embed = {};

    const colorCycle = ['XAM', 'XANH_LA', 'XANH_DUONG', 'DO'];
    const currentBtn = String(raw.embed.buttonStyle || raw.kieu_nut || raw.mau_nut || 'XAM').toUpperCase();
    let nextIdx = (colorCycle.indexOf(currentBtn) + 1) % colorCycle.length;
    if (nextIdx < 0) nextIdx = 0;

    raw.embed.buttonStyle = colorCycle[nextIdx];
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    return interaction.update({ embeds: [embed], components });
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

  // 5. Gửi bảng xác minh ra kênh chat
  if (customId === 'btn_cfg_deploy_verify') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ có Administrator mới có quyền!', ephemeral: true });
    }

    const { embed: verifyEmbed, row: verifyRow } = createVerifyMessage(config);
    await interaction.channel.send({ embeds: [verifyEmbed], components: [verifyRow] });

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
      if (config.removeRoleId && targetMember.roles.cache.has(config.removeRoleId)) {
        await targetMember.roles.remove(config.removeRoleId);
      }

      try {
        await targetMember.send(
          config.messages?.approvedDirect ||
          `🎉 Yêu cầu xác minh của bạn tại **${guild.name}** đã được phê duyệt!`
        );
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
        await targetMember.send(
          (config.messages?.rejectedDirect || '⚠️ Yêu cầu xác minh của bạn đã bị từ chối.') +
          `\nServer: **${guild.name}**`
        );
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
