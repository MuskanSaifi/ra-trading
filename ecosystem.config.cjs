/**
 * PM2 — production on port 3005
 * On VPS: pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "ra-trading",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3005",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "900M",
      env: {
        NODE_ENV: "production",
        PORT: "3005",
      },
    },
  ],
};
