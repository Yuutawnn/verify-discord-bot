require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[CẢNH BÁO] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute".`);
  }
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Lỗi: Bạn chưa cung cấp DISCORD_TOKEN hoặc CLIENT_ID trong file .env!');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`⏳ Đang bắt đầu đăng ký ${commands.length} lệnh Slash...`);

    let data;
    if (guildId) {
      // Đăng ký cho 1 server cụ thể (Cập nhật NGAY LẬP TỨC)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`✅ Đã đăng ký thành công ${data.length} lệnh cho Server (Guild ID: ${guildId})!`);
    } else {
      // Đăng ký toàn cục (Global - có thể mất vài phút đến 1 tiếng để Discord đồng bộ)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`✅ Đã đăng ký thành công ${data.length} lệnh toàn cục (Global)!`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký lệnh Slash:', error);
  }
})();
