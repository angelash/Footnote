#!/bin/bash
# n8n 从实例启动脚本
export N8N_PORT=5680
export N8N_HOST=0.0.0.0
export N8N_PROTOCOL=http
export NODE_ENV=production

exec n8n start

