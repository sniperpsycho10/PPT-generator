const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tunnelFile = path.join(__dirname, '.tunnel-url');

function startTunnel() {
  console.log('Starting cloudflared tunnel...');
  const tunnel = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:4000']);

  tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    console.log(output.trim());
    
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      console.log(`\n>>> TUNNEL ONLINE: ${url} <<<\n`);
      fs.writeFileSync(tunnelFile, url);
    }
  });

  tunnel.on('close', (code) => {
    console.log(`Tunnel closed with code ${code}. Restarting in 3 seconds...`);
    if (fs.existsSync(tunnelFile)) fs.unlinkSync(tunnelFile);
    setTimeout(startTunnel, 3000);
  });
}

process.on('SIGINT', () => {
  if (fs.existsSync(tunnelFile)) fs.unlinkSync(tunnelFile);
  process.exit();
});
process.on('SIGTERM', () => {
  if (fs.existsSync(tunnelFile)) fs.unlinkSync(tunnelFile);
  process.exit();
});

startTunnel();
