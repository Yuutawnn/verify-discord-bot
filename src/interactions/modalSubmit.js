const { createReviewCard, createLogEmbed, createVerifyMessage, createDashboard } = require('../utils/embeds');
const { getRawConfig, saveRawConfig, loadConfig } = require('../utils/configLoader');

/**
 * Xử lý khi người dùng submit Modal xác minh
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 * @param {object} config 
 */
async function handleModalSubmit(interaction, config) {
  // 1. Xử lý khi Admin nộp Modal chỉnh sửa nội dung bảng xác minh
  if (interaction.customId === 'modal_edit_content') {
    const title = interaction.fields.getTextInputValue('edit_title')?.trim();
    const description = interaction.fields.getTextInputValue('edit_description')?.trim();
    const buttonLabel = interaction.fields.getTextInputValue('edit_button_label')?.trim();
    const image = interaction.fields.getTextInputValue('edit_image')?.trim();
    const thumbnail = interaction.fields.getTextInputValue('edit_thumbnail')?.trim();

    const raw = getRawConfig();
    if (!raw.embed || typeof raw.embed !== 'object') raw.embed = {};

    if (title) raw.embed.title = title;
    if (description) raw.embed.description = description;
    if (buttonLabel) raw.embed.buttonLabel = buttonLabel;
    raw.embed.image = image || '';
    raw.embed.thumbnail = thumbnail || '';

    saveRawConfig(raw);

    const currentConfig = loadConfig();
    const { embed, row } = createVerifyMessage(currentConfig);

    return interaction.reply({
      content: '✅ **Đã cập nhật nội dung bảng xác minh thành công!**\n*(Để gửi bảng mới ra kênh chat, bạn chỉ cần bấm nút [Gửi Bảng Xác Minh] trên Dashboard hoặc gõ `/setup-verify`)*.\n\n👇 **Bản xem trước:**',
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  // 2. Xử lý khi Admin nộp Modal chỉnh sửa câu hỏi & đáp án
  if (interaction.customId === 'modal_edit_questions') {
    const q1Text = interaction.fields.getTextInputValue('q1_text')?.trim();
    const q1Ans = interaction.fields.getTextInputValue('q1_ans')?.trim();
    const q2Text = interaction.fields.getTextInputValue('q2_text')?.trim();
    const q2Ans = interaction.fields.getTextInputValue('q2_ans')?.trim();

    const raw = getRawConfig();
    raw.danh_sach_cau_hoi = [];

    if (q1Text) {
      raw.danh_sach_cau_hoi.push({ cau_hoi: q1Text, dap_an: q1Ans || '' });
    }
    if (q2Text) {
      raw.danh_sach_cau_hoi.push({ cau_hoi: q2Text, dap_an: q2Ans || '' });
    }

    saveRawConfig(raw);

    return interaction.reply({
      content: `✅ **Đã lưu ${raw.danh_sach_cau_hoi.length} câu hỏi thành công!**\nCác thành viên xác minh tiếp theo sẽ nhận bộ câu hỏi mới này.`,
      ephemeral: true
    });
  }

  // 3. Xử lý khi thành viên nộp câu hỏi xác minh
  if (interaction.customId !== 'modal_verify') return;

  const { member, guild } = interaction;
  const questions = config.questions || [];

  // Thu thập câu trả lời
  const answers = [];
  let allCorrect = true;

  for (const q of questions) {
    const value = interaction.fields.getTextInputValue(`question_${q.id}`) || '';
    answers.push({
      id: q.id,
      label: q.label,
      value: value
    });

    // Nếu có danh sách đáp án đúng (dùng cho chế độ AUTO)
    if (config.mode === 'AUTO' && Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
      const cleanInput = value.trim().toLowerCase();
      const validAnswers = q.correctAnswers.map(ans => String(ans).trim().toLowerCase());
      
      const isMatch = validAnswers.includes(cleanInput);
      if (!isMatch) {
        allCorrect = false;
      }
    }
  }

  // Chế độ TỰ ĐỘNG (AUTO)
  if (config.mode === 'AUTO') {
    if (!allCorrect) {
      if (config.logChannelId) {
        const logChannel = guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          const logEmbed = createLogEmbed({
            member,
            action: 'Xác minh tự động thất bại',
            reason: 'Trả lời sai câu hỏi quy định',
            color: '#ED4245'
          });
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      return interaction.reply({
        content: config.messages?.failedAuto || '❌ Câu trả lời của bạn chưa chính xác. Vui lòng kiểm tra lại!',
        ephemeral: true
      });
    }

    try {
      if (config.verifiedRoleId) {
        await member.roles.add(config.verifiedRoleId);
      }
      if (config.removeRoleId && member.roles.cache.has(config.removeRoleId)) {
        await member.roles.remove(config.removeRoleId);
      }

      if (config.logChannelId) {
        const logChannel = guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          const logEmbed = createLogEmbed({
            member,
            action: 'Xác minh tự động thành công',
            color: '#57F287'
          });
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      return interaction.reply({
        content: config.messages?.successAuto || '🎉 Chúc mừng bạn đã xác minh thành công!',
        ephemeral: true
      });
    } catch (err) {
      console.error('Lỗi khi cấp role tự động:', err);
      return interaction.reply({
        content: '❌ Có lỗi xảy ra khi cấp Role. Hãy báo cho Ban Quản Trị kiểm tra quyền hạn của bot!',
        ephemeral: true
      });
    }
  }

  // Chế độ KIỂM DUYỆT THỦ CÔNG (MANUAL_REVIEW)
  if (config.mode === 'MANUAL_REVIEW') {
    if (!config.reviewChannelId) {
      return interaction.reply({
        content: '❌ Lỗi hệ thống: Kênh duyệt chưa được cấu hình. Vui lòng liên hệ Admin!',
        ephemeral: true
      });
    }

    const reviewChannel = guild.channels.cache.get(config.reviewChannelId);
    if (!reviewChannel || !reviewChannel.isTextBased()) {
      return interaction.reply({
        content: '❌ Lỗi hệ thống: Không tìm thấy kênh duyệt của Admin!',
        ephemeral: true
      });
    }

    try {
      const { embed, row } = createReviewCard(member, answers);
      await reviewChannel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: config.messages?.submittedReview || '📋 Câu trả lời của bạn đã được gửi tới Ban Quản Trị. Vui lòng chờ xét duyệt!',
        ephemeral: true
      });
    } catch (err) {
      console.error('Lỗi khi gửi phiếu duyệt vào kênh Admin:', err);
      return interaction.reply({
        content: '❌ Không thể gửi câu trả lời tới Admin. Vui lòng kiểm tra quyền gửi tin nhắn của bot trong kênh duyệt!',
        ephemeral: true
      });
    }
  }

  return interaction.reply({
    content: '⚠️ Chế độ xác thực chưa được cài đặt đúng trong config.json.',
    ephemeral: true
  });
}

module.exports = { handleModalSubmit };
