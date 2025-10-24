// 大模型交互模块
// 处理与大模型API的交互，包括三元组提取和概念图生成

/**
 * API配置和端口管理
 */
class LLMConfig {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.currentPort = null; // 缓存当前端口
    }
    
    /**
     * 更新API地址（带缓存优化）
     * @param {boolean} force - 是否强制更新并打印日志
     */
    updateApiUrl(force = false) {
        let newPort = null;
        
        if (window.portChecker) {
            newPort = window.portChecker.getCurrentPort();
        } else {
            // 备用方案：从localStorage获取
            const savedPort = localStorage.getItem('flask_port');
            newPort = savedPort ? parseInt(savedPort) : 5000;
        }
        
        // 只有端口变化或强制更新时才打印日志
        if (newPort !== this.currentPort || force) {
            const oldPort = this.currentPort;
            this.currentPort = newPort;
            this.API_BASE_URL = `http://localhost:${newPort}/api`;
            
            if (force || oldPort === null) {
                // 首次初始化时打印详细信息
                console.log(`✅ API端口已配置: ${newPort}`);
                console.log(`   API地址: ${this.API_BASE_URL}`);
            } else if (oldPort !== newPort) {
                // 端口变化时打印警告
                console.warn(`⚠️ API端口已变更: ${oldPort} → ${newPort}`);
                console.log(`   新API地址: ${this.API_BASE_URL}`);
            }
        }
        // 如果端口未变化，静默更新，不打印日志
    }
}

/**
 * 三元组提取服务
 */
class TripleExtractionService {
    constructor(config) {
        this.config = config;
    }
    
    /**
     * 从文本内容中提取三元组
     * @param {string} introText - 输入文本
     * @returns {Promise<Array>} 三元组数组
     */
    async extractTriplesFromIntro(introText) {
        console.log('🔍 开始三元组提取，文本长度:', introText.length);
        console.log('   文本内容（前200字符）:', introText.substring(0, 200));
        
        try {
            // 静默更新API地址（不打印日志，除非端口变化）
            this.config.updateApiUrl();
            
            // 构建三元组提取提示词（简化版，减少处理时间）
            const triplePrompt = this.buildTriplePrompt(introText);
            
            console.log('   提示词长度:', triplePrompt.length, '字符');
            
            // 直接调用API
            const requestUrl = `${this.config.API_BASE_URL}/chat`;
            const requestBody = { message: triplePrompt };
            
            // 添加超时控制（75秒，略大于后端的60秒超时）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('❌ 请求超时（75秒），正在取消...');
                controller.abort();
            }, 75000); // 75秒超时
            
