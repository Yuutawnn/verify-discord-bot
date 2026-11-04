const { createReviewCard, createLogEmbed } = require('../utils/embeds');

/**
 * Xử lý khi người dùng submit Modal xác minh
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 * @param {object} config 
 */
async function handleModalSubmit(interaction, config) {
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

  // 1. Chế độ TỰ ĐỘNG (AUTO)
  if (config.mode === 'AUTO') {
    if (!allCorrect) {
      // Ghi log thất bại nếu có kênh log
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

    // Nếu trả lời đúng -> Cấp role
    try {
      if (config.verifiedRoleId) {
        await member.roles.add(config.verifiedRoleId);
      }
      if (config.removeRoleId && member.roles.cache.has(config.removeRoleId)) {
        await member.roles.remove(config.removeRoleId);
      }

      // Ghi log thành công
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

  // 2. Chế độ KIỂM DUYỆT THỦ CÔNG (MANUAL_REVIEW)
  if (config.mode === 'MANUAL_REVIEW') {
    if (!config.reviewChannelId) {
      console.error('Chưa cấu hình reviewChannelId trong config.json!');
      return interaction.reply({
        content: '❌ Lỗi hệ thống: Kênh duyệt chưa được cấu hình. Vui lòng liên hệ Admin!',
        ephemeral: true
      });
    }

    const reviewChannel = guild.channels.cache.get(config.reviewChannelId);
    if (!reviewChannel || !reviewChannel.isTextBased()) {
      console.error(`Không tìm thấy kênh reviewChannelId: ${config.reviewChannelId}`);
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

  // Trường hợp mode không hợp lệ
  return interaction.reply({
    content: '⚠️ Chế độ xác thực chưa được cài đặt đúng trong config.json (AUTO hoặc MANUAL_REVIEW).',
    ephemeral: true
  });
}

module.exports = { handleModalSubmit };
