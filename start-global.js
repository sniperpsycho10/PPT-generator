const localtunnel = require('localtunnel');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 4000 });
    console.log(`\n\x1b[32m> Global Tunnel Active: ${tunnel.url}\x1b[0m\n`);
    
    // Write URL for the app to read
    fs.writeFileSync('.tunnel-url', tunnel.url);

    // Start Next.js
    const nextProcess = spawn('npm', ['run', 'dev:local'], { stdio: 'inherit', shell: true });

    nextProcess.on('close', (code) => {
      tunnel.close();
      if (fs.existsSync('.tunnel-url')) {
        fs.unlinkSync('.tunnel-url');
      }
      process.exit(code);
    });

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    // Cleanup on exit
    process.on('SIGINT', () => {
      tunnel.close();
      if (fs.existsSync('.tunnel-url')) {
        fs.unlinkSync('.tunnel-url');
      }
      process.exit();
    });
  } catch (err) {
    console.error("Tunnel error:", err);
  }
})();
