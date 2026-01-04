// PM2 配置文件 - Windows 主实例
// 注意：PM2 需要 CommonJS 格式
module.exports = {
  apps: [
    {
      name: 'n8n-primary',
      script: 'tools\\n8n\\start-n8n-primary.cmd',
      interpreter: 'none',
      cwd: 'F:\\workspace\\github\\Footnote',
      env: {
        N8N_PORT: 5678,
        N8N_HOST: '0.0.0.0',
        N8N_PROTOCOL: 'http',
        // 固定数据目录，避免“换运行用户/换启动方式”导致 .n8n 位置变化（账号/工作流看似丢失）
        // 如需自定义：通过外部环境变量覆盖 N8N_USER_FOLDER
        N8N_USER_FOLDER: process.env.N8N_USER_FOLDER || 'F:\\workspace\\github\\Footnote\\local\\n8n-primary',
        N8N_BASIC_AUTH_ACTIVE: 'true',
        N8N_BASIC_AUTH_USER: 'admin@footnote.local',
        N8N_BASIC_AUTH_PASSWORD: 'Footnote2025!',
        N8N_METRICS: 'true',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/n8n-primary-error.log',
      out_file: './logs/n8n-primary-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};

