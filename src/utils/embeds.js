const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType
} = require('discord.js');

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

/**
 * Tạo Giao diện Bảng điều khiển Tương tác (Component Dashboard) cho Admin
 * @param {import('discord.js').Guild} guild 
 * @param {object} config 
 */
function createDashboard(guild, config) {
  const roleDisplay = config.verifiedRoleId
    ? `<@&${config.verifiedRoleId}>`
    : '⚠️ *Chưa chọn (Dùng menu chọn Role bên dưới)*';

  const modeDisplay = config.mode === 'AUTO'
    ? '🤖 **Tự động (AUTO)** (So khớp từ khóa)'
    : '👮 **Admin duyệt (MANUAL_REVIEW)** (Bấm nút trên phiếu duyệt)';

  const reviewChannelDisplay = config.reviewChannelId
    ? `<#${config.reviewChannelId}>`
    : (config.mode === 'MANUAL_REVIEW' ? '⚠️ *Chưa chọn kênh duyệt!*' : '*Không áp dụng ở chế độ tự động*');

  const embed = new EmbedBuilder()
    .setTitle('🛠️ BẢNG ĐIỀU KHIỂN XÁC MINH (CONTROL PANEL)')
    .setDescription('Chọn các menu hoặc nút bấm bên dưới để tùy chỉnh toàn bộ hệ thống xác minh trực tiếp bằng giao diện tương tác.')
    .setColor(config.embed?.color || '#5865F2')
    .addFields(
      { name: '🎭 Role thành viên sẽ cấp', value: roleDisplay, inline: true },
      { name: '🛡️ Chế độ xác minh', value: modeDisplay, inline: true },
      { name: '📋 Kênh Admin duyệt', value: reviewChannelDisplay, inline: true },
      {
        name: '📝 Nội dung bảng xác minh',
        value: `**Tiêu đề:** ${config.embed?.title || 'Chưa đặt'}\n**Nút bấm:** ${config.embed?.buttonEmoji || ''} ${config.embed?.buttonLabel || 'Bắt đầu'}\n**Ảnh Banner:** ${config.embed?.image ? `[Xem ảnh](${config.embed.image})` : '*Chưa có*'}\n**Logo nhỏ:** ${config.embed?.thumbnail ? `[Xem logo](${config.embed.thumbnail})` : '*Chưa có*'}`,
        inline: false
      }
    );

  if (!config.questions || config.questions.length === 0) {
    embed.addFields({
      name: '❓ Danh sách câu hỏi',
      value: '⚠️ *Chưa có câu hỏi nào! Nhấn nút [❓ Sửa Câu Hỏi] bên dưới để thêm.*'
    });
  } else {
    const questionLines = config.questions.map((q, idx) => {
      const ansText = q.correctAnswers && q.correctAnswers.length > 0
        ? `\`${q.correctAnswers.join(', ')}\``
        : '*Không chấm điểm (Khảo sát/Admin đọc)*';
      return `**${idx + 1}.** ${q.label}\n👉 Đáp án: ${ansText}`;
    });

    embed.addFields({
      name: `❓ Danh sách câu hỏi (${config.questions.length}/5)`,
      value: questionLines.join('\n\n')
    });
  }

  embed.setFooter({ text: 'Mọi thay đổi sẽ được lưu tự động ngay khi bạn thao tác' });
  embed.setTimestamp();

  // Row 1: Chọn Role bằng Dropdown native của Discord
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId('select_cfg_role')
    .setPlaceholder('🎭 Chọn Role sẽ cấp cho thành viên...')
    .setMinValues(1)
    .setMaxValues(1);
  const rowRole = new ActionRowBuilder().addComponents(roleSelect);

  // Row 2: Chọn Kênh duyệt bằng Dropdown native của Discord
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('select_cfg_channel')
    .setPlaceholder('📋 Chọn Kênh nhận phiếu duyệt cho Admin...')
    .addChannelTypes(ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);
  const rowChannel = new ActionRowBuilder().addComponents(channelSelect);

  // Row 3: Các nút chức năng
  const btnEditContent = new ButtonBuilder()
    .setCustomId('btn_cfg_edit_content')
    .setLabel('Sửa Nội Dung & Ảnh')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📝');

  const btnToggleMode = new ButtonBuilder()
    .setCustomId('btn_cfg_toggle_mode')
    .setLabel(`Đổi Chế Độ (${config.mode === 'AUTO' ? 'Tự Động' : 'Admin Duyệt'})`)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🛡️');

  const btnEditQuestions = new ButtonBuilder()
    .setCustomId('btn_cfg_edit_questions')
    .setLabel('Sửa Câu Hỏi')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('❓');

  const btnDeploy = new ButtonBuilder()
    .setCustomId('btn_cfg_deploy_verify')
    .setLabel('Gửi Bảng Xác Minh')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🚀');

  const rowButtons = new ActionRowBuilder().addComponents(
    btnEditContent,
    btnToggleMode,
    btnEditQuestions,
    btnDeploy
  );

  return { embed, components: [rowRole, rowChannel, rowButtons] };
}

module.exports = {
  createVerifyMessage,
  createReviewCard,
  createLogEmbed,
  createDashboard
};
