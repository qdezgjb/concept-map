#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
概念图自动生成系统 - DeepSeek API对话服务
"""

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# DeepSeek API配置
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')

class DeepSeekAPI:
    """DeepSeek API客户端"""
    
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.base_url = DEEPSEEK_BASE_URL
        self.model = DEEPSEEK_MODEL
        
        if not self.api_key:
            raise ValueError("DeepSeek API密钥未配置")
    
    def chat(self, message, max_tokens=2000, temperature=0.7):
        """与DeepSeek对话"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user", 
                        "content": message
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                return {
                    "success": True,
                    "response": content
                }
            else:
                logger.error(f"API请求失败: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API请求失败: {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "请求超时"
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"请求异常: {str(e)}")
            return {
                "success": False,
                "error": f"请求异常: {str(e)}"
            }
        except Exception as e:
            logger.error(f"未知错误: {str(e)}")
            return {
                "success": False,
                "error": f"未知错误: {str(e)}"
            }

# 创建DeepSeek API实例
try:
    deepseek_api = DeepSeekAPI()
except ValueError as e:
    logger.error(f"DeepSeek API初始化失败: {e}")
    deepseek_api = None

@app.route('/api/chat', methods=['POST'])
def chat_with_deepseek():
    """与DeepSeek对话接口"""
    if not deepseek_api:
        return jsonify({
            "success": False,
            "error": "DeepSeek API未配置"
        }), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "请求数据为空"
            }), 400
        
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                "success": False,
                "error": "消息内容为空"
            }), 400
        
        logger.info(f"收到对话请求: {message[:50]}...")
        
        # 调用DeepSeek API
        result = deepseek_api.chat(message)
        
        if result["success"]:
            logger.info("对话成功")
            return jsonify(result)
        else:
            logger.error(f"对话失败: {result['error']}")
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"服务器内部错误: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "healthy",
        "api_configured": deepseek_api is not None,
        "timestamp": "2024-01-01T00:00:00Z"
    })

if __name__ == '__main__':
    # 优先使用环境变量中的端口，如果没有则使用5000
    port = int(os.getenv('FLASK_PORT', os.getenv('PORT', 5000)))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"启动DeepSeek对话服务，端口: {port}")
    logger.info(f"DeepSeek API配置状态: {'已配置' if deepseek_api else '未配置'}")
    
    # 启动Flask服务
    import threading
    import time
    import webbrowser
    
    def open_browser():
        """延迟打开浏览器，确保服务已启动"""
        time.sleep(3)  # 等待3秒让服务完全启动
        try:
            # 获取当前工作目录的上级目录（web文件夹所在位置）
            import os
            current_dir = os.getcwd()
            parent_dir = os.path.dirname(current_dir)
            web_path = os.path.join(parent_dir, 'web', 'index.html')
            
            # 转换为文件URL格式
            if os.path.exists(web_path):
                file_url = f"file:///{web_path.replace(os.sep, '/')}"
                webbrowser.open(file_url)
                logger.info(f"已自动打开浏览器: {file_url}")
            else:
                # 如果文件不存在，打开本地服务地址
                webbrowser.open(f"http://localhost:{port}")
                logger.info(f"已自动打开浏览器: http://localhost:{port}")
        except Exception as e:
            logger.error(f"自动打开浏览器失败: {e}")
    
    # 在新线程中启动浏览器
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    logger.info("服务启动中，3秒后自动打开浏览器...")
    
    app.run(host='0.0.0.0', port=port, debug=debug) 