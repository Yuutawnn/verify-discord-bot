const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const { createLogEmbed } = require('../utils/embeds');

/**
 * Xử lý các sự kiện bấm nút
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {object} config 
 */
async function handleButtonClick(interaction, config) {
  const { customId, member, guild } = interaction;

  // 1. Khi người dùng bấm nút "Bắt đầu xác minh"
  if (customId === 'btn_start_verify') {
    // Kiểm tra xem đã có role xác minh chưa
    if (config.verifiedRoleId && member.roles.cache.has(config.verifiedRoleId)) {
      return interaction.reply({
        content: config.messages?.alreadyVerified || '❌ Bạn đã được xác minh trước đó rồi!',
        ephemeral: true
      });
    }

    // Tạo Modal
    const modal = new ModalBuilder()
      .setCustomId('modal_verify')
      .setTitle('Xác Minh Thành Viên');

    const questions = (config.questions || []).slice(0, 5); // Discord giới hạn tối đa 5 trường nhập

    if (questions.length === 0) {
      return interaction.reply({
        content: '⚠️ Chưa có câu hỏi xác minh nào được cấu hình trong config.json!',
        ephemeral: true
      });
    }

    const rows = questions.map((q) => {
      const textInput = new TextInputBuilder()
        .setCustomId(`question_${q.id}`)
        .setLabel(q.label.slice(0, 45)) // Discord giới hạn 45 ký tự cho label
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

  // 2. Khi Admin bấm nút "Phê duyệt" (Approve)
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

    // Cấp role
    try {
      if (config.verifiedRoleId) {
        await targetMember.roles.add(config.verifiedRoleId);
      }
      if (config.removeRoleId && targetMember.roles.cache.has(config.removeRoleId)) {
        await targetMember.roles.remove(config.removeRoleId);
      }

      // Gửi DM cho thành viên
      try {
        await targetMember.send(
          config.messages?.approvedDirect ||
          `🎉 Yêu cầu xác minh của bạn tại **${guild.name}** đã được phê duyệt!`
        );
      } catch {
        // Người dùng tắt DM, bỏ qua
      }

      // Cập nhật giao diện tin nhắn duyệt
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
        components: [] // Xóa nút bấm sau khi đã xử lý
      });

      // Ghi log nếu có cấu hình
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

  // 3. Khi Admin bấm nút "Từ chối" (Reject)
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
      } catch {
        // Người dùng tắt DM
      }
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

    // Ghi log
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
