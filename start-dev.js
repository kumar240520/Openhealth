/**
 * OpenHealth Unified Dev Server Runner
 * Runs both Backend (port 5000) and Frontend (port 3000) simultaneously with a single command!
 */
const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// ANSI Color Codes for clean console distinction
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

console.log(`
${C.bold}${C.cyan}================================================================${C.reset}
${C.bold}${C.green}   🏥 OPENHEALTH UNIFIED FULL-STACK DEVELOPMENT RUNNER        ${C.reset}
${C.bold}${C.cyan}================================================================${C.reset}
  ${C.bold}🌐 Frontend UI:${C.reset}    ${C.green}http://localhost:3000${C.reset}
  ${C.bold}📡 Backend API:${C.reset}    ${C.cyan}http://localhost:5000/api/v1${C.reset}
  ${C.bold}🩺 Health Check:${C.reset}   ${C.cyan}http://localhost:5000/api/health${C.reset}
  ${C.bold}⌨️  Stop Servers:${C.reset}   Press ${C.yellow}Ctrl + C${C.reset} anytime to terminate both
${C.bold}${C.cyan}================================================================${C.reset}
`);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Spawn Backend Process
const backendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendDir,
  env: { ...process.env, PORT: '5000' },
  shell: isWindows
});

backendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${C.cyan}[BACKEND]${C.reset} ${line}`);
    }
  });
});

backendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.error(`${C.red}[BACKEND ERR]${C.reset} ${line}`);
    }
  });
});

// 2. Spawn Frontend Process
const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  env: { ...process.env },
  shell: isWindows
});

frontendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${C.green}[FRONTEND]${C.reset} ${line}`);
    }
  });
});

frontendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.error(`${C.yellow}[FRONTEND]${C.reset} ${line}`);
    }
  });
});

// Graceful Cleanup on Exit
function shutdown() {
  console.log(`\n${C.yellow}Shutting down OpenHealth backend and frontend...${C.reset}`);
  
  if (isWindows) {
    if (backendProcess.pid) {
      try { spawn('taskkill', ['/pid', backendProcess.pid, '/T', '/F']); } catch (e) {}
    }
    if (frontendProcess.pid) {
      try { spawn('taskkill', ['/pid', frontendProcess.pid, '/T', '/F']); } catch (e) {}
    }
  } else {
    try { backendProcess.kill('SIGTERM'); } catch (e) {}
    try { frontendProcess.kill('SIGTERM'); } catch (e) {}
  }
  
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
