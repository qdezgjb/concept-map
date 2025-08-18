@echo off
chcp 65001 >nul
echo 启动DeepSeek对话服务...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

REM 检查是否已安装依赖
echo 检查Python依赖...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo 安装Python依赖...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

REM 查找可用端口
set PORT=5000
:check_port
netstat -an | find ":%PORT%" >nul 2>&1
if not errorlevel 1 (
    echo 端口 %PORT% 已被占用，尝试下一个端口...
    set /a PORT+=1
    goto check_port
)

echo.
echo 启动Flask服务器...
echo 使用端口: %PORT%
echo 服务地址: http://localhost:%PORT%
echo API接口: http://localhost:%PORT%/api/chat
echo.

cd llm
set FLASK_PORT=%PORT%

REM 显示服务状态
echo.
echo ========================================
echo 服务配置完成！
echo 端口: %PORT%
echo 服务地址: http://localhost:%PORT%
echo ========================================
echo.
echo 正在启动Flask服务...
echo 服务启动后会自动打开浏览器
echo.
echo 提示: 关闭此窗口将停止Flask服务
echo.

REM 直接在当前窗口中启动Flask服务
python app.py

REM 注意：以下代码不会执行，因为Flask服务会一直运行
REM 只有当Flask服务停止时，才会执行到这里
echo.
echo Flask服务已停止
pause 