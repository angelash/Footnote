#!/bin/bash
# n8n 从实例启动脚本
export N8N_PORT=5680
export N8N_HOST=0.0.0.0
export N8N_PROTOCOL=http
# Allow HTTP on localhost without Secure cookies (needed for Windows PowerShell REST automation).
# Otherwise /rest/login sets `Secure` cookies that won't be stored over http:// and subsequent REST calls become Unauthorized.
export N8N_SECURE_COOKIE=false
export NODE_ENV=production

exec n8n start

