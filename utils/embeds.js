const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

/**
 * Chuyển đổi tên kiểu nút thành ButtonStyle tương ứng trong Discord
 * Mặc định là Secondary (Xám / không màu)
 */
function getButtonStyle(styleName) {
  const s = String(styleName || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'XANH_LA' || s === 'GREEN') return ButtonStyle.Success;
  if (s === 'PRIMARY' || s === 'XANH_DUONG' || s === 'BLUE') return ButtonStyle.Primary;
  if (s === 'DANGER' || s === 'DO' || s === 'RED') return ButtonStyle.Danger;
  return ButtonStyle.Secondary; // Mặc định: Nút xám không màu (neutral)
}

/**
 * Tạo Bảng xác minh chính hỗ trợ Component V2 (Nút nằm TRỌN trong Embed)
 * và Embed truyền thống (để tương thích ngược)
 * @param {object} config 
 */
function createVerifyMessage(config) {
  const title = config.embed?.title || '🛡️ CỔNG XÁC MINH THÀNH VIÊN';
  const desc = config.embed?.description || 'Nhấn nút bên dưới để xác minh.';
  const colorHex = config.embed?.color || '#2B2D31';

  // 1. Tạo Container Component V2 (cho nút nằm ngay trong khung Embed)
  const container = new ContainerBuilder();
  const hexClean = colorHex.replace('#', '');
  const colorInt = parseInt(hexClean, 16);
  if (!isNaN(colorInt)) {
    container.setAccentColor(colorInt);
  }

  const mainContent = `## ${title}\n\n${desc}`;

  // Logo nhỏ góc phải
  if (config.embed?.thumbnail) {
    const section = new SectionBuilder()
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(config.embed.thumbnail))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent));
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent));
  }

  // Ảnh Banner lớn ở giữa
  if (config.embed?.image) {
    const media = new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(config.embed.image)
    );
    container.addMediaGalleryComponents(media);
  }

  // Chân trang (Footer)
  if (config.embed?.footer) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${config.embed.footer}`)
    );
  }

  // Nút bấm: Mặc định xám (không màu), có thể tùy chỉnh
  const button = new ButtonBuilder()
    .setCustomId('btn_start_verify')
    .setLabel(config.embed?.buttonLabel || 'Xác minh')
    .setStyle(getButtonStyle(config.embed?.buttonStyle));

  if (config.embed?.buttonEmoji) {
    button.setEmoji(config.embed.buttonEmoji);
  }

  const row = new ActionRowBuilder().addComponents(button);

  // Đưa nút vào TRONG Container của Component V2
  container.addActionRowComponents(row);

  // 2. Tạo Embed truyền thống (để tương thích ngược khi Discord guild chưa mở V2)
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(colorHex);

  if (config.embed?.image) {
    embed.setImage(config.embed.image);
  }
  if (config.embed?.thumbnail) {
    embed.setThumbnail(config.embed.thumbnail);
  }
  if (config.embed?.footer) {
    embed.setFooter({ text: config.embed.footer });
  }

  return {
    container,
    embed,
    row,
    v2Payload: {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    },
    classicPayload: {
      embeds: [embed],
      components: [row]
    }
  };
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
    : '⚠️ *Chưa chọn*';

  const removeRoleDisplay = config.removeRoleId
    ? `<@&${config.removeRoleId}>`
    : '*Không gỡ role nào*';

  const modeDisplay = config.mode === 'AUTO'
    ? '🤖 **Tự động (AUTO)**'
    : '👮 **Admin duyệt (MANUAL_REVIEW)**';

  const reviewChannelDisplay = config.reviewChannelId
    ? `<#${config.reviewChannelId}>`
    : (config.mode === 'MANUAL_REVIEW' ? '⚠️ *Chưa chọn kênh duyệt!*' : '*Không áp dụng ở chế độ tự động*');

  const btnStyle = String(config.embed?.buttonStyle || 'SECONDARY').toUpperCase();
  let btnColorText = '🔘 Xám (Không màu - Mặc định)';
  if (btnStyle === 'SUCCESS' || btnStyle === 'XANH_LA') btnColorText = '🟢 Xanh lá';
  if (btnStyle === 'PRIMARY' || btnStyle === 'XANH_DUONG') btnColorText = '🔵 Xanh dương';
  if (btnStyle === 'DANGER' || btnStyle === 'DO') btnColorText = '🔴 Đỏ';

  const embed = new EmbedBuilder()
    .setTitle('🛠️ BẢNG ĐIỀU KHIỂN XÁC MINH (CONTROL PANEL)')
    .setDescription('Chọn các menu hoặc nút bấm bên dưới để tùy chỉnh toàn bộ hệ thống xác minh trực tiếp bằng giao diện tương tác.')
    .setColor(config.embed?.color || '#2B2D31')
    .addFields(
      { name: '🎭 Role sẽ cấp', value: roleDisplay, inline: true },
      { name: '🚫 Role sẽ gỡ (Unverify)', value: removeRoleDisplay, inline: true },
      { name: '🛡️ Chế độ xác minh', value: modeDisplay, inline: true },
      { name: '📋 Kênh Admin duyệt', value: reviewChannelDisplay, inline: false },
      {
        name: '📝 Nội dung bảng xác minh (Component V2)',
        value: `**Tiêu đề:** ${config.embed?.title || 'Chưa đặt'}\n**Kiểu nút:** ${btnColorText}\n**Chữ nút:** ${config.embed?.buttonEmoji || ''} ${config.embed?.buttonLabel || 'Xác minh'}\n**Ảnh Banner:** ${config.embed?.image ? `[Xem ảnh](${config.embed.image})` : '*Chưa có*'}\n**Logo nhỏ:** ${config.embed?.thumbnail ? `[Xem logo](${config.embed.thumbnail})` : '*Chưa có*'}\n**Chân trang:** ${config.embed?.footer || '*Không có*'}`,
        inline: false
      },
      {
        name: '💬 Tin nhắn phản hồi thành viên',
        value: `**Thành công:** ${config.messages?.successAuto ? config.messages.successAuto.slice(0, 50) + '...' : '*Mặc định*'}\n**Thất bại:** ${config.messages?.failedAuto ? config.messages.failedAuto.slice(0, 50) + '...' : '*Mặc định*'}\n**Chờ duyệt:** ${config.messages?.submittedReview ? config.messages.submittedReview.slice(0, 50) + '...' : '*Mặc định*'}`,
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

  // Row 1: Chọn Role sẽ cấp bằng Dropdown native của Discord
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId('select_cfg_role')
    .setPlaceholder('🎭 Chọn Role sẽ cấp cho thành viên...')
    .setMinValues(1)
    .setMaxValues(1);
  const rowRole = new ActionRowBuilder().addComponents(roleSelect);

  // Row 2: Chọn Role Unverify sẽ gỡ
  const removeRoleSelect = new RoleSelectMenuBuilder()
    .setCustomId('select_cfg_remove_role')
    .setPlaceholder('🚫 Chọn Role sẽ GỠ khi xác minh (Unverified Role)...')
    .setMinValues(1)
    .setMaxValues(1);
  const rowRemoveRole = new ActionRowBuilder().addComponents(removeRoleSelect);

  // Row 3: Chọn Kênh duyệt bằng Dropdown native của Discord
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('select_cfg_channel')
    .setPlaceholder('📋 Chọn Kênh nhận phiếu duyệt cho Admin...')
    .addChannelTypes(ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);
  const rowChannel = new ActionRowBuilder().addComponents(channelSelect);

  // Row 4: Các nút chỉnh sửa nội dung, câu hỏi & tin nhắn phản hồi
  const btnEditContent = new ButtonBuilder()
    .setCustomId('btn_cfg_edit_content')
    .setLabel('Nội Dung & Banner')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📝');

  const btnEditReplyMsg = new ButtonBuilder()
    .setCustomId('btn_cfg_edit_reply_msg')
    .setLabel('Tin Nhắn Reply')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('💬');

  const btnEditQuestions = new ButtonBuilder()
    .setCustomId('btn_cfg_edit_questions')
    .setLabel('Câu Hỏi')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('❓');

  const rowButtons1 = new ActionRowBuilder().addComponents(
    btnEditContent,
    btnEditReplyMsg,
    btnEditQuestions
  );

  // Row 5: Đổi chế độ, màu nút và gửi bảng xác minh
  const btnToggleMode = new ButtonBuilder()
    .setCustomId('btn_cfg_toggle_mode')
    .setLabel(`Chế Độ (${config.mode === 'AUTO' ? 'Tự Động' : 'Duyệt'})`)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🛡️');

  const btnToggleColor = new ButtonBuilder()
    .setCustomId('btn_cfg_toggle_btn_color')
    .setLabel('Màu Nút')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🎨');

  const btnDeploy = new ButtonBuilder()
    .setCustomId('btn_cfg_deploy_verify')
    .setLabel('Gửi Bảng Verify')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🚀');

  const rowButtons2 = new ActionRowBuilder().addComponents(
    btnToggleMode,
    btnToggleColor,
    btnDeploy
  );

  return { embed, components: [rowRole, rowRemoveRole, rowChannel, rowButtons1, rowButtons2] };
}

module.exports = {
  createVerifyMessage,
  createReviewCard,
  createLogEmbed,
  createDashboard,
  getButtonStyle
};
