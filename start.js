const { spawn } = require("child_process");
const path = require("path");

function run(name, cwd, command, args) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env
  });
  child.on("exit", (code) => {
    console.log(`${name} exited with ${code}`);
    process.exit(code || 0);
  });
  return child;
}

run("api", path.join(__dirname, "backend"), "node", ["src/server.js"]);
run("web", path.join(__dirname, "frontend"), "npx", ["vite", "--host", "0.0.0.0", "--port", "5173"]);
