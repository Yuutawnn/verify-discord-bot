const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Tạo Embed và Nút bấm cho bảng xác minh chính
 * @param {object} config 
 * @returns {{ embed: EmbedBuilder, row: ActionRowBuilder }}
 */
function createVerifyMessage(config) {
  const embed = new EmbedBuilder()
    .setTitle(config.embed.title || '🛡️ XÁC MINH THÀNH VIÊN')
    .setDescription(config.embed.description || 'Nhấn nút bên dưới để xác minh.')
    .setColor(config.embed.color || '#5865F2')
    .setFooter({ text: 'Hệ thống xác minh tự động' })
    .setTimestamp();

  if (config.embed?.image) {
    embed.setImage(config.embed.image);
  }
  if (config.embed?.thumbnail) {
    embed.setThumbnail(config.embed.thumbnail);
  }

  const button = new ButtonBuilder()
    .setCustomId('btn_start_verify')
    .setLabel(config.embed.buttonLabel || 'Bắt đầu xác minh')
    .setStyle(ButtonStyle.Success);

  if (config.embed.buttonEmoji) {
    button.setEmoji(config.embed.buttonEmoji);
  }

  const row = new ActionRowBuilder().addComponents(button);

  return { embed, row };
}

/**
 * Tạo Embed phiếu duyệt gửi vào kênh Admin/Mod
 * @param {import('discord.js').GuildMember} member 
 * @param {Array<{ label: string, value: string }>} answers 
 * @returns {{ embed: EmbedBuilder, row: ActionRowBuilder }}
 */
function createReviewCard(member, answers) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Yêu Cầu Xác Minh Mới')
    .setColor('#FEE75C')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Thành viên', value: `${member} (\`${member.user.tag}\` | \`${member.id}\`)`, inline: false },
      { name: 'Ngày tạo tài khoản', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Ngày tham gia server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
    );

  // Thêm các câu trả lời
  answers.forEach((ans, index) => {
    embed.addFields({
      name: `❓ Câu hỏi ${index + 1}: ${ans.label}`,
      value: ans.value ? `\`\`\`${ans.value}\`\`\`` : '*Không có câu trả lời*',
      inline: false
    });
  });

  embed.setFooter({ text: `ID Người dùng: ${member.id}` }).setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_approve_${member.id}`)
      .setLabel('Phê duyệt')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`btn_reject_${member.id}`)
      .setLabel('Từ chối')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );

  return { embed, row };
}

/**
 * Tạo Embed ghi log vào kênh log
 */
function createLogEmbed({ member, action, moderator, reason, color }) {
  const embed = new EmbedBuilder()
    .setTitle(`📝 Nhật ký xác thực: ${action}`)
    .setColor(color || '#5865F2')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Thành viên', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'Hành động', value: action, inline: true }
    );

  if (moderator) {
    embed.addFields({ name: 'Người thực hiện', value: `${moderator.user.tag}`, inline: true });
  }

  if (reason) {
    embed.addFields({ name: 'Lý do/Ghi chú', value: reason, inline: false });
  }

  embed.setTimestamp();
  return embed;
}

module.exports = {
  createVerifyMessage,
  createReviewCard,
  createLogEmbed
};