            try {
                console.log('📤 [三元组提取] 发送请求');
                console.log('   URL:', requestUrl);
                console.log('   时间戳:', new Date().toISOString());
                const fetchStart = performance.now();
                
                const response = await fetch(requestUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                const fetchDuration = ((performance.now() - fetchStart) / 1000).toFixed(2);
                clearTimeout(timeoutId);
                
                console.log(`✅ 收到响应（${fetchDuration}s）- 状态: ${response.status}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    console.log(`   AI返回内容长度: ${result.response.length} 字符`);
                    
                    // 解析三元组（调用data-processing.js中的全局函数）
                    if (typeof window.parseTriplesFromResponse !== 'function') {
                        console.error('❌ parseTriplesFromResponse 函数未定义，请检查 data-processing.js 是否正确加载');
                        console.error('当前 window 对象上的相关函数:', {
                            parseTriplesFromResponse: typeof window.parseTriplesFromResponse,
                            convertTriplesToConceptData: typeof window.convertTriplesToConceptData,
                            convertToD3Format: typeof window.convertToD3Format
                        });
                        return {
                            success: false,
                            error: '三元组解析函数未加载',
                            message: '系统错误：三元组解析函数未加载，请刷新页面重试'
                        };
                    }
                    
                    const triples = window.parseTriplesFromResponse(result.response);
                    console.log(`✅ 成功提取 ${triples.length} 个三元组`);
                    
                    if (triples.length === 0) {
                        console.warn('⚠️ 未能从AI响应中解析到任何三元组');
                        console.log('AI完整响应内容:', result.response);
                        return {
                            success: false,
                            error: '未能解析到三元组',
                            message: 'AI返回了内容，但未能提取到有效的三元组。请检查AI返回格式是否正确。',
                            rawResponse: result.response
                        };
                    }
                    
                    return {
                        success: true,
                        triples: triples,
                        message: `成功从文本中提取 ${triples.length} 个三元组`,
                        rawResponse: result.response
                    };
                } else {
                    console.error('❌ AI响应失败:', result.error);
                    return {
                        success: false,
                        error: result.error || '未知错误',
                        message: `三元组提取失败: ${result.error || '未知错误'}`
                    };
                }
                
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    console.error('❌ 请求超时（75秒）');
                    throw new Error('请求超时：大模型处理时间过长。建议：1) 稍后重试 2) 检查网络连接');
                }
                throw error;
            }
            
        } catch (error) {
            console.error('❌ 三元组提取失败:', error);
            console.error('错误详情:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            let userMessage = '网络请求失败';
            if (error.message.includes('超时')) {
                userMessage = error.message;
            } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
                userMessage = '无法连接到后端服务，请确认：1) 后端服务是否启动 2) 端口是否正确(5000) 3) 网络连接是否正常';
            } else {
                userMessage = `请求失败: ${error.message}`;
            }
            
            return {
                success: false,
                error: error.message,
                message: userMessage
            };
        }
    }
    
    /**
     * 构建三元组提取提示词（三层结构版本）
     * @param {string} introText - 输入文本
     * @returns {string} 提示词
     */
    buildTriplePrompt(introText) {
        // 三层结构提示词：提取8-10个概念，并指定层次关系
        return `# 重要任务：从文本中提取8-10个核心概念，构建三层结构知识图谱

## ⚠️ 严格数量限制（必须遵守）：
- **总概念数：最少8个，最多10个（严格限制）**
- **总三元组数：最少7个，最多9个（严格限制）**
- 第一层（L1）：必须且只有1个核心概念
- 第二层（L2）：必须3-4个子概念（不能超过4个）
- 第三层（L3）：必须4-5个扩展概念（不能超过5个）
- **禁止输出超过10个概念或9个三元组**

## 输出格式（严格遵守）：
每行一个三元组，格式为：(概念1, 关系词, 概念2, 层次)

层次标记：
- L1-L2: 第一层到第二层的关系（3-4个）
- L2-L3: 第二层到第三层的关系（4-5个）
- 禁止L2-L2关系（为了控制节点数量）

## 关系词选择（重要：简洁且能读成完整句子）：
**关系词要简洁，不含助词（如"的"、"了"等），但能让"概念1 + 关系词 + 概念2"连读成通顺的话**

推荐关系词类型（2-4字动词短语）：
- 包含关系：包括、包含、涵盖、含有、构成
- 因果关系：导致、引发、造成、促进、推动、影响
- 层级关系：属于、分为、构成、组成
- 功能关系：用于、应用于、服务于、实现、支持
- 依赖关系：需要、基于、依赖、借助、通过

**示例说明**：
- ✓ 好："辛亥革命" + "背景包括" + "革命思想" → 读："辛亥革命背景包括革命思想"
- ✓ 好："机器学习" + "方法包括" + "神经网络" → 读："机器学习方法包括神经网络"
- ✓ 好："清政腐败" + "引发" + "民众不满" → 读："清政腐败引发民众不满"
- ✗ 差："辛亥革命" + "有" + "革命思想" → 单字动词，太简单
- ✗ 差："革命" + "的原因是" + "腐败" → 包含助词"的"

**禁止使用**：
- 单字关系词如"是"、"有"
- 包含助词的关系词如"的背景是"、"导致了"

## 概念要求：
1. 概念词必须简短（2-6个字）
2. 必须有明确的层次性
3. 第二层是最核心的分类或维度（精选3-4个最重要的）
4. 第三层是具体的细节或实例（精选4-5个最关键的）

## 标准示例（8个概念，7个三元组）：
(人工智能, 领域包括, 机器学习, L1-L2)
(人工智能, 领域包括, 自然语言处理, L1-L2)
(人工智能, 领域包括, 计算机视觉, L1-L2)
(机器学习, 技术包括, 神经网络, L2-L3)
(机器学习, 技术包括, 决策树, L2-L3)
(自然语言处理, 应用于, 机器翻译, L2-L3)
(计算机视觉, 应用于, 图像识别, L2-L3)

## 文本内容：
${introText}

## 最终检查清单：
✓ 总共8-10个不同的概念（包括L1的1个）
✓ 总共7-9个三元组
✓ L1层只有1个概念
✓ L2层有3-4个概念
✓ L3层有4-5个概念
✓ 每个概念2-6个字
✓ 关系词准确，不使用"是"、"有"

请开始输出三元组（记住：最多9个三元组）：`;
    }
    
}

/**
 * 介绍文本生成服务
 */
class IntroductionTextService {
    constructor(config) {
        this.config = config;
    }
    
    /**
     * 流式生成介绍文本
     * @param {string} keyword - 关键词
     * @param {Function} onChunk - 接收文本片段的回调函数
     * @returns {Promise<Object>} 生成结果
     */
    async generateIntroduction(keyword, onChunk) {
        console.log('📝 开始生成介绍文本，关键词:', keyword);
        
        try {
            // 静默更新API地址（不打印日志，除非端口变化）
            this.config.updateApiUrl();
            
            // 构建介绍文本生成提示词
            const prompt = this.buildIntroPrompt(keyword);
            console.log('   提示词长度:', prompt.length, '字符');
            
            const systemPrompt = "你是一个知识介绍专家，擅长用简洁清晰的语言介绍各种概念和知识。请用中文回答，内容保持在一段中，字数严格控制在150字以内。";
            
            // 使用fetch接收流式响应
            const response = await fetch(`${this.config.API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ 
                    message: prompt,
                    system_prompt: systemPrompt
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';
            let streamDone = false; // 标记流是否结束
            
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        console.log('流读取完成（done=true）');
                        break;
                    }
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // 保留不完整的行
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data.trim()) {
                                try {
                                    const chunk = JSON.parse(data);
                                    if (chunk.done) {
                                        console.log('收到done标记，流式输出结束');
                                        streamDone = true;
                                        break; // 跳出for循环
                                    }
                                    if (chunk.content) {
                                        fullText += chunk.content;
                                        onChunk(chunk.content); // 调用回调函数，实时显示
                                    } else if (chunk.error) {
                                        throw new Error(chunk.error);
                                    }
                                } catch (e) {
                                    console.error('解析chunk失败:', e, '原始数据:', data);
                                }
                            }
                        }
                    }
                    
