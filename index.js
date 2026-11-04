require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ActivityType
} = require('discord.js');

// Xác định đường dẫn tương đối (hỗ trợ cả khi chạy từ thư mục gốc hoặc thư mục src)
const utilsPath = fs.existsSync(path.join(__dirname, 'utils')) ? './utils' : './src/utils';
const interactionsPath = fs.existsSync(path.join(__dirname, 'interactions')) ? './interactions' : './src/interactions';

const { loadConfig } = require(`${utilsPath}/configLoader`);
const { handleButtonClick } = require(`${interactionsPath}/buttonClick`);
const { handleModalSubmit } = require(`${interactionsPath}/modalSubmit`);

// Nạp cấu hình từ config.json
const config = loadConfig();

// Khởi tạo Client với các quyền (Intents) cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Cần bật Server Members Intent trong Discord Developer Portal
    GatewayIntentBits.GuildMessages
  ]
});

// Nạp danh sách lệnh Slash
client.commands = new Collection();
const commandsDir = fs.existsSync(path.join(__dirname, 'commands')) 
  ? path.join(__dirname, 'commands') 
  : path.join(__dirname, 'src/commands');

if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

// Khi bot sẵn sàng hoạt động
client.once(Events.ClientReady, (readyClient) => {
  console.log('----------------------------------------------------');
  console.log(`🤖 Bot đã online với tên: ${readyClient.user.tag}`);
  console.log(`🛡️ Chế độ xác minh hiện tại: [${config.mode || 'AUTO'}]`);
  console.log(`🌐 Đang phục vụ trên ${readyClient.guilds.cache.size} server`);
  console.log('----------------------------------------------------');

  readyClient.user.setPresence({
    activities: [{ name: 'bảo vệ server | /setup-verify', type: ActivityType.Custom }],
    status: 'online'
  });
});

// Xử lý các tương tác (Slash Commands, Buttons, Modals)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Luôn tải lại cấu hình mới nhất để không cần khởi động lại bot khi sửa file
    const currentConfig = loadConfig();

    // 1. Xử lý Slash Command
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`Không tìm thấy lệnh: ${interaction.commandName}`);
        return;
      }

      await command.execute(interaction, currentConfig);
      return;
    }

    // 2. Xử lý Nút bấm (Button)
    if (interaction.isButton()) {
      await handleButtonClick(interaction, currentConfig);
      return;
    }

    // 3. Xử lý Nộp Form (Modal Submit)
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction, currentConfig);
      return;
    }
  } catch (error) {
    console.error('❌ Lỗi khi xử lý tương tác:', error);
    const errorMsg = '⚠️ Đã xảy ra lỗi nội bộ khi thực hiện thao tác này!';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
});

// Bắt các ngoại lệ không mong muốn để bot không bị crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Đăng nhập bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ Lỗi: Chưa cung cấp DISCORD_TOKEN trong file .env!');
  console.log('👉 Vui lòng mở file .env và dán token bot vào.');
  process.exit(1);
}

client.login(token);
