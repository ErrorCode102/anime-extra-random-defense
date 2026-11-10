#!/usr/bin/env node
/* ============================================================
   tunnel.js  —  starts server.js + cloudflared/ngrok tunnel
   Usage:  node tunnel.js

   Outputs a  wss://  URL to paste into the game's server field.
   ============================================================ */
const { spawn, exec } = require('child_process');
const path = require('path');

const PORT = 8765;

/* ---- start game server ---- */
console.log('\n[1/2] Starting game server on port', PORT, '...');
const srv = spawn('node', ['server.js', String(PORT)], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stdout.on('data', d => process.stdout.write('[server] ' + d));
srv.stderr.on('data', d => process.stderr.write('[server] ' + d));
srv.on('exit', code => console.log('[server] exited', code));

setTimeout(() => {
  /* ---- try cloudflared (no account needed) ---- */
  console.log('\n[2/2] Starting Cloudflare Quick Tunnel ...');
  console.log('      (looking for cloudflared in PATH or current folder)\n');

  const cfPaths = ['cloudflared', path.join(__dirname, 'cloudflared.exe'), path.join(__dirname, 'cloudflared')];
  let cfPath = null;

  /* find cloudflared */
  const { execSync } = require('child_process');
  for (const p of cfPaths) {
    try {
      execSync(`"${p}" --version`, { stdio: 'ignore' });
      cfPath = p;
      break;
    } catch (e) {}
  }

  if (!cfPath) {
    console.log('  cloudflared not found. Trying ngrok ...');
    tryNgrok();
    return;
  }

  const cf = spawn(cfPath, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  cf.stdout.on('data', d => {
    const s = d.toString();
    process.stdout.write(s);
    const m = s.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m) printWssUrl(m[0]);
  });
  cf.stderr.on('data', d => {
    const s = d.toString();
    process.stderr.write(s);
    const m = s.match(/https:\/\/[a-z0-9-]+\.(trycloudflare\.com|ngrok[^/\s]*)/i);
    if (m) printWssUrl(m[0]);
  });

  cf.on('exit', code => {
    if (code !== 0) { console.log('\n  cloudflared failed, trying ngrok ...'); tryNgrok(); }
  });

}, 1500);

function tryNgrok() {
  exec('ngrok http ' + PORT, { cwd: __dirname }, (err) => {
    if (err) {
      console.log('\n  ✗ Neither cloudflared nor ngrok found.\n');
      console.log('  Download cloudflared.exe from:');
      console.log('  https://github.com/cloudflare/cloudflared/releases/latest\n');
      console.log('  Put it in the same folder as this script, then run again.\n');
      console.log('  ─────────────────────────────────────────────');
      console.log('  For LAN play (same network only):');
      console.log('  Open http://[YOUR-IP]:' + PORT + ' on all devices');
      console.log('  ─────────────────────────────────────────────\n');
    }
  });

  /* read ngrok public URL via its local API */
  setTimeout(() => {
    const http = require('http');
    http.get('http://localhost:4040/api/tunnels', res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const t = JSON.parse(body).tunnels.find(t => t.proto === 'https');
          if (t) printWssUrl(t.public_url);
        } catch (e) {}
      });
    }).on('error', () => {});
  }, 3000);
}

function printWssUrl(httpsUrl) {
  const wss = httpsUrl.replace(/^https:\/\//, 'wss://');
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║  ✓ Tunnel active!  Paste this into the game:        ║');
  console.log('  ║                                                      ║');
  console.log('  ║  ' + wss.padEnd(52) + '║');
  console.log('  ║                                                      ║');
  console.log('  ║  Open game → Co-op → Enter server address above     ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('\n');
}

process.on('SIGINT', () => { srv.kill(); process.exit(); });
process.on('SIGTERM', () => { srv.kill(); process.exit(); });