                    // 如果收到done标记，也跳出while循环
                    if (streamDone) {
                        console.log('跳出while循环');
                        break;
                    }
                }
                
                // 处理剩余的buffer
                if (buffer && buffer.trim()) {
                    console.log('处理剩余buffer:', buffer);
                    if (buffer.startsWith('data: ')) {
                        const data = buffer.slice(6);
                        if (data.trim()) {
                            try {
                                const chunk = JSON.parse(data);
                                if (chunk.content) {
                                    fullText += chunk.content;
                                    onChunk(chunk.content);
                                }
                            } catch (e) {
                                console.error('解析最后一个chunk失败:', e);
                            }
                        }
                    }
                }
            } finally {
                // 关键修复：显式释放reader和关闭连接
                try {
                    reader.cancel(); // 取消读取并关闭底层连接
                    console.log('✅ 流式连接已关闭');
                } catch (e) {
                    console.warn('关闭reader时出错:', e);
                }
            }
            
            console.log('介绍文本生成完成，总字数:', fullText.length);
            console.log('生成的完整文本:', fullText.substring(0, 100) + '...');
            
            return {
                success: true,
                text: fullText,
                message: '介绍文本生成完成'
            };
            
        } catch (error) {
            console.error('介绍文本生成失败:', error);
            return {
                success: false,
                error: error.message,
                message: '介绍文本生成失败'
            };
        }
    }
    
    /**
     * 构建介绍文本生成提示词
     * @param {string} keyword - 关键词
     * @returns {string} 提示词
     */
    buildIntroPrompt(keyword) {
        return `请用2-3段话介绍"${keyword}"，要求：

1. 内容全面：涵盖定义、核心概念、主要特点、应用场景
2. 格式清晰：分2-3个段落，每段3-5句话
3. 风格：客观、准确、易懂
4. 深度适中：既有概括也有具体说明

请直接输出介绍文本，不要有标题或其他格式。`;
    }
}

