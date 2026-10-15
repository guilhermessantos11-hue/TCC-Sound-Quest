const { spawn } = require('child_process');
const path = require('path');

function run(name, args, cwd) {
  const child = spawn('npm', args, {
    cwd: path.join(__dirname, cwd),
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => console.log(`[${name}] saiu com código ${code}`));
  return child;
}

run('backend', ['start'], 'backend');
run('frontend', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], 'frontend');
