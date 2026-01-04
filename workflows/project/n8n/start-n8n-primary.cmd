@echo off
REM n8n 主实例启动脚本（用于 PM2 / Windows）

set N8N_PORT=5678
set N8N_HOST=0.0.0.0
set N8N_PROTOCOL=http
REM Allow HTTP on localhost without Secure cookies (needed for PowerShell REST automation).
set N8N_SECURE_COOKIE=false
set NODE_ENV=production

REM 固定数据目录，避免“换运行用户/换启动方式”导致 .n8n 位置变化（账号/工作流看似丢失）
REM 可通过外部环境覆盖：N8N_USER_FOLDER
if "%N8N_USER_FOLDER%"=="" set N8N_USER_FOLDER=F:\workspace\github\Footnote\local\n8n-primary

REM 如需 Basic Auth（可选）
set N8N_BASIC_AUTH_ACTIVE=true
set N8N_BASIC_AUTH_USER=admin@footnote.local
set N8N_BASIC_AUTH_PASSWORD=Footnote2025!

n8n start