/**
 * 概念图生成服务
 */
class ConceptMapGenerationService {
    constructor(config) {
        this.config = config;
    }
    
    /**
     * 生成概念图
     * @param {string} type - 生成类型 ('keyword' 或 'description')
     * @param {Object} data - 输入数据
     * @returns {Promise<Object>} 生成结果
     */
    async generateConceptMap(type, data) {
        console.log('🗺️ 开始生成概念图，类型:', type, '数据:', data);
        
        try {
            // 静默更新API地址（不打印日志，除非端口变化）
            this.config.updateApiUrl();
            
            // 构建概念图生成提示词
            const conceptPrompt = this.buildConceptPrompt(type, data);
            
            let conceptResponse;
            
            if (type === 'keyword') {
                // 焦点问题模式：只调用概念图生成API，直接生成节点和关系
                console.log('准备发送焦点问题生成请求...');
                console.log('请求URL:', `${this.config.API_BASE_URL}/chat`);
                console.log('请求内容:', conceptPrompt.substring(0, 100) + '...');
                
                // 创建一个带超时的fetch请求
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 50000); // 50秒超时
                
                try {
                    conceptResponse = await fetch(`${this.config.API_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: conceptPrompt }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('请求超时（50秒），请稍后重试');
                    }
                    throw error;
                }
                
                console.log('概念图生成API响应状态:', conceptResponse.status);
            } else {
                // 文本分析模式：只调用概念图生成API，不生成介绍内容
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 50000); // 50秒超时
                
                try {
                    conceptResponse = await fetch(`${this.config.API_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: conceptPrompt }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('请求超时（50秒），请稍后重试');
                    }
                    throw error;
                }
            }
            
            const conceptResult = await conceptResponse.json();
            console.log('概念图生成API响应结果:', conceptResult);
            
            // 处理概念图生成结果
            if (conceptResult.success) {
                console.log('概念图生成成功，开始解析JSON...');
                try {
                    const content = conceptResult.response;
                    const startIdx = content.indexOf('{');
                    const endIdx = content.lastIndexOf('}') + 1;
                    
                    if (startIdx !== -1 && endIdx !== -1) {
                        const jsonContent = content.substring(startIdx, endIdx);
                        const conceptData = JSON.parse(jsonContent);
                        
                        // 提取JSON前后的AI描述文本
                        const beforeJson = content.substring(0, startIdx).trim();
                        const afterJson = content.substring(endIdx).trim();
                        const aiDescription = (beforeJson + ' ' + afterJson).trim();
                        
                        return {
                            success: true,
                            data: conceptData,
                            aiResponse: content, // 保存完整的AI响应
                            aiDescription: aiDescription, // AI的描述文本
                            message: '概念图生成成功！'
                        };
                    } else {
                        throw new Error('响应中未找到有效的JSON数据');
                    }
                } catch (parseError) {
                    console.error('JSON解析失败:', parseError);
                    return {
                        success: false,
                        error: '概念图数据解析失败',
                        message: '概念图数据解析失败'
                    };
                }
            } else {
                let errorMessage = '未知错误';
                if (conceptResult.error) {
                    if (conceptResult.error.includes('timeout') || conceptResult.error.includes('超时')) {
                        errorMessage = 'AI服务响应超时，请稍后重试';
                    } else if (conceptResult.error.includes('HTTPSConnectionPool')) {
                        errorMessage = 'AI服务连接超时，请检查网络或稍后重试';
                    } else {
                        errorMessage = conceptResult.error;
                    }
                }
                
                return {
                    success: false,
                    error: errorMessage,
                    message: `概念图生成失败: ${errorMessage}`
                };
            }
            
        } catch (error) {
            console.error('请求失败:', error);
            return {
                success: false,
                error: error.message,
                message: '网络请求失败，请检查后端服务是否启动'
            };
        }
    }
    
    /**
     * 构建概念图生成提示词（三层结构版本）
     * @param {string} type - 生成类型
     * @param {Object} data - 输入数据
     * @returns {string} 提示词
     */
    buildConceptPrompt(type, data) {
        if (type === 'keyword') {
            return `# 任务
请为焦点问题"${data.keyword}"生成一个三层结构的概念图，以JSON格式输出。

## ⚠️ 严格数量限制（必须遵守）：
- **总节点数：最少8个，最多10个（严格限制）**
- **第一层（L1）**：必须且只有1个节点（焦点问题本身）
- **第二层（L2）**：必须3-4个节点（不能超过4个）
- **第三层（L3）**：必须4-5个节点（不能超过5个）
- **禁止输出超过10个节点**

# JSON格式示例（8个节点）
{
  "nodes": [
    {"id": "1", "label": "${data.keyword}", "type": "main", "description": "第一层核心节点", "importance": 10, "layer": 1},
    {"id": "2", "label": "核心概念1", "type": "core", "description": "第二层核心概念", "importance": 8, "layer": 2},
    {"id": "3", "label": "核心概念2", "type": "core", "description": "第二层核心概念", "importance": 8, "layer": 2},
    {"id": "4", "label": "核心概念3", "type": "core", "description": "第二层核心概念", "importance": 8, "layer": 2},
    {"id": "5", "label": "扩展概念1", "type": "detail", "description": "第三层扩展概念", "importance": 6, "layer": 3},
    {"id": "6", "label": "扩展概念2", "type": "detail", "description": "第三层扩展概念", "importance": 6, "layer": 3},
    {"id": "7", "label": "扩展概念3", "type": "detail", "description": "第三层扩展概念", "importance": 6, "layer": 3},
    {"id": "8", "label": "扩展概念4", "type": "detail", "description": "第三层扩展概念", "importance": 6, "layer": 3}
  ],
  "links": [
    {"source": "1", "target": "2", "label": "方面包括", "type": "relation", "strength": 8},
    {"source": "1", "target": "3", "label": "方面包括", "type": "relation", "strength": 8},
    {"source": "1", "target": "4", "label": "方面包括", "type": "relation", "strength": 8},
    {"source": "2", "target": "5", "label": "内容包括", "type": "relation", "strength": 6},
    {"source": "2", "target": "6", "label": "内容包括", "type": "relation", "strength": 6},
    {"source": "3", "target": "7", "label": "导致", "type": "relation", "strength": 6},
    {"source": "4", "target": "8", "label": "促进", "type": "relation", "strength": 6}
  ],
  "metadata": {"keyword": "${data.keyword}", "summary": "概念图摘要", "domain": "领域"}
}

# 重要说明
- **总节点数必须是8-10个**（包括焦点问题节点）
- 第一层只有1个节点（焦点问题）
- 第二层3-4个节点（最核心的分类或维度）
- 第三层4-5个节点（具体的细节或实例）
- 节点label要简洁（2-6字），避免过长
- **关系label必须简洁且能读成完整句子**：不含助词（如"的"、"了"），但能让"源节点 + 关系词 + 目标节点"连读通顺
  - ✓ 好："人工智能" + "领域包括" + "机器学习" = "人工智能领域包括机器学习"
  - ✓ 好："辛亥革命" + "背景包括" + "清政腐败" = "辛亥革命背景包括清政腐败"
  - ✓ 好："清政腐败" + "引发" + "民众不满" = "清政腐败引发民众不满"
  - ✗ 差：单字关系词如"是"、"有"
  - ✗ 差：包含助词如"的背景是"、"导致了"
- 推荐关系词（2-4字动词短语）：包括、包含、涵盖、导致、引发、促进、推动、应用于、基于、需要等
- 必须包含layer属性（1、2或3）
- 确保JSON格式正确，可直接解析

## 最终检查清单：
✓ nodes数组长度为8-10
✓ layer=1的节点只有1个
✓ layer=2的节点有3-4个
✓ layer=3的节点有4-5个
✓ 每个节点都有layer属性

请直接输出JSON，不要有其他解释文字。`;
        } else {
            return `分析文本提取三层结构概念图JSON：
${data.description}

## ⚠️ 严格数量限制：
- **总节点数：最少8个，最多10个**
- 第一层：1个节点（核心概念）
- 第二层：3-4个节点（最核心的分类）
- 第三层：4-5个节点（具体细节）

格式：
{
  "nodes": [
    {"id": "1", "label": "核心概念", "type": "main", "description": "描述", "importance": 10, "layer": 1},
    {"id": "2", "label": "核心概念1", "type": "core", "description": "描述", "importance": 8, "layer": 2},
    {"id": "3", "label": "核心概念2", "type": "core", "description": "描述", "importance": 8, "layer": 2},
    {"id": "4", "label": "核心概念3", "type": "core", "description": "描述", "importance": 8, "layer": 2},
    {"id": "5", "label": "扩展概念1", "type": "detail", "description": "描述", "importance": 6, "layer": 3},
    {"id": "6", "label": "扩展概念2", "type": "detail", "description": "描述", "importance": 6, "layer": 3},
    {"id": "7", "label": "扩展概念3", "type": "detail", "description": "描述", "importance": 6, "layer": 3},
    {"id": "8", "label": "扩展概念4", "type": "detail", "description": "描述", "importance": 6, "layer": 3}
  ],
  "links": [
    {"source": "1", "target": "2", "label": "方面包括", "type": "relation", "strength": 8},
    {"source": "2", "target": "5", "label": "内容包括", "type": "relation", "strength": 6}
  ],
  "metadata": {"summary": "概要", "domain": "领域", "keyInsights": "洞察"}
}

要求：
- 总共8-10个概念（nodes数组长度8-10）
- 必须包含layer属性（1、2或3）
- **关系词要简洁且能读成完整句子**：不含助词（如"的"、"了"），使用2-4字动词短语
  - 推荐：包括、包含、涵盖、导致、引发、促进、推动、应用于、基于、需要等
  - 禁止：单字关系词如"是"、"有"
  - 禁止：包含助词如"的背景是"、"导致了"
- 节点label简洁（2-6字）`;
        }
    }
}

