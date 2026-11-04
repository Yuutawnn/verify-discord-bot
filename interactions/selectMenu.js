const { PermissionFlagsBits } = require('discord.js');
const { getRawConfig, saveRawConfig, loadConfig } = require('../utils/configLoader');
const { createDashboard } = require('../utils/embeds');

/**
 * Xử lý các tương tác Chọn từ Menu (RoleSelect, ChannelSelect, StringSelect)
 * @param {import('discord.js').AnySelectMenuInteraction} interaction 
 * @param {object} config 
 */
async function handleSelectMenu(interaction, config) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ Chỉ có Quản trị viên (Administrator) mới có quyền chỉnh sửa cài đặt!',
      ephemeral: true
    });
  }

  const { customId, guild, values } = interaction;
  const raw = getRawConfig();

  // 1. Chọn Role thành viên
  if (customId === 'select_cfg_role') {
    const selectedRoleId = values[0];
    const selectedRole = guild.roles.cache.get(selectedRoleId);

    // Kiểm tra phân quyền thứ tự role
    const botMember = guild.members.me;
    let warningMsg = '';
    if (selectedRole && botMember.roles.highest.position <= selectedRole.position) {
      warningMsg = `\n⚠️ **Lưu ý:** Role ${selectedRole} đang cao hơn hoặc bằng Role của Bot. Hãy vào *Server Settings -> Roles* kéo Role của Bot lên trên!`;
    }

    raw.role_id = selectedRoleId;
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    await interaction.update({ embeds: [embed], components });
    if (warningMsg) {
      await interaction.followUp({ content: warningMsg, ephemeral: true }).catch(() => {});
    }
    return;
  }

  // 2. Chọn Kênh Admin duyệt
  if (customId === 'select_cfg_channel') {
    const selectedChannelId = values[0];
    raw.kenh_admin_duyet = selectedChannelId;
    saveRawConfig(raw);

    const newConfig = loadConfig();
    const { embed, components } = createDashboard(guild, newConfig);

    await interaction.update({ embeds: [embed], components });
    return;
  }
}

module.exports = { handleSelectMenu };
