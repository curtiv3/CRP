module.exports = {
  apps: [
    {
      name: "crp-web",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "./logs/web-out.log",
      error_file: "./logs/web-error.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "crp-worker",
      script: "npx",
      args: "tsx src/lib/jobs/worker.ts",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/worker-out.log",
      error_file: "./logs/worker-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
