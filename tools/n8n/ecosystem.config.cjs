// PM2 配置文件 - Windows 主实例
// NOTE: 工程 root 的 package.json 可能是 "type": "module"
// 为避免 PM2 按 ESM 解析导致 "module is not defined"，这里使用 .cjs 强制 CommonJS。

module.exports = {
  apps: [
    {
      name: 'n8n-primary',
      // 在 Windows 上，PM2 直接 spawn .cmd 偶发 EINVAL；
      // 用 cmd /c 显式执行更稳定。
      script: 'cmd',
      args: ['/c', 'tools\\n8n\\start-n8n-primary.cmd'],
      interpreter: 'none',
      cwd: 'F:\\workspace\\github\\Footnote',
      env: {
        N8N_PORT: 5678,
        N8N_HOST: '0.0.0.0',
        N8N_PROTOCOL: 'http',
        N8N_BASIC_AUTH_ACTIVE: 'true',
        N8N_BASIC_AUTH_USER: 'admin@footnote.local',
        N8N_BASIC_AUTH_PASSWORD: 'Footnote2025!',
        N8N_METRICS: 'true',
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/n8n-primary-error.log',
      out_file: './logs/n8n-primary-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
    {
      name: 'mcp-runner-server',
      script: 'node',
      args: ['tools\\mcp-runner\\server.mjs'],
      interpreter: 'none',
      cwd: 'F:\\workspace\\github\\Footnote',
      env: {
        HOST: '127.0.0.1',
        PORT: 3211,
        // NOTE: Do NOT commit secrets here.
        // Configure CUSTOM_API_URL / CUSTOM_API_KEY / CUSTOM_MODELS via user env or .env.local.
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/mcp-runner-server-error.log',
      out_file: './logs/mcp-runner-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
};


