const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createVerifyMessage } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-verify')
    .setDescription('Gửi bảng xác minh thành viên vào kênh được chỉ định')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Kênh muốn đặt bảng xác minh (mặc định là kênh hiện tại)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {object} config 
   */
  async execute(interaction, config) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    if (!targetChannel.isTextBased()) {
      return interaction.reply({
        content: '❌ Kênh được chọn phải là kênh văn bản (Text Channel)!',
        ephemeral: true
      });
    }

    try {
      const verifyMsg = createVerifyMessage(config);
      try {
        // Ưu tiên gửi dạng Component V2 (nút nằm trọn trong embed container)
        await targetChannel.send(verifyMsg.v2Payload);
      } catch (v2Error) {
        console.warn('⚠️ Server chưa kích hoạt Components V2 từ Discord, tự động gửi dạng Embed chuẩn:', v2Error.message);
        await targetChannel.send(verifyMsg.classicPayload);
      }

      return interaction.reply({
        content: `✅ Đã gửi bảng xác minh thành công vào kênh ${targetChannel}!`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Lỗi khi gửi bảng xác minh:', error);
      return interaction.reply({
        content: `❌ Không thể gửi tin nhắn vào kênh ${targetChannel}. Vui lòng kiểm tra quyền gửi tin nhắn của bot!`,
        ephemeral: true
      });
    }
  }
};