/**
 * 大模型交互管理器
 */
class LLMManager {
    constructor() {
        this.config = new LLMConfig();
        this.introService = new IntroductionTextService(this.config);
        this.tripleService = new TripleExtractionService(this.config);
        this.conceptMapService = new ConceptMapGenerationService(this.config);
    }
    
    /**
     * 初始化
     */
    init() {
        // 页面加载时更新API地址（首次强制打印日志）
        this.config.updateApiUrl(true);
        
        // 监听端口变化事件
        window.addEventListener('portChanged', (event) => {
            console.log(`📡 检测到端口变化事件: ${event.detail.port}`);
            // 端口变化时会自动检测并打印警告
            this.config.updateApiUrl(true);
        });
    }
    
    /**
     * 生成介绍文本（流式）
     * @param {string} keyword - 关键词
     * @param {Function} onChunk - 接收文本片段的回调函数
     * @returns {Promise<Object>} 生成结果
     */
    async generateIntroduction(keyword, onChunk) {
        return await this.introService.generateIntroduction(keyword, onChunk);
    }
    
    /**
     * 提取三元组
     * @param {string} introText - 输入文本
     * @returns {Promise<Object>} 提取结果
     */
    async extractTriples(introText) {
        return await this.tripleService.extractTriplesFromIntro(introText);
    }
    
    /**
     * 生成概念图
     * @param {string} type - 生成类型
     * @param {Object} data - 输入数据
     * @returns {Promise<Object>} 生成结果
     */
    async generateConceptMap(type, data) {
        return await this.conceptMapService.generateConceptMap(type, data);
    }
}

// 创建全局实例
window.llmManager = new LLMManager();

// 导出类供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LLMConfig,
        IntroductionTextService,
        TripleExtractionService,
        ConceptMapGenerationService,
        LLMManager
    };
}
