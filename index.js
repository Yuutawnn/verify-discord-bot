// File khởi động chính cho hosting panel (Pterodactyl, VPS, v.v.)
try {
  require('./src/index.js');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n------------------------------------------------------------');
    console.error('❌ LỖI: THIẾU CÁC GÓI THƯ VIỆN (MODULE_NOT_FOUND)!');
    console.error('👉 Khắc phục trên Hosting Panel:');
    console.error('   1. Vào Console gõ lệnh: npm install');
    console.error('   2. Hoặc vào tab "Startup" -> Bật "Auto Install Packages" rồi Khởi động lại.');
    console.error('------------------------------------------------------------\n');
  }
  throw error;
}
