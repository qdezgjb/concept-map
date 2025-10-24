#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
概念图自动生成系统 - DeepSeek API对话服务
"""

import os
import json
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from openai import OpenAI

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})  # 允许跨域请求

# DeepSeek API配置
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')

class DeepSeekAPI:
    """DeepSeek API客户端（使用OpenAI SDK）"""
    
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.base_url = DEEPSEEK_BASE_URL
        self.model = DEEPSEEK_MODEL
        
        if not self.api_key:
            raise ValueError("DeepSeek API密钥未配置")
        
        # 创建OpenAI客户端
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )
        
        logger.info(f"DeepSeek API客户端初始化成功 (model: {self.model}, base_url: {self.base_url})")
    
    def chat(self, message, max_tokens=None, temperature=0.3, max_retries=2, system_prompt=None, timeout=60):
        """与DeepSeek对话，支持重试机制
        
        优化参数：
        - max_tokens: None (不限制输出长度，让模型完整输出)
        - temperature: 0.3 (降低随机性，更快更集中)
        - max_retries: 2 (增加重试次数，提高成功率)
        - timeout: 60 (60秒超时，防止长时间等待)
        """
        # 如果没有指定system_prompt，使用默认的
        if system_prompt is None:
            system_prompt = "你是一个专业的知识提取助手。请严格按照要求的格式输出，不要添加任何额外的解释或说明。"
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"尝试第 {attempt + 1} 次调用DeepSeek API...")
                logger.info(f"消息长度: {len(message)} 字符")
                
                # 构建API调用参数
                api_params = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "temperature": temperature,
                    "stream": False,
                    "top_p": 0.9,
                    "timeout": timeout
                }
                
                # 只有当 max_tokens 不为 None 时才添加该参数
                if max_tokens is not None:
                    api_params["max_tokens"] = max_tokens
                    logger.info(f"使用 max_tokens 限制: {max_tokens}")
                else:
                    logger.info("不限制 max_tokens，让模型完整输出")
                
                response = self.client.chat.completions.create(**api_params)
                
                content = response.choices[0].message.content
                logger.info(f"DeepSeek API调用成功，返回内容长度: {len(content)} 字符")
                return {
                    "success": True,
                    "response": content
                }
                    
            except Exception as e:
                error_msg = str(e)
                logger.error(f"第 {attempt + 1} 次调用失败: {error_msg}")
                
                # 区分超时错误和其他错误
                if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                    logger.error("API调用超时")
                    if attempt == max_retries:
                        return {
                            "success": False,
                            "error": f"API调用超时（{timeout}秒），请稍后重试或使用更简短的文本"
                        }
                else:
                    if attempt == max_retries:
                        return {
                            "success": False,
                            "error": f"API调用失败: {error_msg}"
                        }
                continue
    
    def chat_stream(self, message, max_tokens=None, temperature=0.7, system_prompt=None):
        """与DeepSeek对话（流式输出）
        
        参数：
        - max_tokens: None (不限制输出长度，让模型完整输出)
        - temperature: 0.7 (适中的随机性，生成更自然的文本)
        """
        # 如果没有指定system_prompt，使用默认的
        if system_prompt is None:
            system_prompt = "你是一个知识介绍专家，擅长用简洁清晰的语言介绍各种概念和知识。"
        
        try:
            logger.info("开始流式调用DeepSeek API...")
            
            # 构建API调用参数
            api_params = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "temperature": temperature,
                "stream": True,
                "top_p": 0.9
            }
            
            # 只有当 max_tokens 不为 None 时才添加该参数
            if max_tokens is not None:
                api_params["max_tokens"] = max_tokens
                logger.info(f"流式输出使用 max_tokens 限制: {max_tokens}")
            else:
                logger.info("流式输出不限制 max_tokens，让模型完整输出")
            
            stream = self.client.chat.completions.create(**api_params)
            
            # 流式输出
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    yield {"content": content, "done": False}
            
            # 流结束
            logger.info("流式输出完成")
            yield {"done": True}
                
        except Exception as e:
            logger.error(f"流式API调用异常: {str(e)}", exc_info=True)
            yield {"error": str(e), "done": True}

# 创建DeepSeek API实例
try:
    deepseek_api = DeepSeekAPI()
except ValueError as e:
    logger.error(f"DeepSeek API初始化失败: {e}")
    deepseek_api = None

@app.route('/api/chat', methods=['POST'])
def chat_with_deepseek():
    """与DeepSeek对话接口（非流式）"""
    from datetime import datetime
    request_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    logger.info(f"📥 [/api/chat] 收到请求 - 时间: {request_time}")
    
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
        
        # 记录开始时间
        import time
        start_time = time.time()
        
        # 调用DeepSeek API
        result = deepseek_api.chat(message)
        
        # 计算响应时间
        elapsed_time = time.time() - start_time
        logger.info(f"DeepSeek API响应时间: {elapsed_time:.2f}秒")
        
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

@app.route('/api/chat/stream', methods=['POST', 'OPTIONS'])
def chat_with_deepseek_stream():
    """与DeepSeek对话接口（流式输出）"""
    from datetime import datetime
    request_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    logger.info(f"📥 [/api/chat/stream] 收到请求 - 时间: {request_time}")
    
    # 处理OPTIONS预检请求
    if request.method == 'OPTIONS':
        response = app.make_response('')
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
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
        
        logger.info(f"收到流式对话请求: {message[:50]}...")
        
        # 获取system_prompt参数（如果有）
        system_prompt = data.get('system_prompt', None)
        
        # 调用流式API
        def generate():
            try:
                chunk_count = 0
                for chunk in deepseek_api.chat_stream(message, system_prompt=system_prompt):
                    if chunk:
                        chunk_count += 1
                        chunk_str = json.dumps(chunk, ensure_ascii=False)
                        yield f"data: {chunk_str}\n\n"
                        
                logger.info(f"流式输出完成，共发送 {chunk_count} 个chunk")
                # 发送结束标记
                yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"
                        
            except Exception as e:
                logger.error(f"流式输出错误: {str(e)}", exc_info=True)
                yield f"data: {json.dumps({'error': str(e), 'done': True}, ensure_ascii=False)}\n\n"
        
        response = app.response_class(
            generate(),
            mimetype='text/event-stream'
        )
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'
        response.headers['Connection'] = 'close'  # 关键修复：响应完成后立即关闭连接
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
            
    except Exception as e:
        logger.error(f"处理流式请求时发生错误: {str(e)}")
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

@app.route('/')
def index():
    """提供主页"""
    import os
    # 获取项目根目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    web_dir = os.path.join(parent_dir, 'web')
    index_path = os.path.join(web_dir, 'index.html')
    
    if os.path.exists(index_path):
        from flask import send_file
        return send_file(index_path)
    else:
        return "index.html not found", 404

@app.route('/web/<path:filename>')
def serve_web_static(filename):
    """提供web目录的静态文件"""
    import os
    from flask import send_from_directory
    
    # 获取web目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    web_dir = os.path.join(parent_dir, 'web')
    
    return send_from_directory(web_dir, filename)

@app.route('/algorithm/<path:filename>')
def serve_algorithm_static(filename):
    """提供algorithm目录的静态文件"""
    import os
    from flask import send_from_directory
    
    # 获取algorithm目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    algorithm_dir = os.path.join(parent_dir, 'algorithm')
    
    return send_from_directory(algorithm_dir, filename)

@app.route('/llm/<path:filename>')
def serve_llm_static(filename):
    """提供llm目录的静态文件"""
    import os
    from flask import send_from_directory
    
    # 获取llm目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    return send_from_directory(current_dir, filename)

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
    
    # 使用全局标志防止重复打开浏览器
    browser_opened = False
    
    def open_browser():
        """立即打开浏览器"""
        global browser_opened
        
        # 防止重复打开浏览器
        if browser_opened:
            return
        
        try:
            # 直接打开HTTP服务地址，避免file://协议导致的CORS问题
            url = f"http://localhost:{port}"
            webbrowser.open(url)
            logger.info(f"已自动打开浏览器: {url}")
            
            # 标记浏览器已打开
            browser_opened = True
            
        except Exception as e:
            logger.error(f"自动打开浏览器失败: {e}")
    
    # 只在主进程中打开浏览器（避免debug模式下的重复打开）
    if not debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        # 在新线程中启动浏览器
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        logger.info("服务启动中，立即自动打开浏览器...")
    else:
        logger.info("调试模式下，跳过自动打开浏览器（避免重复打开）")
    
    app.run(host='0.0.0.0', port=port, debug=debug) 