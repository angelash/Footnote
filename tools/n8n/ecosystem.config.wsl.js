// PM2 配置文件 - WSL 从实例
module.exports = {
  apps: [
    {
      name: 'n8n-secondary',
      script: 'n8n',
      args: 'start',
      cwd: '/home/shash/work/Footnote',
      env: {
        N8N_PORT: 5679,
        N8N_HOST: '0.0.0.0',
        N8N_PROTOCOL: 'http',
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
      error_file: './logs/n8n-secondary-error.log',
      out_file: './logs/n8n-secondary-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};

