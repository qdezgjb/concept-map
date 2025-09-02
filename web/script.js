// 概念图自动生成系统 - 基础交互脚本

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始获取元素...');
    
    // 获取DOM元素
    const keywordInput = document.getElementById('keyword');
    const descriptionTextarea = document.getElementById('description');
    const keywordBtn = document.getElementById('generateKeywordBtn');
    const descriptionBtn = document.getElementById('generateDescriptionBtn');
    const resetBtn = document.getElementById('resetViewBtn');
    const exportBtn = document.getElementById('exportImageBtn');
    const graphPlaceholder = document.querySelector('.graph-placeholder');
    
    console.log('基本元素获取结果:');
    console.log('keywordInput:', keywordInput);
    console.log('descriptionTextarea:', descriptionTextarea);
    console.log('keywordBtn:', keywordBtn);
    console.log('descriptionBtn:', descriptionBtn);
    console.log('resetBtn:', resetBtn);
    console.log('exportBtn:', exportBtn);
    console.log('graphPlaceholder:', graphPlaceholder);
    
    // 新增：编辑工具栏元素
    const editToolbar = document.querySelector('.edit-toolbar');
    const addNodeBtn = document.getElementById('addNodeBtn');
    const deleteNodeBtn = document.getElementById('deleteNodeBtn');
    const editNodeBtn = document.getElementById('editNodeBtn');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const deleteLinkBtn = document.getElementById('deleteLinkBtn');
    const editLinkBtn = document.getElementById('editLinkBtn');
    const layoutSelect = document.getElementById('layoutSelect');
    const autoLayoutBtn = document.getElementById('autoLayoutBtn');
    const nodeColorPicker = document.getElementById('nodeColorPicker');
    const linkColorPicker = document.getElementById('linkColorPicker');
    const nodeShapeSelect = document.getElementById('nodeShapeSelect');
    
    console.log('编辑工具栏元素获取结果:');
    console.log('editToolbar:', editToolbar);
    console.log('addNodeBtn:', addNodeBtn);
    console.log('deleteNodeBtn:', deleteNodeBtn);
    console.log('editNodeBtn:', editNodeBtn);
    console.log('addLinkBtn:', addLinkBtn);
    console.log('deleteLinkBtn:', deleteLinkBtn);
    console.log('editLinkBtn:', editLinkBtn);
    console.log('layoutSelect:', layoutSelect);
    console.log('autoLayoutBtn:', autoLayoutBtn);
    console.log('nodeColorPicker:', nodeColorPicker);
    console.log('linkColorPicker:', linkColorPicker);
    console.log('nodeShapeSelect:', nodeShapeSelect);
    
    // 新增：状态栏元素
    const nodeCountSpan = document.getElementById('nodeCount');
    const linkCountSpan = document.getElementById('linkCount');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadBtn = document.getElementById('loadBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    console.log('状态栏元素获取结果:');
    console.log('nodeCountSpan:', nodeCountSpan);
    console.log('linkCountSpan:', linkCountSpan);
    console.log('downloadBtn:', downloadBtn);
    console.log('loadBtn:', loadBtn);
    console.log('undoBtn:', undoBtn);
    console.log('redoBtn:', redoBtn);

    // 当前概念图数据
    let currentGraphData = null;
    let isGenerating = false;
    
    // 新增：节点选中和拖动相关变量
    let selectedNodeId = null;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginalNodeX = 0;
    let dragOriginalNodeY = 0;
    
    // 新增：操作历史记录
    let operationHistory = [];
    let currentHistoryIndex = -1;
    let maxHistorySize = 20;

    // API配置 - 动态获取端口号
    let API_BASE_URL = 'http://localhost:5000/api';
    
    // 使用端口检测器获取正确的端口
    function updateApiUrl() {
        if (window.portChecker) {
            const currentPort = window.portChecker.getCurrentPort();
            API_BASE_URL = `http://localhost:${currentPort}/api`;
            console.log(`使用端口检测器获取的端口: ${currentPort}`);
            console.log(`API地址已更新为: ${API_BASE_URL}`);
        } else {
            // 备用方案：从localStorage获取
            const savedPort = localStorage.getItem('flask_port');
            if (savedPort) {
                API_BASE_URL = `http://localhost:${savedPort}/api`;
                console.log(`使用保存的端口: ${savedPort}`);
                console.log(`API地址已更新为: ${API_BASE_URL}`);
            } else {
                // 如果都没有，使用默认端口5000
                API_BASE_URL = 'http://localhost:5000/api';
                console.log(`使用默认端口: 5000`);
                console.log(`API地址已更新为: ${API_BASE_URL}`);
            }
        }
    }
    
    // 页面加载时更新API地址
    updateApiUrl();
    
    // 监听端口变化事件
    window.addEventListener('portChanged', function(event) {
        console.log(`端口已更改为: ${event.detail.port}`);
        updateApiUrl();
    });

    // 关键词生成概念图事件
    keywordBtn.addEventListener('click', function() {
        console.log('关键词生成按钮被点击');
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            showMessage('请输入关键词', 'warning');
            return;
        }
        
        // 设置按钮加载状态
        keywordBtn.classList.add('loading');
        keywordBtn.textContent = '生成中...';
        keywordBtn.disabled = true;
        
        console.log('开始生成概念图，关键词:', keyword);
        generateConceptMap('keyword', { keyword: keyword });
    });

    // 文本分析生成概念图事件
    descriptionBtn.addEventListener('click', function() {
        console.log('文本分析按钮被点击');
        const description = descriptionTextarea.value.trim();
        if (!description) {
            showMessage('请输入描述文字', 'warning');
            return;
        }
        
        if (description.length < 10) {
            showMessage('描述文字至少需要10个字符', 'warning');
        }
        
        // 设置按钮加载状态
        descriptionBtn.classList.add('loading');
        descriptionBtn.textContent = '生成中...';
        descriptionBtn.disabled = true;
        
        console.log('开始生成概念图，描述:', description);
        generateConceptMap('description', { description: description });
    });



    // 重置视图事件
    resetBtn.addEventListener('click', function() {
        resetView();
    });

    // 导出图片事件
    exportBtn.addEventListener('click', function() {
        exportConceptMap();
    });

    // 输入框回车事件
    keywordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            keywordBtn.click();
        }
    });

    descriptionTextarea.addEventListener('keypress', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            descriptionBtn.click();
        }
    });



    // 新增：编辑工具栏事件绑定
    console.log('开始绑定编辑工具栏事件...');
    console.log('addNodeBtn:', addNodeBtn);
    console.log('deleteNodeBtn:', deleteNodeBtn);
    console.log('editNodeBtn:', editNodeBtn);
    console.log('addLinkBtn:', addLinkBtn);
    console.log('deleteLinkBtn:', deleteLinkBtn);
    console.log('editLinkBtn:', editLinkBtn);
    console.log('autoLayoutBtn:', autoLayoutBtn);
    console.log('layoutSelect:', layoutSelect);
    console.log('nodeColorPicker:', nodeColorPicker);
    console.log('linkColorPicker:', linkColorPicker);
    console.log('nodeShapeSelect:', nodeShapeSelect);
    
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', function() {
            console.log('添加节点按钮被点击');
            addNewNode();
        });
    } else {
        console.error('addNodeBtn 元素未找到');
    }
    
    if (deleteNodeBtn) {
        deleteNodeBtn.addEventListener('click', function() {
            console.log('删除节点按钮被点击');
            deleteSelectedNode();
        });
    } else {
        console.error('deleteNodeBtn 元素未找到');
    }
    
    if (editNodeBtn) {
        editNodeBtn.addEventListener('click', function() {
            console.log('编辑节点按钮被点击');
            editSelectedNode();
        });
    } else {
        console.error('editNodeBtn 元素未找到');
    }
    
    if (addLinkBtn) {
        addLinkBtn.addEventListener('click', function() {
            console.log('添加连线按钮被点击');
            addNewLink();
        });
    } else {
        console.error('addLinkBtn 元素未找到');
    }
    
    if (deleteLinkBtn) {
        deleteLinkBtn.addEventListener('click', function() {
            console.log('删除连线按钮被点击');
            deleteSelectedLink();
        });
    } else {
        console.error('deleteLinkBtn 元素未找到');
    }
    
    if (editLinkBtn) {
        editLinkBtn.addEventListener('click', function() {
            console.log('编辑连线按钮被点击');
            editSelectedLink();
        });
    } else {
        console.error('editLinkBtn 元素未找到');
    }
    
    if (autoLayoutBtn) {
        autoLayoutBtn.addEventListener('click', function() {
            console.log('自动布局按钮被点击');
            applyAutoLayout();
        });
    } else {
        console.error('autoLayoutBtn 元素未找到');
    }
    
    if (layoutSelect) {
        layoutSelect.addEventListener('change', function() {
            console.log('布局选择改变');
            changeLayout();
        });
    } else {
        console.error('layoutSelect 元素未找到');
    }
    
    if (nodeColorPicker) {
        nodeColorPicker.addEventListener('change', function() {
            console.log('节点颜色改变');
            changeNodeColor();
        });
    } else {
        console.error('nodeColorPicker 元素未找到');
    }
    
    if (linkColorPicker) {
        linkColorPicker.addEventListener('change', function() {
            console.log('连线颜色改变');
            changeLinkColor();
        });
    } else {
        console.error('linkColorPicker 元素未找到');
    }
    
    if (nodeShapeSelect) {
        nodeShapeSelect.addEventListener('change', function() {
            console.log('节点形状改变');
            changeNodeShape();
        });
    } else {
        console.error('nodeShapeSelect 元素未找到');
    }
    
    // 新增：状态栏事件绑定
    console.log('开始绑定状态栏事件...');
    console.log('downloadBtn:', downloadBtn);
    console.log('loadBtn:', loadBtn);
    console.log('undoBtn:', undoBtn);
    console.log('redoBtn:', redoBtn);
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            console.log('下载按钮被点击');
            downloadConceptMapImage();
        });
    } else {
        console.error('downloadBtn 元素未找到');
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            console.log('加载按钮被点击');
            loadConceptMap();
        });
    } else {
        console.error('loadBtn 元素未找到');
    }
    
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            console.log('撤销按钮被点击');
            undoOperation();
        });
    } else {
        console.error('undoBtn 元素未找到');
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', function() {
            console.log('重做按钮被点击');
            redoOperation();
        });
    } else {
        console.error('redoBtn 元素未找到');
    }

    // 从文本内容中提取三元组
    async function extractTriplesFromIntro(introText) {
        console.log('extractTriplesFromIntro 函数被调用，文本内容:', introText);
        
        try {
            // 在每次API调用前，确保获取最新的端口信息
            updateApiUrl();
            console.log(`当前使用的API地址: ${API_BASE_URL}`);
            
            // 构建三元组提取提示词（关系由模型自行判断与命名）
            const triplePrompt = `# 角色
你是一位知识图谱构建专家，擅长从非结构化文本中抽取概念及其语义关系。

# 任务
分析我提供的文本，识别核心概念（实体/事件/属性等）以及它们之间的关系。关系由你根据语义自行判断与命名，必须选择最准确、最具体的中文动词或短语。

# 关系类型指导
请根据语义准确选择关系类型：
- 时间关系：发生在、开始于、结束于、持续、发生于
- 因果关系：导致、引起、促进、推动、催生、影响
- 属性关系：具有、属于、是、构成、组成
- 空间关系：位于、分布、存在于、坐落于
- 功能关系：用于、服务于、支持、实现
- 变化关系：变成、转变为、演化为、发展成
- 比较关系：大于、小于、优于、不同于
- 逻辑关系：意味着、表示、说明、体现

# 规则
1. 关系精确性：选择最具体、最准确的关系词，避免使用过于宽泛的"包含"等词。
2. 保留核心：聚焦主语-谓语-宾语主干，忽略时间/地点/方式/程度等修饰，除非它是核心宾语。
3. 概念精简：概念词尽量简短；必要时可构造复合实体以简化关系动词。
4. 语义归纳：当关系未直接明言但语义明确时，可进行不改变事实的归纳命名；不得臆造文本中不存在的事实。
5. 去重合并：同义或重复三元组需合并，保持表达一致。

# 输出格式
严格使用 (概念词1, 关系, 概念词2) 的格式，使用英文逗号分隔；每行仅输出一个三元组；只输出三元组。

# 示例
输入："辛亥革命发生在1911年，这场革命结束了中国两千多年的封建帝制，建立了中华民国。"
输出：
(辛亥革命, 发生在, 1911年)
(辛亥革命, 结束, 封建帝制)
(辛亥革命, 建立, 中华民国)

输入："人工智能技术的发展推动了社会进步，促进了生产效率的提升。"
输出：
(人工智能技术发展, 推动, 社会进步)
(人工智能技术发展, 促进, 生产效率提升)

# 开始处理
请为以下文本提取三元组：

${introText}

请严格按照格式输出，不要添加其他内容。`;
            
            console.log('发送给AI的三元组提取提示词:', triplePrompt);
            
            // 调用API
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: triplePrompt })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('AI响应成功:', result.response);
                
                // 解析三元组
                const triples = parseTriplesFromResponse(result.response);
                console.log('解析出的三元组:', triples);
                
                if (triples.length > 0) {
                    // 将三元组转换为概念图数据
                    const conceptData = convertTriplesToConceptData(triples);
                    console.log('转换后的概念图数据:', conceptData);
                    
                    // 在文本内容下方显示三元组结果
                    displayTripleResultsInIntro(triples, conceptData);
                    
                    // 生成概念图
                    const graphData = convertToD3Format(conceptData);
                    displayConceptMap(graphData);
                    
                    showMessage(`成功从文本中提取 ${triples.length} 个三元组`, 'success');
                } else {
                    showMessage('未能从文本中提取到有效的三元组', 'warning');
                }
            } else {
                showMessage(`三元组提取失败: ${result.error || '未知错误'}`, 'error');
                console.error('API调用失败:', result);
            }
            
        } catch (error) {
            showMessage('网络请求失败，请检查后端服务是否启动', 'error');
            console.error('三元组提取失败:', error);
        }
    }

    // 生成概念图的主函数
    async function generateConceptMap(type, data) {
        console.log('generateConceptMap函数被调用，类型:', type, '数据:', data);
        
        if (isGenerating) {
            console.log('正在生成中，忽略重复请求');
            return;
        }
        
        isGenerating = true;
        
        try {
            // 在每次API调用前，确保获取最新的端口信息
            updateApiUrl();
            console.log(`当前使用的API地址: ${API_BASE_URL}`);
            
            // 先显示概念图展示区域
            const conceptMapDisplay = document.querySelector('.concept-map-display');
            conceptMapDisplay.style.display = 'flex';
            
            // 隐藏占位符
            graphPlaceholder.style.display = 'none';
            
            // 显示加载动画和文字
            const svg = document.querySelector('.concept-graph');
            if (svg) {
                // 隐藏默认文字
                const defaultText = svg.querySelector('text');
                if (defaultText) {
                    defaultText.style.display = 'none';
                }
                
                // 创建SVG加载动画元素
                // 创建加载动画组
                const loadingGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                loadingGroup.setAttribute('id', 'loading-animation');
                
                // 创建背景矩形 - 调整大小与下方一致
                const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                // 居中定位
                bgRect.setAttribute('x', '250');
                bgRect.setAttribute('y', '280');
                bgRect.setAttribute('width', '300');
                bgRect.setAttribute('height', '50');
                bgRect.setAttribute('rx', '8');
                bgRect.setAttribute('fill', 'white');
                bgRect.setAttribute('stroke', '#e1e5e9');
                bgRect.setAttribute('stroke-width', '1');
                bgRect.setAttribute('fill-opacity', '1');
                
                // 创建加载动画圆圈
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', '280');
                circle.setAttribute('cy', '305');
                circle.setAttribute('r', '10');
                circle.setAttribute('fill', '#667eea');
                circle.setAttribute('fill-opacity', '0.8');
                
                // 添加脉冲动画
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animate.setAttribute('attributeName', 'r');
                animate.setAttribute('values', '10;11;10');
                animate.setAttribute('dur', '1.5s');
                animate.setAttribute('repeatCount', 'indefinite');
                
                const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateOpacity.setAttribute('attributeName', 'fill-opacity');
                animateOpacity.setAttribute('values', '0.8;0.6;0.8');
                animateOpacity.setAttribute('dur', '1.5s');
                animateOpacity.setAttribute('repeatCount', 'indefinite');
                
                // 创建文字
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', '350');
                text.setAttribute('y', '305');
                text.setAttribute('text-anchor', 'left');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-size', '14');
                text.setAttribute('fill', '#333');
                text.textContent = '概念图生成中，请稍后';
                
                // 组装加载动画
                circle.appendChild(animate);
                circle.appendChild(animateOpacity);
                loadingGroup.appendChild(bgRect);
                loadingGroup.appendChild(circle);
                loadingGroup.appendChild(text);
                
                svg.appendChild(loadingGroup);
                
                console.log('加载动画已创建');
            } else {
                console.error('SVG元素未找到');
            }
            
            // 显示内容加载状态
            const aiIntroText = document.getElementById('aiIntroText');
            if (type === 'keyword') {
                aiIntroText.innerHTML = `
                    <div class="loading-box">
                        <div class="loading-circle"></div>
                        <div class="loading-text">正在生成AI介绍内容...</div>
                    </div>
                `;
            } else {
                aiIntroText.innerHTML = `
                    <div class="loading-box">
                        <div class="loading-circle"></div>
                        <div class="loading-text">正在分析用户输入内容...</div>
                    </div>
                `;
            }
            aiIntroText.className = 'intro-text loading';
            
            // 生成焦点问题
            let focusQuestion = '';
            if (type === 'keyword') {
                // 关键词模式：控制在10个字左右
                const keyword = data.keyword;
                if (keyword.length <= 6) {
                    focusQuestion = `焦点问题：${keyword}是什么？`;
                } else {
                    // 如果关键词太长，截取前6个字符
                    focusQuestion = `焦点问题：${keyword.substring(0, 6)}...是什么？`;
                }
            } else {
                // 文本分析模式：控制在10个字左右
                const textContent = data.description;
                // 提取核心概念，控制在6个字左右
                let coreConcept = '';
                if (textContent.length <= 6) {
                    coreConcept = textContent;
                } else {
                    // 尝试找到句子的主语或核心名词
                    const sentences = textContent.split(/[。！？，；]/);
                    const firstSentence = sentences[0].trim();
                    if (firstSentence.length <= 6) {
                        coreConcept = firstSentence;
                    } else {
                        // 提取前6个字符作为核心概念
                        coreConcept = firstSentence.substring(0, 6) + '...';
                    }
                }
                focusQuestion = `焦点问题：${coreConcept}`;
            }
            
            // 将焦点问题存储到全局变量中
            window.focusQuestion = focusQuestion;
            
            // 构建概念图生成提示词
            let conceptPrompt = '';
            if (type === 'keyword') {
                conceptPrompt = `请分析关键词"${data.keyword}"，提取相关概念和关系，返回JSON格式：

请提取核心概念、相关概念、概念间的关系，返回严格的JSON格式：
{
  "nodes": [
    {"id": "1", "label": "${data.keyword}", "type": "main", "description": "中心概念", "importance": 10},
    {"id": "2", "label": "相关概念A", "type": "sub", "description": "与中心概念相关的概念", "importance": 8},
    {"id": "3", "label": "相关概念B", "type": "sub", "description": "与中心概念相关的概念", "importance": 7}
  ],
  "links": [
    {"source": "1", "target": "2", "label": "导致", "type": "causal", "strength": 8},
    {"source": "1", "target": "3", "label": "具有", "type": "attribute", "strength": 7}
  ],
  "metadata": {
    "keyword": "${data.keyword}",
    "summary": "基于关键词'${data.keyword}'生成的概念图",
    "domain": "通用领域"
  }
}`;
            } else {
                conceptPrompt = `请仔细分析以下用户输入的文本内容，提取其中的关键概念和关系，返回JSON格式：

用户输入文本：${data.description}

请按照以下要求提取：
1. 识别文本中提到的所有重要概念（实体、事件、属性等）
2. 分析概念之间的逻辑关系（导致、影响、具有、属于、建立、推动等）
3. 为每个概念分配重要性权重（1-10）
4. 为每个关系分配强度权重（1-10）

返回严格的JSON格式：
{
  "nodes": [
    {"id": "1", "label": "核心概念1", "type": "main", "description": "概念描述", "importance": 10},
    {"id": "2", "label": "相关概念2", "type": "sub", "description": "概念描述", "importance": 8},
    {"id": "3", "label": "相关概念3", "type": "sub", "description": "概念描述", "importance": 7}
  ],
  "links": [
    {"source": "1", "target": "2", "label": "关系描述", "type": "relation", "strength": 8},
    {"source": "1", "target": "3", "label": "关系描述", "type": "relation", "strength": 7}
  ],
  "metadata": {
    "summary": "基于用户输入文本分析生成的概念图",
    "domain": "文本分析",
    "keyInsights": "从文本中提取的关键洞察"
  }
}

注意：请确保提取的概念和关系都直接来源于用户输入的文本，不要添加文本中未提及的内容。`;
            }
            
            // 构建AI介绍生成提示词
            let introPrompt = '';
            if (type === 'keyword') {
                introPrompt = `请为关键词"${data.keyword}"生成一段简洁的介绍文字，要求：
1. 介绍内容需要采用特定的概念关系链结构：概念1（关键词）关系 概念2，然后接下来的内容围绕概念2 关系 概念3，以此类推
2. 关系词要具体准确，避免使用"包含"等过于宽泛的词，优先使用：发生在、导致、建立、推动、促进、影响、具有、位于、属于、是等具体关系词
3. 整体内容必须与关键词"${data.keyword}"密切相关
4. 语言要通俗易懂，适合一般读者理解
5. 字数必须控制在200字左右
6. 确保概念之间的关系连贯，形成一个完整的知识链

请直接返回介绍文字，不要包含其他格式标记。`;
            } else {
                introPrompt = `请为以下描述内容生成一段简洁的介绍文字，要求：
1. 总结描述的核心要点
2. 解释相关概念的含义
3. 语言要通俗易懂，适合一般读者理解
4. 字数必须控制在100-200字之间，不能超过200字

描述内容：${data.description}

请直接返回介绍文字，不要包含其他格式标记。`;
            }
            
            let conceptResponse, introResponse;
            
            if (type === 'keyword') {
                // 关键词模式：并行调用两个API
                [conceptResponse, introResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: conceptPrompt })
                    }),
                    fetch(`${API_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: introPrompt })
                    })
                ]);
            } else {
                // 文本分析模式：只调用概念图生成API，不生成介绍内容
                conceptResponse = await fetch(`${API_BASE_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: conceptPrompt })
                });
                
                // 直接使用用户输入的文本作为介绍内容
                const userDescription = data.description;
                aiIntroText.innerHTML = `<div class="user-input-display">
                    <h5>用户输入内容：</h5>
                    <p>${userDescription}</p>
                </div>`;
                aiIntroText.className = 'intro-text';
                
                // 为AI介绍区域添加文本分析模式样式
                const aiIntroduction = document.querySelector('.ai-introduction');
                if (aiIntroduction) {
                    aiIntroduction.classList.add('text-analysis-mode');
                }
                
                // 自动进行三元组提取
                console.log('开始从用户输入中提取三元组...');
                extractTriplesFromIntro(userDescription);
            }
            
            const conceptResult = await conceptResponse.json();
            const introResult = type === 'keyword' ? await introResponse.json() : null;
            
            // 处理概念图生成结果
            if (conceptResult.success) {
                try {
                    const content = conceptResult.response;
                    const startIdx = content.indexOf('{');
                    const endIdx = content.lastIndexOf('}') + 1;
                    
                    if (startIdx !== -1 && endIdx !== -1) {
                        const jsonContent = content.substring(startIdx, endIdx);
                        const conceptData = JSON.parse(jsonContent);
                        const graphData = convertToD3Format(conceptData);
                        displayConceptMap(graphData);
                    } else {
                        throw new Error('响应中未找到有效的JSON数据');
                    }
                } catch (parseError) {
                    console.error('JSON解析失败:', parseError);
                    showMessage('概念图数据解析失败', 'warning');
                }
            } else {
                showMessage(`概念图生成失败: ${conceptResult.error || '未知错误'}`, 'warning');
            }
            
            // 处理AI介绍生成结果（仅在关键词模式下）
            if (type === 'keyword') {
                if (introResult && introResult.success) {
                    const introText = introResult.response;
                    // 直接显示纯文本内容，不添加额外的样式或标记
                    aiIntroText.innerHTML = introText;
                    aiIntroText.className = 'intro-text';
                    showMessage('AI介绍生成成功！', 'success');
                    
                    // 自动进行三元组提取
                    console.log('开始自动提取三元组...');
                    extractTriplesFromIntro(introText);
                } else if (introResult) {
                    aiIntroText.innerHTML = 'AI介绍生成失败，请稍后重试。';
                    aiIntroText.className = 'intro-text';
                    showMessage('AI介绍生成失败', 'warning');
                }
            }
            
        } catch (error) {
            showMessage('网络请求失败，请检查后端服务是否启动', 'error');
            console.error('请求失败:', error);
            
            // API调用失败时不再使用默认/模拟数据
            // 显示错误信息
            const aiIntroText = document.getElementById('aiIntroText');
            aiIntroText.innerHTML = '网络请求失败，请检查后端服务是否启动。';
            aiIntroText.className = 'intro-text';
            
            showMessage('生成失败，请稍后重试', 'warning');
        } finally {
            isGenerating = false;
            hideLoadingState();
        }
    }

    // 解析AI响应中的三元组
    function parseTriplesFromResponse(response) {
        console.log('parseTriplesFromResponse 被调用，响应:', response);
        
        const triples = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // 匹配 (概念词1, 关系, 概念词2) 格式
            const match = trimmedLine.match(/^\((.*?),\s*(.*?),\s*(.*?)\)$/);
            if (match) {
                const [, concept1, relation, concept2] = match;
                triples.push({
                    source: concept1.trim(),
                    relation: relation.trim(),
                    target: concept2.trim()
                });
                console.log('解析到三元组:', { source: concept1.trim(), relation: relation.trim(), target: concept2.trim() });
            } else {
                console.log('无法解析的行:', trimmedLine);
            }
        }
        
        console.log('总共解析出三元组数量:', triples.length);
        return triples;
    }

    // 将三元组转换为概念图数据
    function convertTriplesToConceptData(triples) {
        console.log('convertTriplesToConceptData 被调用，三元组:', triples);
        
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        let nodeId = 1;
        
        // 获取当前关键词
        let currentKeyword = '';
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                currentKeyword = match[1].trim();
            }
        }
        
        // 如果没有关键词，尝试从三元组中提取最常见的概念作为关键词
        if (!currentKeyword && triples.length > 0) {
            const conceptCount = new Map();
            triples.forEach(triple => {
                conceptCount.set(triple.source, (conceptCount.get(triple.source) || 0) + 1);
                conceptCount.set(triple.target, (conceptCount.get(triple.target) || 0) + 1);
            });
            
            let maxCount = 0;
            conceptCount.forEach((count, concept) => {
                if (count > maxCount) {
                    maxCount = count;
                    currentKeyword = concept;
                }
            });
        }
        
        console.log('提取的关键词:', currentKeyword);
        
        // 处理所有三元组
        triples.forEach((triple, index) => {
            const { source, relation, target } = triple;
            
            // 添加源节点
            if (!nodeMap.has(source)) {
                nodeMap.set(source, nodeId.toString());
                nodes.push({
                    id: nodeId.toString(),
                    label: source,
                    type: 'concept',
                    description: `从文本中提取的概念: ${source}`,
                    importance: source === currentKeyword ? 10 : 8
                });
                nodeId++;
            }
            
            // 添加目标节点
            if (!nodeMap.has(target)) {
                nodeMap.set(target, nodeId.toString());
                nodes.push({
                    id: nodeId.toString(),
                    label: target,
                    type: 'concept',
                    description: `从文本中提取的概念: ${target}`,
                    importance: target === currentKeyword ? 10 : 7
                });
                nodeId++;
            }
            
            // 添加关系连线
            links.push({
                id: `link-${index}`,
                source: nodeMap.get(source),
                target: nodeMap.get(target),
                label: relation,
                type: 'relation',
                strength: 6
            });
        });
        
        // 确保第一层节点在数组的第一位
        if (currentKeyword) {
            const firstLayerIndex = nodes.findIndex(node => node.label === currentKeyword);
            if (firstLayerIndex > 0) {
                const firstLayerNode = nodes.splice(firstLayerIndex, 1)[0];
                nodes.unshift(firstLayerNode);
                
                // 更新节点ID映射
                const oldId = firstLayerNode.id;
                const newId = '1';
                firstLayerNode.id = newId;
                
                // 更新连线中的节点ID引用
                links.forEach(link => {
                    if (link.source === oldId) link.source = newId;
                    if (link.target === oldId) link.target = newId;
                });
                
                // 重新分配其他节点的ID
                for (let i = 1; i < nodes.length; i++) {
                    const oldId = nodes[i].id;
                    const newId = (i + 1).toString();
                    nodes[i].id = newId;
                    
                    links.forEach(link => {
                        if (link.source === oldId) link.source = newId;
                        if (link.target === oldId) link.target = newId;
                    });
                }
            }
        }
        
        const conceptData = {
            nodes: nodes,
            links: links,
            metadata: {
                summary: `基于AI介绍内容提取的 ${triples.length} 个三元组构建的概念图`,
                domain: 'AI介绍分析',
                source: 'AI介绍内容',
                tripleCount: triples.length,
                keyword: currentKeyword
            }
        };
        
        console.log('转换完成的概念图数据:', conceptData);
        return conceptData;
    }

    // 在AI介绍内容中显示三元组提取结果
    function displayTripleResultsInIntro(triples, conceptData) {
        console.log('displayTripleResultsInIntro 被调用');
        
        const aiIntroText = document.getElementById('aiIntroText');
        if (aiIntroText) {
            // 获取原始的AI介绍内容
            const originalIntro = aiIntroText.innerHTML;
            
            // 在原始介绍内容下方添加三元组结果，使用垂直布局
            let resultHtml = originalIntro;
            resultHtml += '<hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">';
            resultHtml += '<div style="margin-top: 15px;">';
            resultHtml += '<h4 style="color: #667eea; margin: 0 0 15px 0; font-size: 16px;">从AI介绍中提取到的概念关系：</h4>';
            
            // 创建三元组列表，使用更好的样式
            resultHtml += '<div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">';
            triples.forEach((triple, index) => {
                resultHtml += `<p style="margin: 8px 0; line-height: 1.5;">${index + 1}. ${triple.source} <strong>${triple.relation}</strong> ${triple.target}</p>`;
            });
            resultHtml += '</div>';
            
            // 添加统计信息
            resultHtml += `<p style="margin-top: 15px; color: #666; font-size: 13px;">共提取出 ${conceptData.nodes.length} 个概念，${conceptData.links.length} 个关系</p>`;
            resultHtml += '</div>';
            
            aiIntroText.innerHTML = resultHtml;
            aiIntroText.className = 'intro-text'; // 确保移除loading类
        }
    }

    // 确保第一层只有一个节点，内容与关键词相关
    function ensureSingleFirstLayer(conceptData) {
        console.log('确保第一层只有一个节点...');
        
        if (!conceptData || !conceptData.nodes || conceptData.nodes.length === 0) {
            return conceptData;
        }
        
        const nodes = [...conceptData.nodes];
        const links = [...conceptData.links];
        
        // 获取当前关键词（从全局变量或元数据中）
        let currentKeyword = '';
        if (window.focusQuestion) {
            // 从焦点问题中提取关键词
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                currentKeyword = match[1].trim();
            }
        }
        
        // 如果没有找到关键词，尝试从元数据中获取
        if (!currentKeyword && conceptData.metadata && conceptData.metadata.keyword) {
            currentKeyword = conceptData.metadata.keyword;
        }
        
        // 如果仍然没有关键词，使用第一个节点作为关键词
        if (!currentKeyword && nodes.length > 0) {
            currentKeyword = nodes[0].label;
        }
        
        console.log('当前关键词:', currentKeyword);
        
        // 找到与关键词最相关的节点作为第一层节点
        let firstLayerNode = null;
        let bestMatchScore = 0;
        
        nodes.forEach(node => {
            const matchScore = calculateKeywordMatchScore(node.label, currentKeyword);
            if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                firstLayerNode = node;
            }
        });
        
        // 如果没有找到合适的节点，创建一个新的第一层节点
        if (!firstLayerNode) {
            firstLayerNode = {
                id: 'first-layer',
                label: currentKeyword || '核心概念',
                type: 'main',
                description: '第一层核心节点',
                importance: 10
            };
            nodes.unshift(firstLayerNode);
        }
        
        // 确保第一层节点在数组的第一位
        if (firstLayerNode.id !== nodes[0].id) {
            const firstLayerIndex = nodes.findIndex(n => n.id === firstLayerNode.id);
            if (firstLayerIndex > 0) {
                nodes.splice(firstLayerIndex, 1);
                nodes.unshift(firstLayerNode);
            }
        }
        
        // 重新构建连线，确保所有其他节点都连接到第一层节点
        const newLinks = [];
        const firstLayerId = firstLayerNode.id;
        
        // 添加从第一层到其他节点的连线
        nodes.slice(1).forEach(node => {
            // 检查是否已经存在连线
            const existingLink = links.find(link => 
                (link.source === firstLayerId && link.target === node.id) ||
                (link.source === node.id && link.target === firstLayerId)
            );
            
            if (!existingLink) {
                newLinks.push({
                    id: `link-${firstLayerId}-${node.id}`,
                    source: firstLayerId,
                    target: node.id,
                    label: '包含',
                    type: 'hierarchy',
                    strength: 8
                });
            } else {
                // 如果连线方向不对，调整方向
                if (existingLink.source !== firstLayerId) {
                    existingLink.source = firstLayerId;
                    existingLink.target = node.id;
                }
                newLinks.push(existingLink);
            }
        });
        
        // 添加其他节点之间的连线（如果存在）
        links.forEach(link => {
            if (link.source !== firstLayerId && link.target !== firstLayerId) {
                newLinks.push(link);
            }
        });
        
        console.log('第一层节点处理完成:', firstLayerNode.label);
        console.log('节点数量:', nodes.length);
        console.log('连线数量:', newLinks.length);
        
        return {
            nodes: nodes,
            links: newLinks,
            metadata: conceptData.metadata || {}
        };
    }
    
    // 计算关键词匹配度
    function calculateKeywordMatchScore(nodeLabel, keyword) {
        if (!keyword || !nodeLabel) return 0;
        
        const keywordLower = keyword.toLowerCase();
        const nodeLabelLower = nodeLabel.toLowerCase();
        
        // 完全匹配得分最高
        if (nodeLabelLower === keywordLower) return 100;
        
        // 包含关键词得分较高
        if (nodeLabelLower.includes(keywordLower)) return 80;
        
        // 关键词包含节点标签得分中等
        if (keywordLower.includes(nodeLabelLower)) return 60;
        
        // 部分匹配得分较低
        const keywordWords = keywordLower.split(/[\s,，。！？；：""''（）()]+/);
        const nodeWords = nodeLabelLower.split(/[\s,，。！？；：""''（）()]+/);
        
        let matchCount = 0;
        keywordWords.forEach(word => {
            if (word.length > 1 && nodeWords.some(nodeWord => nodeWord.includes(word))) {
                matchCount++;
            }
        });
        
        return matchCount * 20;
    }

    // 转换API数据为D3.js格式
    function convertToD3Format(conceptData) {
        // 确保第一层只有一个节点，内容与关键词相关
        const processedData = ensureSingleFirstLayer(conceptData);
        
        const nodes = processedData.nodes.map((node, index) => ({
            id: node.id,
            label: node.label,
            x: 0, // 初始位置设为0，由智能布局算法确定
            y: 0,
            type: node.type,
            description: node.description,
            importance: node.importance || 5
        }));

        const links = processedData.links.map((link, index) => ({
            id: link.id || `link-${link.source}-${link.target}`,
            source: link.source,
            target: link.target,
            label: link.label,
            type: link.type,
            strength: link.strength || 5,
            // 确保不包含贝塞尔曲线属性，统一使用直线连接
            isCurved: false
        }));

        const graphData = {
            nodes: nodes,
            links: links,
            metadata: processedData.metadata || {}
        };

        // 应用智能布局算法
        return applyIntelligentLayout(graphData);
    }

    // 智能布局算法 - 自动选择最优布局方式
    function applyIntelligentLayout(graphData) {
        console.log('应用智能布局算法...');
        
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            console.warn('图形数据为空，跳过布局优化');
            return graphData;
        }

        const nodes = [...graphData.nodes];
        const links = [...graphData.links];
        
        // 分析图形结构，自动选择最适合的布局算法
        const layoutType = analyzeGraphStructure(nodes, links);
        console.log(`自动选择布局算法: ${layoutType}`);
        
        let optimizedGraph;
        
        switch (layoutType) {
            case 'hierarchical':
                // 使用Sugiyama算法处理层次结构
                optimizedGraph = applyHierarchicalLayout(graphData);
                break;
            default:
                // 默认使用力导向布局
                optimizedGraph = applyForceDirectedLayoutOnly(graphData);
        }
        
        console.log('智能布局完成');
        return optimizedGraph;
    }
    
    // 分析图形结构，自动选择布局算法 - 优化优先选择层次布局
    function analyzeGraphStructure(nodes, links) {
        if (nodes.length <= 1) return 'force';
        
        // 检查是否有明确的第一级关键词节点
        let hasFirstLevelNode = false;
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                const currentKeyword = match[1].trim();
                hasFirstLevelNode = nodes.some(node => {
                    const nodeLabel = node.label || '';
                    return nodeLabel === currentKeyword || 
                           nodeLabel.includes(currentKeyword) || 
                           currentKeyword.includes(nodeLabel);
                });
            }
        }
        
        // 计算层次性指标
        const hierarchyScore = calculateHierarchyScore(nodes, links);
        
        console.log(`结构分析结果: 层次性=${hierarchyScore.toFixed(2)}, 有第一级节点=${hasFirstLevelNode}`);
        
        // 如果有明确的第一级节点，优先使用层次布局
        if (hasFirstLevelNode) {
            return 'hierarchical'; // Sugiyama算法
        }
        
        // 根据层次性指标选择布局算法
        if (hierarchyScore > 0.6) { // 降低阈值，更容易选择层次布局
            return 'hierarchical'; // Sugiyama算法
        } else {
            return 'force';        // 力导向布局
        }
    }
    
    // 计算层次性指标
    function calculateHierarchyScore(nodes, links) {
        if (links.length === 0) return 0;
        
        let hierarchicalLinks = 0;
        const nodeLevels = new Map();
        
        // 使用BFS计算节点层次
        const visited = new Set();
        const inDegree = new Map();
        nodes.forEach(node => inDegree.set(node.id, 0));
        
        links.forEach(link => {
            inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1);
        });
        
        const roots = nodes.filter(node => inDegree.get(node.id) === 0);
        if (roots.length === 0) return 0;
        
        let currentLevel = 0;
        let currentNodes = [...roots];
        
        while (currentNodes.length > 0) {
            currentNodes.forEach(node => {
                nodeLevels.set(node.id, currentLevel);
                visited.add(node.id);
            });
            
            const nextLevel = [];
            currentNodes.forEach(node => {
                links.forEach(link => {
                    if (link.source === node.id && !visited.has(link.target)) {
                        const targetNode = nodes.find(n => n.id === link.target);
                        if (targetNode && !nextLevel.includes(targetNode)) {
                            nextLevel.push(targetNode);
                        }
                    }
                });
            });
            
            currentNodes = nextLevel;
            currentLevel++;
        }
        
        // 计算层次性连线比例
        links.forEach(link => {
            const sourceLevel = nodeLevels.get(link.source) || 0;
            const targetLevel = nodeLevels.get(link.target) || 0;
            if (targetLevel > sourceLevel) {
                hierarchicalLinks++;
            }
        });
        
        return hierarchicalLinks / links.length;
    }
    


    // 智能初始化节点位置 - 优化确保所有节点在边界内，第一级节点在焦点问题下方
    function initializeNodePositions(nodes, width, height) {
        // 统一的边界间距
        const margin = 150; // 左右边界间距
        const topMargin = 90; // 减小顶部边界间距，与assignCoordinates保持一致
        const bottomMargin = 150; // 底部边界间距
        
        // 计算可用的布局区域
        const availableWidth = width - 2 * margin;
        const availableHeight = height - topMargin - bottomMargin;
        const centerX = width / 2;
        const centerY = topMargin + availableHeight / 2;
        
        // 获取第一级关键词节点
        let firstLevelNode = null;
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                const currentKeyword = match[1].trim();
                firstLevelNode = nodes.find(node => {
                    const nodeLabel = node.label || '';
                    return nodeLabel === currentKeyword || 
                           nodeLabel.includes(currentKeyword) || 
                           currentKeyword.includes(nodeLabel);
                });
            }
        }
        
        if (nodes.length === 1) {
            // 单个节点放在焦点问题正下方
            nodes[0].x = centerX;
            nodes[0].y = topMargin + 80; // 焦点问题下方
        } else if (nodes.length === 2) {
            if (firstLevelNode) {
                // 第一级节点在焦点问题下方，其他节点在第一级下方
                const otherNode = nodes.find(n => n.id !== firstLevelNode.id);
                firstLevelNode.x = centerX;
                firstLevelNode.y = topMargin + 80; // 焦点问题正下方
                otherNode.x = centerX;
                otherNode.y = topMargin + 220; // 第一级节点下方
            } else {
                // 两个节点垂直排列，第一个在焦点问题下方
                nodes[0].x = centerX;
                nodes[0].y = topMargin + 80; // 焦点问题正下方
                nodes[1].x = centerX;
                nodes[1].y = topMargin + 220; // 第一个节点下方
            }
        } else {
            if (firstLevelNode) {
                // 第一级节点在焦点问题下方居中
                firstLevelNode.x = centerX;
                firstLevelNode.y = topMargin + 80; // 焦点问题正下方
                
                // 其他节点使用分层布局，依次向下摆放
                const otherNodes = nodes.filter(n => n.id !== firstLevelNode.id);
                const levelHeight = Math.max(100, Math.min(140, availableHeight / (otherNodes.length + 1)));
                
                // 对其他节点进行简单排序，以便分层展示
                otherNodes.sort((a, b) => {
                    // 如果有预设y坐标，根据y坐标排序
                    if (a.y !== undefined && b.y !== undefined) {
                        return a.y - b.y;
                    }
                    return 0;
                });
                
                // 为其他节点分配水平位置
                const nodesPerRow = Math.ceil(Math.sqrt(otherNodes.length));
                otherNodes.forEach((node, index) => {
                    const level = Math.floor(index / nodesPerRow) + 1; // 从第2层开始
                    const posInLevel = index % nodesPerRow;
                    const levelWidth = Math.min(availableWidth, nodesPerRow * 120);
                    const xStep = levelWidth / (nodesPerRow + 1);
                    
                    node.x = centerX - levelWidth/2 + (posInLevel + 1) * xStep;
                    node.y = topMargin + 80 + level * levelHeight; // 从第一级节点下方开始
                });
            } else {
                // 第一个节点放在焦点问题正下方，其他节点分层布局
                nodes[0].x = centerX;
                nodes[0].y = topMargin + 80; // 焦点问题正下方
                
                const otherNodes = nodes.slice(1);
                const levelHeight = Math.max(100, Math.min(140, availableHeight / (otherNodes.length + 1)));
                
                // 为其他节点分配水平位置
                const nodesPerRow = Math.ceil(Math.sqrt(otherNodes.length));
                otherNodes.forEach((node, index) => {
                    const level = Math.floor(index / nodesPerRow) + 1; // 从第2层开始
                    const posInLevel = index % nodesPerRow;
                    const levelWidth = Math.min(availableWidth, nodesPerRow * 120);
                    const xStep = levelWidth / (nodesPerRow + 1);
                    
                    node.x = centerX - levelWidth/2 + (posInLevel + 1) * xStep;
                    node.y = topMargin + 80 + level * levelHeight; // 从第一级节点下方开始
                });
            }
        }
        
        // 严格的边界验证，确保所有节点都在边界内
        nodes.forEach(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            const nodeWidth = node.width || nodeDimensions.width;
            const nodeHeight = node.height || nodeDimensions.height;
            
            // 增加安全边距
            const safeMargin = margin + 20;
            const safeTopMargin = topMargin + 20;
            const safeBottomMargin = bottomMargin + 20;
            
            // 确保节点不超出左右边界
            if (node.x - nodeWidth / 2 < safeMargin) {
                node.x = safeMargin + nodeWidth / 2;
            }
            if (node.x + nodeWidth / 2 > width - safeMargin) {
                node.x = width - safeMargin - nodeWidth / 2;
            }
            
            // 确保节点不超出上下边界
            if (node.y - nodeHeight / 2 < safeTopMargin) {
                node.y = safeTopMargin + nodeHeight / 2;
            }
            if (node.y + nodeHeight / 2 > height - safeBottomMargin) {
                node.y = height - safeBottomMargin - nodeHeight / 2;
            }
        });
    }

    // 应用力导向布局算法
    function applyForceDirectedLayout(nodes, links, width, height, nodeSpacing, linkLength) {
        const maxIterations = 300;
        const coolingFactor = 0.95;
        const temperature = 1.0;
        
        // 模拟物理力
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const currentTemp = temperature * Math.pow(coolingFactor, iteration);
            
            // 应用斥力（节点间）
            applyRepulsiveForces(nodes, nodeSpacing, currentTemp);
            
            // 应用引力（连线连接）
            applyAttractiveForces(nodes, links, linkLength, currentTemp);
            
            // 应用边界力（保持节点在可视区域）
            applyBoundaryForces(nodes, width, height, currentTemp);
            
            // 更新位置
            updateNodePositions(nodes, currentTemp);
            
            // 检查收敛性
            if (currentTemp < 0.01) break;
        }
    }

    // 应用斥力 - 防止节点重叠
    function applyRepulsiveForces(nodes, nodeSpacing, temperature) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];
                
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nodeSpacing && distance > 0) {
                    // 计算斥力强度
                    const force = (nodeSpacing - distance) / distance * temperature * 0.5;
                    
                    // 应用斥力
                    const fx = dx * force;
                    const fy = dy * force;
                    
                    nodeA.vx = (nodeA.vx || 0) - fx;
                    nodeA.vy = (nodeA.vy || 0) - fy;
                    nodeB.vx = (nodeB.vx || 0) + fx;
                    nodeB.vy = (nodeB.vy || 0) + fy;
                }
            }
        }
    }

    // 应用引力 - 保持连线连接，并增强第一级节点的引力
    function applyAttractiveForces(nodes, links, linkLength, temperature) {
        // 获取第一级关键词节点
        let firstLevelNode = null;
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                const currentKeyword = match[1].trim();
                firstLevelNode = nodes.find(node => {
                    const nodeLabel = node.label || '';
                    return nodeLabel === currentKeyword || 
                           nodeLabel.includes(currentKeyword) || 
                           currentKeyword.includes(nodeLabel);
                });
            }
        }
        
        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            
            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // 计算引力强度
                    let force = (distance - linkLength) / distance * temperature * 0.3;
                    
                    // 如果连线涉及第一级节点，增强引力
                    if (firstLevelNode && (source.id === firstLevelNode.id || target.id === firstLevelNode.id)) {
                        force *= 1.5; // 增强50%的引力
                    }
                    
                    // 应用引力
                    const fx = dx * force;
                    const fy = dy * force;
                    
                    source.vx = (source.vx || 0) + fx;
                    source.vy = (source.vy || 0) + fy;
                    target.vx = (target.vx || 0) - fx;
                    target.vy = (target.vy || 0) - fy;
                }
            }
        });
        
        // 为第一级节点添加额外的引力，让其他节点倾向于围绕它排列
        if (firstLevelNode) {
            nodes.forEach(node => {
                if (node.id !== firstLevelNode.id) {
                    const dx = firstLevelNode.x - node.x;
                    const dy = firstLevelNode.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // 计算到第一级节点的引力（较弱，避免过度聚集）
                        const force = (distance - linkLength * 2) / distance * temperature * 0.05;
                        
                        // 应用引力
                        const fx = dx * force;
                        const fy = dy * force;
                        
                        node.vx = (node.vx || 0) + fx;
                        node.vy = (node.vy || 0) + fy;
                    }
                }
            });
        }
    }

    // 应用边界力 - 保持节点在可视区域，统一边界间距，确保第一级节点在焦点问题下方
    function applyBoundaryForces(nodes, width, height, temperature) {
        // 统一的边界间距，与层次布局保持一致
        const margin = 150; // 左右边界间距
        const topMargin = 90; // 减小顶部边界间距，与assignCoordinates保持一致
        const bottomMargin = 150; // 底部边界间距
        
        // 获取第一级关键词节点
        let firstLevelNode = null;
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                const currentKeyword = match[1].trim();
                firstLevelNode = nodes.find(node => {
                    const nodeLabel = node.label || '';
                    return nodeLabel === currentKeyword || 
                           nodeLabel.includes(currentKeyword) || 
                           currentKeyword.includes(nodeLabel);
                });
            }
        }
        
        nodes.forEach(node => {
            // 考虑节点尺寸的边界检查
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            const nodeWidth = node.width || nodeDimensions.width;
            const nodeHeight = node.height || nodeDimensions.height;
            
            // 增加安全边距
            const safeMargin = margin + 20;
            const safeTopMargin = topMargin + 20;
            const safeBottomMargin = bottomMargin + 20;
            
            // 左边界检查
            if (node.x - nodeWidth / 2 < safeMargin) {
                node.vx = (node.vx || 0) + (safeMargin + nodeWidth / 2 - node.x) * temperature * 0.2;
            }
            // 右边界检查
            if (node.x + nodeWidth / 2 > width - safeMargin) {
                node.vx = (node.vx || 0) + (width - safeMargin - nodeWidth / 2 - node.x) * temperature * 0.2;
            }
            
            // 第一级节点的特殊边界处理
            if (firstLevelNode && node.id === firstLevelNode.id) {
                // 第一级节点固定在焦点问题正下方
                const targetY = topMargin + 80; // 与assignCoordinates中保持一致
                const yDiff = targetY - node.y;
                node.vy = (node.vy || 0) + yDiff * temperature * 0.5; // 强力固定在目标位置
                
                // 固定到水平居中位置
                const centerX = width / 2;
                const xDiff = centerX - node.x;
                node.vx = (node.vx || 0) + xDiff * temperature * 0.3; // 保持水平居中
            } else {
                // 普通节点的边界处理，需要避免与第一级节点重叠
                // 上边界检查 - 确保节点不会上移超过第一级节点的位置
                if (firstLevelNode) {
                    const minY = topMargin + 80 + 100; // 第一级节点位置 + 间距
                    if (node.y < minY) {
                        node.vy = (node.vy || 0) + (minY - node.y) * temperature * 0.3;
                    }
                } else if (node.y - nodeHeight / 2 < safeTopMargin) {
                    node.vy = (node.vy || 0) + (safeTopMargin + nodeHeight / 2 - node.y) * temperature * 0.2;
                }
                
                // 下边界检查
                if (node.y + nodeHeight / 2 > height - safeBottomMargin) {
                    node.vy = (node.vy || 0) + (height - safeBottomMargin - nodeHeight / 2 - node.y) * temperature * 0.2;
                }
            }
        });
    }

    // 更新节点位置
    function updateNodePositions(nodes, temperature) {
        const damping = 0.8; // 阻尼系数
        
        nodes.forEach(node => {
            // 更新位置
            node.x += (node.vx || 0) * temperature;
            node.y += (node.vy || 0) * temperature;
            
            // 应用阻尼
            node.vx = (node.vx || 0) * damping;
            node.vy = (node.vy || 0) * damping;
            
            // 清理速度
            if (Math.abs(node.vx) < 0.01) node.vx = 0;
            if (Math.abs(node.vy) < 0.01) node.vy = 0;
        });
    }

    // 优化连线路由，避免重叠和文字标签重叠
    function optimizeLinkRouting(nodes, links) {
        console.log('优化连线路由，避免重叠...');
        
        // 检测连线交叉，通过调整节点位置来避免重叠
        for (let i = 0; i < links.length; i++) {
            for (let j = i + 1; j < links.length; j++) {
                const linkA = links[i];
                const linkB = links[j];
                
                if (hasLinkIntersection(linkA, linkB, nodes)) {
                    // 调整节点位置，避免连线重叠
                    adjustNodePositionsToAvoidOverlap(linkA, linkB, nodes);
                }
            }
        }
        
        // 优化文字标签位置，避免重叠
        optimizeLabelPositions(nodes, links);
        
        // 确保同级节点间距均匀
        ensureUniformSpacing(nodes, links);
    }

    // 检测连线是否相交
    function hasLinkIntersection(linkA, linkB, nodes) {
        const sourceA = nodes.find(n => n.id === linkA.source);
        const targetA = nodes.find(n => n.id === linkA.target);
        const sourceB = nodes.find(n => n.id === linkB.source);
        const targetB = nodes.find(n => n.id === linkB.target);
        
        if (!sourceA || !targetA || !sourceB || !targetB) return false;
        
        // 简单的线段相交检测
        return lineSegmentsIntersect(
            sourceA.x, sourceA.y, targetA.x, targetA.y,
            sourceB.x, sourceB.y, targetB.x, targetB.y
        );
    }

    // 线段相交检测
    function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false;
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    // 调整节点位置避免连线重叠
    function adjustNodePositionsToAvoidOverlap(linkA, linkB, nodes) {
        const sourceA = nodes.find(n => n.id === linkA.source);
        const targetA = nodes.find(n => n.id === linkA.target);
        const sourceB = nodes.find(n => n.id === linkB.source);
        const targetB = nodes.find(n => n.id === linkB.target);
        
        if (!sourceA || !targetA || !sourceB || !targetB) return;
        
        // 计算两条连线的中点
        const midA = { x: (sourceA.x + targetA.x) / 2, y: (sourceA.y + targetA.y) / 2 };
        const midB = { x: (sourceB.x + targetB.x) / 2, y: (sourceB.y + targetB.y) / 2 };
        
        // 计算中点之间的距离
        const distance = Math.sqrt(Math.pow(midB.x - midA.x, 2) + Math.pow(midB.y - midA.y, 2));
        
        // 如果中点太近，轻微调整其中一个连线的目标节点位置
        if (distance < 50) {
            const offset = 20;
            const angle = Math.atan2(targetB.y - sourceB.y, targetB.x - sourceB.x);
            
            // 垂直于连线方向偏移目标节点
            const perpAngle = angle + Math.PI / 2;
            targetB.x += Math.cos(perpAngle) * offset;
            targetB.y += Math.sin(perpAngle) * offset;
        }
    }

    // 最终位置调整
    function finalizePositions(nodes, width, height) {
        const margin = 60;
        
        nodes.forEach(node => {
            // 确保节点在可视区域内
            node.x = Math.max(margin, Math.min(width - margin, node.x));
            node.y = Math.max(margin, Math.min(height - margin, node.y));
            
            // 清理临时属性
            delete node.vx;
            delete node.vy;
        });
        
        // 清理连线中的贝塞尔曲线属性，确保统一使用直线
        if (window.currentGraphData && window.currentGraphData.links) {
            window.currentGraphData.links.forEach(link => {
                delete link.isCurved;
                delete link.controlX;
                delete link.controlY;
            });
        }
    }
    
    // 优化文字标签位置，避免重叠
    function optimizeLabelPositions(nodes, links) {
        console.log('优化文字标签位置...');
        
        // 为每个连线计算最佳标签位置
        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            
            if (!source || !target) return;
            
            // 计算连线中点
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            
            // 计算标签尺寸
            const labelWidth = Math.max(60, (link.label || '双击编辑').length * 8);
            const labelHeight = 20;
            
            // 检查标签是否与其他元素重叠
            let bestOffset = { x: 0, y: 0 };
            let minOverlap = Infinity;
            
            // 尝试不同的偏移位置，减少偏移量使标签更紧凑
            const offsets = [
                { x: 0, y: 0 },
                { x: 15, y: 0 },
                { x: -15, y: 0 },
                { x: 0, y: 15 },
                { x: 0, y: -15 },
                { x: 15, y: 15 },
                { x: -15, y: -15 },
                { x: 10, y: 10 },
                { x: -10, y: -10 }
            ];
            
            offsets.forEach(offset => {
                const overlap = calculateLabelOverlap(
                    midX + offset.x, midY + offset.y,
                    labelWidth, labelHeight,
                    nodes, links, link.id
                );
                
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    bestOffset = offset;
                }
            });
            
            // 存储最佳标签位置
            link.labelX = midX + bestOffset.x;
            link.labelY = midY + bestOffset.y;
        });
    }
    
    // 计算标签与其他元素的重叠程度
    function calculateLabelOverlap(labelX, labelY, labelWidth, labelHeight, nodes, links, currentLinkId) {
        let overlap = 0;
        
        // 检查与节点的重叠
        nodes.forEach(node => {
            const nodeWidth = Math.max(80, (node.label || '').length * 8);
            const nodeHeight = 40;
            
            if (rectanglesOverlap(
                labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight,
                node.x - nodeWidth/2, node.y - nodeHeight/2, nodeWidth, nodeHeight
            )) {
                overlap += 100; // 与节点重叠惩罚很大
            }
        });
        
        // 检查与其他标签的重叠
        links.forEach(link => {
            if (link.id === currentLinkId) return;
            
            if (link.labelX !== undefined && link.labelY !== undefined) {
                const otherLabelWidth = Math.max(60, (link.label || '双击编辑').length * 8);
                const otherLabelHeight = 20;
                
                if (rectanglesOverlap(
                    labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight,
                    link.labelX - otherLabelWidth/2, link.labelY - otherLabelHeight/2, otherLabelWidth, otherLabelHeight
                )) {
                    overlap += 50; // 与标签重叠惩罚
                }
            }
        });
        
        return overlap;
    }
    
    // 检查两个矩形是否重叠
    function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
    }
    
    // 确保同级节点间距均匀
    function ensureUniformSpacing(nodes, links) {
        console.log('确保同级节点间距均匀...');
        
        // 按y坐标分组，找出同级节点
        const levelGroups = new Map();
        nodes.forEach(node => {
            const level = Math.round(node.y / 50); // 50像素内的节点认为是同级
            if (!levelGroups.has(level)) {
                levelGroups.set(level, []);
            }
            levelGroups.get(level).push(node);
        });
        
        // 为每一层调整节点间距
        levelGroups.forEach((levelNodes, level) => {
            if (levelNodes.length <= 1) return;
            
            // 按x坐标排序
            levelNodes.sort((a, b) => a.x - b.x);
            
            // 计算总宽度和间距
            const totalNodeWidth = levelNodes.reduce((total, node) => {
                const nodeWidth = Math.max(100, (node.label || '').length * 10);
                return total + nodeWidth;
            }, 0);
            
            // 动态计算间距，使同级节点更紧凑
            const estimatedWidth = 800; // 估计的画布宽度
            const estimatedMargin = 100;
            const availableWidth = estimatedWidth - 2 * estimatedMargin;
            const minSpacing = Math.max(30, Math.min(60, availableWidth / (levelNodes.length + 2))); // 更紧凑间距：30-60px
            
            const totalSpacing = (levelNodes.length - 1) * minSpacing;
            const requiredWidth = totalNodeWidth + totalSpacing;
            
            // 计算起始位置
            let startX = levelNodes[0].x - (requiredWidth - totalNodeWidth) / 2;
            
            // 重新分配x坐标
            let currentX = startX;
            levelNodes.forEach((node, index) => {
                const nodeWidth = Math.max(100, (node.label || '').length * 10);
                
                if (index === 0) {
                    node.x = startX + nodeWidth / 2;
                } else {
                    currentX += minSpacing;
                    node.x = currentX + nodeWidth / 2;
                    currentX += nodeWidth;
                }
            });
        });
    }

    // 已移除：默认/模拟概念图生成代码

    // 显示并渲染概念图
    function displayConceptMap(graphData) {
        currentGraphData = graphData;
        // 将currentGraphData设置为全局变量，供adjustViewBox使用
        window.currentGraphData = currentGraphData;
        
        // 隐藏加载符号
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            // 移除上方加载动画
            const loadingGroup = svg.querySelector('#loading-animation');
            if (loadingGroup) {
                loadingGroup.remove();
                console.log('上方加载动画已移除');
            }
        }
        
        // 在概念图顶部显示焦点问题
        displayFocusQuestion();
        
        ensureCanvasVisible();
        drawGraph(currentGraphData);
        
        // 依赖绘制时的直接事件绑定，去掉统一延迟绑定
        // bindGraphEvents();
        
        exportBtn.disabled = false;
        updateStatusBar(currentGraphData);
        saveToHistory(currentGraphData);
    }

    // 确保画布可见
    function ensureCanvasVisible() {
        console.log('ensureCanvasVisible 被调用');
        
        if (graphPlaceholder) {
            graphPlaceholder.style.display = 'none';
            console.log('占位符已隐藏');
        } else {
            console.error('graphPlaceholder 元素未找到');
        }
        
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        if (conceptMapDisplay) {
            conceptMapDisplay.style.display = 'flex';
            console.log('概念图展示区域已显示');
        } else {
            console.error('concept-map-display 元素未找到');
        }
        
        if (editToolbar) {
            editToolbar.style.display = 'grid';
            console.log('编辑工具栏已显示');
        } else {
            console.error('editToolbar 元素未找到');
        }
    }

    // 初始化空图数据
    function ensureGraphInitialized() {
        if (!currentGraphData) {
            currentGraphData = { 
                nodes: [], 
                links: [],
                // 确保使用直线连接，不使用贝塞尔曲线
                layoutType: 'straight'
            };
            window.currentGraphData = currentGraphData;
            ensureCanvasVisible();
            updateStatusBar(currentGraphData);
            saveToHistory(currentGraphData);
        }
    }

    // 判断两个节点之间是否为层次连接
    function isHierarchicalConnection(source, target, allNodes, allLinks) {
        // 计算节点的层次级别（基于y坐标）
        const sourceLevel = Math.round(source.y / 100); // 每100像素为一个层次
        const targetLevel = Math.round(target.y / 100);
        
        // 如果层次不同，则为层次连接
        if (sourceLevel !== targetLevel) {
            return true;
        }
        
        // 检查是否存在间接的层次关系
        // 通过BFS查找是否存在从source到target的层次路径
        const visited = new Set();
        const queue = [{ node: source, level: sourceLevel }];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current.node.id)) continue;
            visited.add(current.node.id);
            
            // 查找当前节点的所有连接
            allLinks.forEach(link => {
                if (link.source === current.node.id) {
                    const nextNode = allNodes.find(n => n.id === link.target);
                    if (nextNode) {
                        const nextLevel = Math.round(nextNode.y / 100);
                        if (nextLevel !== current.level) {
                            // 找到层次变化，说明存在层次关系
                            if (nextNode.id === target.id) {
                                return true; // 找到层次连接
                            }
                            queue.push({ node: nextNode, level: nextLevel });
                        }
                    }
                }
            });
        }
        
        // 默认情况下，如果y坐标差异较大，认为是层次连接
        const yDiff = Math.abs(target.y - source.y);
        return yDiff > 80; // 如果y坐标差异大于80像素，认为是层次连接
    }

    // 计算文字实际尺寸的函数
    function calculateTextDimensions(text, fontSize = '12', fontFamily = 'Arial, sans-serif') {
        // 创建临时SVG元素来测量文字尺寸
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        
        tempText.setAttribute('font-size', fontSize);
        tempText.setAttribute('font-family', fontFamily);
        tempText.setAttribute('font-weight', '500');
        tempText.textContent = text;
        
        tempSvg.appendChild(tempText);
        document.body.appendChild(tempSvg);
        
        // 获取文字的实际尺寸
        const bbox = tempText.getBBox();
        const width = bbox.width;
        const height = bbox.height;
        
        // 清理临时元素
        document.body.removeChild(tempSvg);
        
        return { width, height };
    }

    // 计算节点最佳尺寸的函数
    function calculateNodeDimensions(nodeLabel, minWidth = 80, minHeight = 40, padding = 20) {
        if (!nodeLabel || nodeLabel.trim() === '') {
            return { width: minWidth, height: minHeight };
        }
        
        // 计算文字尺寸
        const textDimensions = calculateTextDimensions(nodeLabel, '12', 'Arial, sans-serif');
        
        // 计算节点尺寸（文字尺寸 + 内边距）
        const nodeWidth = Math.max(minWidth, textDimensions.width + padding);
        const nodeHeight = Math.max(minHeight, textDimensions.height + padding);
        
        return { width: nodeWidth, height: nodeHeight };
    }

    // 使用原生SVG简单渲染节点和连线
    function drawGraph(data) {
        console.log('drawGraph 函数被调用，数据:', data);
        
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        if (!conceptMapDisplay) {
            console.error('concept-map-display 元素未找到');
            return;
        }
        console.log('concept-map-display 元素找到:', conceptMapDisplay);
        
        const svg = conceptMapDisplay.querySelector('.concept-graph');
        if (!svg) {
            console.error('concept-graph SVG 元素未找到');
            return;
        }
        console.log('concept-graph SVG 元素找到:', svg);
        
        const width = svg.clientWidth || 800;
        const height = svg.clientHeight || 500;
        console.log('SVG 尺寸:', width, 'x', height);

        // 保存焦点问题元素（如果存在）
        const focusQuestion = svg.querySelector('#focus-question');
        
        // 清空
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        
        // 重新添加焦点问题（如果存在）
        if (focusQuestion) {
            svg.appendChild(focusQuestion);
        }

        // 先渲染连线
        const nodeById = new Map(data.nodes.map(n => [n.id, n]));
        data.links.forEach(link => {
            const source = nodeById.get(link.source);
            const target = nodeById.get(link.target);
            if (!source || !target) return;
            
            // 计算连线起点和终点（矩形节点边缘）- 使用新的尺寸计算
            const sourceDimensions = calculateNodeDimensions(source.label || '', 80, 40, 24);
            const targetDimensions = calculateNodeDimensions(target.label || '', 80, 40, 24);
            
            const sourceWidth = source.width || sourceDimensions.width;
            const sourceHeight = source.height || sourceDimensions.height;
            const targetWidth = target.width || targetDimensions.width;
            const targetHeight = target.height || targetDimensions.height;
            
            // 判断节点间的层次关系
            const isHierarchical = isHierarchicalConnection(source, target, data.nodes, data.links);
            
            let startX, startY, endX, endY;
            
            if (isHierarchical) {
                // 层次连接：下级节点连接到上级节点的下面
                if (target.y > source.y) {
                    // 目标节点在源节点下方（下级）
                    startX = source.x;                    // 源节点水平中点
                    startY = source.y + sourceHeight / 2; // 源节点下边缘中点
                    endX = target.x;                      // 目标节点水平中点
                    endY = target.y - targetHeight / 2;   // 目标节点上边缘中点
                } else {
                    // 目标节点在源节点上方（上级）
                    startX = source.x;                    // 源节点水平中点
                    startY = source.y - sourceHeight / 2; // 源节点上边缘中点
                    endX = target.x;                      // 目标节点水平中点
                    endY = target.y + targetHeight / 2;   // 目标节点下边缘中点
                }
            } else {
                // 同级连接：连接到节点的左右
                const dx = target.x - source.x;
                if (dx > 0) {
                    // 源节点在左，目标节点在右
                    startX = source.x + sourceWidth / 2;  // 源节点右边缘中点
                    startY = source.y;                    // 源节点垂直中点
                    endX = target.x - targetWidth / 2;    // 目标节点左边缘中点
                    endY = target.y;                      // 目标节点垂直中点
                } else {
                    // 源节点在右，目标节点在左
                    startX = source.x - sourceWidth / 2;  // 源节点左边缘中点
                    startY = source.y;                    // 源节点垂直中点
                    endX = target.x + targetWidth / 2;    // 目标节点右边缘中点
                    endY = target.y;                      // 目标节点垂直中点
                }
            }
            
            // 创建带箭头的连接线
            const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            lineGroup.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            
            // 计算连接线中点
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            
            // 计算箭头位置（确保箭头到结束节点的距离与连接线到开始节点的距离一致）
            const arrowLength = 8; // 缩小箭头长度
            const arrowWidth = 6;  // 缩小箭头宽度
            
            // 计算箭头偏移距离，确保与连接线到开始节点的距离一致
            const offsetDistance = 8; // 固定偏移距离，与连接线到开始节点的距离保持一致
            const arrowOffset = offsetDistance / lineLength; // 箭头偏移比例
            
            const arrowX = endX - (endX - startX) * arrowOffset;
            const arrowY = endY - (endY - startY) * arrowOffset;
            
            // 计算文字区域的宽度，为文字留出空间
            const textWidth = Math.max(60, (link.label || '双击编辑').length * 8);
            const textHeight = 20;
            
            // 计算文字区域的边界
            const textLeft = midX - textWidth / 2;
            const textRight = midX + textWidth / 2;
            const textTop = midY - textHeight / 2;
            const textBottom = midY + textHeight / 2;
            
            // 创建一条完整的连接线，使用stroke-dasharray创建断开效果
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 创建连线路径 - 统一使用直线连接
            const linePath = `M ${startX} ${startY} L ${arrowX} ${arrowY}`;
            line.setAttribute('d', linePath);
            line.setAttribute('stroke', '#aaa');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round'); // 让线段端点更圆润
            
            // 计算断开位置和大小
            const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
            // 缩小断开区域，让文字和连接线更紧凑
            const textGap = Math.max(20, textWidth * 0.8); // 文字区域宽度，但缩小到80%
            const gapStart = (totalLength - textGap) / 2; // 断开开始位置
            const gapEnd = gapStart + textGap; // 断开结束位置
            
            // 使用stroke-dasharray创建断开效果
            // 格式：[第一段长度, 断开长度, 第二段长度]
            line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
            
            // 创建箭头
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 计算箭头方向
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowAngle1 = angle + Math.PI / 8; // 缩小箭头角度，让箭头更精致
            const arrowAngle2 = angle - Math.PI / 8; // 缩小箭头角度，让箭头更精致
            
            // 计算箭头的三个顶点
            const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
            const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
            const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
            const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
            
            // 创建箭头路径
            const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
            arrow.setAttribute('d', arrowPath);
            arrow.setAttribute('fill', '#aaa');
            arrow.setAttribute('stroke', '#aaa');
            arrow.setAttribute('stroke-width', '1');
            
            // 创建连接线标签（可编辑的文字）
            const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // 计算文字在连线上的精确位置，确保文字始终跟随连线
            const labelX = midX;
            const labelY = midY + 4;
            linkLabel.setAttribute('x', labelX);
            linkLabel.setAttribute('y', labelY);
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '12');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('font-weight', '500');
            linkLabel.setAttribute('pointer-events', 'all');
            linkLabel.setAttribute('cursor', 'pointer');
            linkLabel.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            linkLabel.setAttribute('data-link-label', 'true');
            
            // 设置标签文字内容
            linkLabel.textContent = link.label || '双击编辑';

            // 连线标签双击编辑（回到手动创建逻辑）
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
            // 事件绑定由bindGraphEvents统一处理
            
            // 将连接线、箭头和标签添加到组中
            lineGroup.appendChild(line);
            lineGroup.appendChild(arrow);
            lineGroup.appendChild(linkLabel);
            svg.appendChild(lineGroup);
        });

        // 再渲染节点
        console.log('开始渲染节点，节点数量:', data.nodes.length);
        data.nodes.forEach((node, idx) => {
            console.log(`渲染节点 ${idx + 1}:`, node);
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('data-node-id', node.id);

            // 计算节点尺寸 - 根据文字内容自动调整
            const nodeLabel = node.label || `节点${idx + 1}`;
            const nodeDimensions = calculateNodeDimensions(nodeLabel, 80, 40, 24); // 增加内边距到24px
            
            // 优先使用保存的尺寸，如果没有保存则使用计算出的尺寸
            const nodeWidth = node.width || nodeDimensions.width;
            const nodeHeight = node.height || nodeDimensions.height;
            const radius = 8; // 圆角半径

            // 设置组的位置（使用绝对定位，确保拖动时连线能正确跟随）
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

            // 创建圆角矩形路径（相对于组的位置）
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', -nodeWidth / 2); // 相对于组中心
            rect.setAttribute('y', -nodeHeight / 2); // 相对于组中心
            rect.setAttribute('width', nodeWidth);
            rect.setAttribute('height', nodeHeight);
            rect.setAttribute('rx', radius);
            rect.setAttribute('ry', radius);
            rect.setAttribute('fill', '#667eea');
            rect.setAttribute('fill-opacity', '0.9');
            
            // 根据选中状态设置边框样式
            if (selectedNodeId === node.id) {
                rect.setAttribute('stroke', '#ffd700'); // 金色边框表示选中
                rect.setAttribute('stroke-width', '3');
        } else {
                rect.setAttribute('stroke', '#fff');
                rect.setAttribute('stroke-width', '2');
            }
            
            rect.setAttribute('cursor', 'pointer');

            // 创建文字（相对于组的中心位置）
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 0); // 相对于组的中心位置
            text.setAttribute('y', 0); // 相对于组的中心位置，垂直居中
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle'); // 确保垂直居中
            text.setAttribute('font-size', node.fontSize || '12'); // 优先使用保存的字体大小
            
            // 添加调试信息
            if (node.fontSize) {
                console.log('节点文字大小已恢复:', {
                    nodeId: node.id,
                    savedFontSize: node.fontSize,
                    appliedFontSize: node.fontSize || '12'
                });
            }
            text.setAttribute('fill', 'white');
            text.setAttribute('font-weight', '500');
            text.setAttribute('pointer-events', 'none'); // 防止文字阻挡点击
            text.textContent = nodeLabel;

            // 设置节点样式和属性
            g.style.pointerEvents = 'all';
            g.style.cursor = 'pointer';

            // 直接绑定节点事件（点击选中、双击编辑、按下开始拖拽）
            g.addEventListener('click', function(e) {
                e.stopPropagation();
                selectNode(node.id);
            });

            g.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editNodeText(node.id);
            });

            rect.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                startDrag(node.id, e.clientX, e.clientY);
            });

            g.appendChild(rect);
            g.appendChild(text);
            svg.appendChild(g);
            console.log(`节点 ${node.id} 已添加到SVG`);
        });
        
        console.log('所有节点渲染完成');

        // 标记事件监听器已添加
        // if (!eventListenersAdded) { // eventListenersAdded 已移除
        //     eventListenersAdded = true;
        // }

        // 添加点击画布空白区域取消选中的功能
        // 只在第一次绘制时添加，避免重复绑定
        if (!svg.hasAttribute('data-canvas-click-bound')) {
            svg.addEventListener('click', function(e) {
                // 如果点击的是画布空白区域（不是节点），则取消选中
                if (e.target === svg) {
                    deselectNode();
                }
            });
            svg.setAttribute('data-canvas-click-bound', 'true');
        }
        
        console.log('drawGraph 函数执行完成');
    }

    // 开始拖动节点
    function startDrag(nodeId, clientX, clientY) {
        const node = currentGraphData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // 设置拖动状态
        isDragging = true;
        selectedNodeId = nodeId;
        dragStartX = clientX;
        dragStartY = clientY;
        dragOriginalNodeX = node.x;
        dragOriginalNodeY = node.y;

        // 选中节点
        selectNode(nodeId);

        // 改变鼠标样式和节点样式
        const nodeGroup = document.querySelector(`g[data-node-id="${nodeId}"]`);
        if (nodeGroup) {
            nodeGroup.style.cursor = 'grabbing';
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                rect.setAttribute('fill-opacity', '0.7');
                rect.setAttribute('stroke-width', '4');
            }
        }

        // 添加全局拖动事件监听器
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        
        // 防止文本选择
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    }

    // 处理拖动过程
    function handleDrag(e) {
        if (!isDragging || !selectedNodeId) return;

        const node = currentGraphData.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;

        // 计算新位置
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        const newX = dragOriginalNodeX + deltaX;
        const newY = dragOriginalNodeY + deltaY;

        // 更新节点位置
        node.x = newX;
        node.y = newY;

        // 同步更新节点分组的位置，保证视觉上跟随移动
        const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
        if (nodeGroup) {
            nodeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
        }

        // 实时更新相关连接线位置
        updateConnectedLinks(selectedNodeId);
    }

    // 处理拖动结束
    function handleDragEnd(e) {
        if (!isDragging || !selectedNodeId) return;

        // 清理拖动状态
        isDragging = false;
        
        // 恢复鼠标样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
        if (nodeGroup) {
            nodeGroup.style.cursor = 'pointer';
            
            // 恢复节点样式
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                rect.setAttribute('fill-opacity', '0.9');
                rect.setAttribute('stroke-width', '3'); // 保持选中状态的边框
            }
        }

        // 不需要重新绘制连线，因为拖动过程中已经实时更新了
        // 连接线位置已经在拖动过程中通过updateConnectedLinks更新

        // 移除全局事件监听器
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);

        // 更新全局变量
        window.currentGraphData = currentGraphData;
        
        // 保存到历史记录
        saveToHistory(currentGraphData);
        showMessage('节点位置已更新', 'info');
    }

    // 更新相关连线的位置
    function updateConnectedLinks(nodeId) {
        const svg = document.querySelector('.concept-graph');
        if (!svg) return;

        // 找到所有与该节点相关的连线
        const relatedLinks = currentGraphData.links.filter(link => 
            link.source === nodeId || link.target === nodeId
        );

        // 更新这些连线的位置
        relatedLinks.forEach(link => {
            const linkGroup = svg.querySelector(`g[data-link-id="${link.id}"]`);
            if (linkGroup) {
                updateLinkPosition(linkGroup, link);
            }
        });
        
        // 更新全局变量
        window.currentGraphData = currentGraphData;
    }

    // 更新单个连线的位置
    function updateLinkPosition(linkGroup, link) {
        const sourceNode = currentGraphData.nodes.find(n => n.id === link.source);
        const targetNode = currentGraphData.nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return;

        // 获取连接线、箭头和标签元素
        const line = linkGroup.querySelector('path:nth-child(1)'); // 连接线
        const arrow = linkGroup.querySelector('path:nth-child(2)'); // 箭头
        const linkLabel = linkGroup.querySelector('text'); // 标签
        
        if (!line || !arrow || !linkLabel) return;

        // 计算连线起点和终点（矩形节点边缘）
        const sourceWidth = sourceNode.width || Math.max(80, (sourceNode.label || '').length * 8);
        const sourceHeight = sourceNode.height || 40;
        const targetWidth = targetNode.width || Math.max(80, (targetNode.label || '').length * 8);
        const targetHeight = targetNode.height || 40;

        // 判断节点间的层次关系
        const isHierarchical = isHierarchicalConnection(sourceNode, targetNode, currentGraphData.nodes, currentGraphData.links);
        
        let startX, startY, endX, endY;
        
        if (isHierarchical) {
            // 层次连接：下级节点连接到上级节点的下面
            if (targetNode.y > sourceNode.y) {
                // 目标节点在源节点下方（下级）
                startX = sourceNode.x;                    // 源节点水平中点
                startY = sourceNode.y + sourceHeight / 2; // 源节点下边缘中点
                endX = targetNode.x;                      // 目标节点水平中点
                endY = targetNode.y - targetHeight / 2;   // 目标节点上边缘中点
            } else {
                // 目标节点在源节点上方（上级）
                startX = sourceNode.x;                    // 源节点水平中点
                startY = sourceNode.y - sourceHeight / 2; // 源节点上边缘中点
                endX = targetNode.x;                      // 目标节点水平中点
                endY = targetNode.y + targetHeight / 2;   // 目标节点下边缘中点
            }
        } else {
            // 同级连接：连接到节点的左右
            const dx = targetNode.x - sourceNode.x;
            if (dx > 0) {
                // 源节点在左，目标节点在右
                startX = sourceNode.x + sourceWidth / 2;  // 源节点右边缘中点
                startY = sourceNode.y;                    // 源节点垂直中点
                endX = targetNode.x - targetWidth / 2;    // 目标节点左边缘中点
                endY = targetNode.y;                      // 目标节点垂直中点
            } else {
                // 源节点在右，目标节点在左
                startX = sourceNode.x - sourceWidth / 2;  // 源节点左边缘中点
                startY = sourceNode.y;                    // 源节点垂直中点
                endX = targetNode.x + targetWidth / 2;    // 目标节点右边缘中点
                endY = targetNode.y;                      // 目标节点垂直中点
            }
        }

        // 计算箭头位置（确保箭头到结束节点的距离与连接线到开始节点的距离一致）
        const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const arrowLength = 8; // 缩小箭头长度
        const arrowWidth = 6;  // 缩小箭头宽度
        
        // 计算箭头偏移距离，确保与连接线到开始节点的距离一致
        const offsetDistance = 8; // 固定偏移距离，与连接线到开始节点的距离保持一致
        const arrowOffset = offsetDistance / lineLength; // 箭头偏移比例
        
        const arrowX = endX - (endX - startX) * arrowOffset;
        const arrowY = endY - (endY - startY) * arrowOffset;
        
        // 计算连接线中点
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // 计算文字区域的宽度，为文字留出空间
        const textWidth = Math.max(60, (link.label || '双击编辑').length * 8);
        const textHeight = 20;
        
        // 计算文字区域的边界
        const textLeft = midX - textWidth / 2;
        const textRight = midX + textWidth / 2;
        
        // 更新连接线路径和断开效果
        const linePath = `M ${startX} ${startY} L ${arrowX} ${arrowY}`;
        line.setAttribute('d', linePath);
        
        // 重新计算断开位置和大小
        const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
        // 缩小断开区域，让文字和连接线更紧凑
        const textGap = Math.max(20, textWidth * 0.8); // 文字区域宽度，但缩小到80%
        const gapStart = (totalLength - textGap) / 2; // 断开开始位置
        const gapEnd = gapStart + textGap; // 断开结束位置
        
        // 更新stroke-dasharray创建断开效果
        line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
        
        // 更新标签位置，确保文字始终跟随连线
        const labelX = midX;
        const labelY = midY + 4;
        linkLabel.setAttribute('x', labelX);
        linkLabel.setAttribute('y', labelY);
        
        // 更新箭头位置
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowAngle1 = angle + Math.PI / 8;
        const arrowAngle2 = angle - Math.PI / 8;
        
        // 计算箭头的三个顶点
        const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
        const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
        const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
        const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
        
        // 更新箭头路径
        const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
        arrow.setAttribute('d', arrowPath);
    }

    // 重新绘制所有连线
    function redrawAllLinks() {
        const svg = document.querySelector('.concept-graph');
        if (!svg) return;

        // 清除所有现有连线（现在使用g元素）
        const existingLinks = svg.querySelectorAll('g[data-link-id]');
        existingLinks.forEach(link => link.remove());

        // 重新绘制所有连线
        currentGraphData.links.forEach(link => {
            const sourceNode = currentGraphData.nodes.find(n => n.id === link.source);
            const targetNode = currentGraphData.nodes.find(n => n.id === link.target);
            
            if (!sourceNode || !targetNode) return;
            
            // 计算连线起点和终点（矩形节点边缘）
            const sourceWidth = Math.max(80, (sourceNode.label || '').length * 8);
            const sourceHeight = 40;
            const targetWidth = Math.max(80, (targetNode.label || '').length * 8);
            const targetHeight = 40;
            
            // 判断节点间的层次关系
            const isHierarchical = isHierarchicalConnection(sourceNode, targetNode, currentGraphData.nodes, currentGraphData.links);
            
            let startX, startY, endX, endY;
            
            if (isHierarchical) {
                // 层次连接：下级节点连接到上级节点的下面
                if (targetNode.y > sourceNode.y) {
                    // 目标节点在源节点下方（下级）
                    startX = sourceNode.x;                    // 源节点水平中点
                    startY = sourceNode.y + sourceHeight / 2; // 源节点下边缘中点
                    endX = targetNode.x;                      // 目标节点水平中点
                    endY = targetNode.y - targetHeight / 2;   // 目标节点上边缘中点
                } else {
                    // 目标节点在源节点上方（上级）
                    startX = sourceNode.x;                    // 源节点水平中点
                    startY = sourceNode.y - sourceHeight / 2; // 源节点上边缘中点
                    endX = targetNode.x;                      // 目标节点水平中点
                    endY = targetNode.y + targetHeight / 2;   // 目标节点下边缘中点
                }
            } else {
                // 同级连接：连接到节点的左右
                const dx = targetNode.x - sourceNode.x;
                if (dx > 0) {
                    // 源节点在左，目标节点在右
                    startX = sourceNode.x + sourceWidth / 2;  // 源节点右边缘中点
                    startY = sourceNode.y;                    // 源节点垂直中点
                    endX = targetNode.x - targetWidth / 2;    // 目标节点左边缘中点
                    endY = targetNode.y;                      // 目标节点垂直中点
                } else {
                    // 源节点在右，目标节点在左
                    startX = sourceNode.x - sourceWidth / 2;  // 源节点左边缘中点
                    startY = sourceNode.y;                    // 源节点垂直中点
                    endX = targetNode.x + targetWidth / 2;    // 目标节点右边缘中点
                    endY = targetNode.y;                      // 目标节点垂直中点
                }
            }
            
            // 创建带箭头的连接线
            const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            lineGroup.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            
            // 计算连接线中点
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // 计算文字区域的宽度，为文字留出空间
            const textWidth = Math.max(60, (link.label || '双击编辑').length * 8);
            const textHeight = 20;
            
            // 计算文字区域的边界
            const textLeft = midX - textWidth / 2;
            const textRight = midX + textWidth / 2;
            
            // 计算箭头位置（确保箭头到结束节点的距离与连接线到开始节点的距离一致）
            const arrowLength = 8; // 缩小箭头长度
            const arrowWidth = 6;  // 缩小箭头宽度
            
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const offsetDistance = 8; // 固定偏移距离，与连接线到开始节点的距离保持一致
            const arrowOffset = offsetDistance / lineLength; // 箭头偏移比例
            
            const arrowX = endX - (endX - startX) * arrowOffset;
            const arrowY = endY - (endY - startY) * arrowOffset;
            
            // 创建一条完整的连接线，使用stroke-dasharray创建断开效果
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 创建连线路径 - 统一使用直线连接
            const linePath = `M ${startX} ${startY} L ${arrowX} ${arrowY}`;
            line.setAttribute('d', linePath);
            line.setAttribute('stroke', '#aaa');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round'); // 让线段端点更圆润
            
            // 计算断开位置和大小
            const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
            // 缩小断开区域，让文字和连接线更紧凑
            const textGap = Math.max(20, textWidth * 0.8); // 文字区域宽度，但缩小到80%
            const gapStart = (totalLength - textGap) / 2; // 断开开始位置
            const gapEnd = gapStart + textGap; // 断开结束位置
            
            // 使用stroke-dasharray创建断开效果
            // 格式：[第一段长度, 断开长度, 第二段长度]
            line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
            
            // 创建箭头
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 计算箭头方向
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowAngle1 = angle + Math.PI / 8; // 缩小箭头角度，让箭头更精致
            const arrowAngle2 = angle - Math.PI / 8; // 缩小箭头角度，让箭头更精致
            
            // 计算箭头的三个顶点
            const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
            const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
            const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
            const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
            
            // 创建箭头路径
            const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
            arrow.setAttribute('d', arrowPath);
            arrow.setAttribute('fill', '#aaa');
            arrow.setAttribute('stroke', '#aaa');
            arrow.setAttribute('stroke-width', '1');
            
            // 创建连接线标签（可编辑的文字）
            const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // 计算文字在连线上的精确位置，确保文字始终跟随连线
            const labelX = midX;
            const labelY = midY + 4;
            linkLabel.setAttribute('x', labelX);
            linkLabel.setAttribute('y', labelY);
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '12');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('font-weight', '500');
            linkLabel.setAttribute('pointer-events', 'all');
            linkLabel.setAttribute('cursor', 'pointer');
            linkLabel.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            linkLabel.setAttribute('data-link-label', 'true');
            
            // 设置标签文字内容
            linkLabel.textContent = link.label || '双击编辑';

            // 连线标签双击编辑（回到手动创建逻辑）
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
            // 事件绑定由bindGraphEvents统一处理
            
            // 将连接线、箭头和标签添加到组中
            lineGroup.appendChild(line);
            lineGroup.appendChild(arrow);
            lineGroup.appendChild(linkLabel);
            svg.appendChild(lineGroup);
        });
        
        // 更新全局变量
        window.currentGraphData = currentGraphData;
        
        // 重新绑定连线事件
        if (typeof bindLinkEvents === 'function') {
            bindLinkEvents();
        }
    }

    // 清理函数 - 页面卸载时移除所有事件监听器
    function cleanup() {
        // 移除全局拖动事件监听器
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        
        // 恢复页面样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup);

    // 双击编辑连接线标签
    function editLinkLabel(linkId) {
        const link = currentGraphData.links.find(l => (l.id || `link-${l.source}-${l.target}`) === linkId);
        if (!link) return;

        // 获取SVG画布和其位置信息
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        const svg = conceptMapDisplay.querySelector('.concept-graph');
        const svgRect = svg.getBoundingClientRect();

        // 找到连接线标签元素
        const linkLabel = svg.querySelector(`text[data-link-id="${linkId}"]`);
        if (!linkLabel) return;

        // 获取标签的位置
        const labelX = parseFloat(linkLabel.getAttribute('x'));
        const labelY = parseFloat(linkLabel.getAttribute('y'));

        // 计算输入框在页面中的绝对位置
        const inputLeft = svgRect.left + labelX - 50; // 输入框宽度的一半
        const inputTop = svgRect.top + labelY - 15;   // 输入框高度的一半

        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = link.label || '';
        input.style.cssText = `
            position: fixed;
            left: ${inputLeft}px;
            top: ${inputTop}px;
            width: 100px;
            height: 30px;
            border: 2px solid #667eea;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            font-family: inherit;
            z-index: 1000;
            background: white;
            text-align: center;
            box-sizing: border-box;
            outline: none;
        `;

        document.body.appendChild(input);
        input.focus();
        input.select();

        // 保存编辑结果
        function saveEdit() {
            const newLabel = input.value.trim();
            link.label = newLabel;
            
            // 更新标签显示
            linkLabel.textContent = newLabel || '双击编辑';
            
            // 移除输入框
            document.body.removeChild(input);
            
            // 更新全局变量
            window.currentGraphData = currentGraphData;
            
            // 保存到历史记录
            saveToHistory(currentGraphData);
            showMessage('连接线标签已更新', 'info');
        }

        // 处理键盘事件
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.body.removeChild(input);
            }
        });

        // 处理失焦事件
        input.addEventListener('blur', function() {
            if (document.body.contains(input)) {
                saveEdit();
            }
        });

        // 动态调整输入框位置（处理窗口滚动和缩放）
        function updateInputPosition() {
            if (document.body.contains(input)) {
                const newSvgRect = svg.getBoundingClientRect();
                const newInputLeft = newSvgRect.left + labelX - 50;
                const newInputTop = newSvgRect.top + labelY - 15;
                input.style.left = newInputLeft + 'px';
                input.style.top = newInputTop + 'px';
            }
        }

        window.addEventListener('resize', updateInputPosition);
        window.addEventListener('scroll', updateInputPosition);
    }

    // 双击编辑节点文字
    function editNodeText(nodeId) {
        const node = currentGraphData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // 获取SVG画布和其位置信息
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        const svg = conceptMapDisplay.querySelector('.concept-graph');
        const svgRect = svg.getBoundingClientRect();

        // 计算节点尺寸
        const nodeWidth = Math.max(80, (node.label || '').length * 8);
        const nodeHeight = 40;

        // 计算输入框在页面中的绝对位置
        const inputLeft = svgRect.left + (node.x - nodeWidth / 2);
        const inputTop = svgRect.top + (node.y - nodeHeight / 2);

        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = node.label || '';
        input.style.cssText = `
            position: absolute;
            left: ${inputLeft}px;
            top: ${inputTop}px;
            width: ${nodeWidth}px;
            height: ${nodeHeight}px;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 12px;
            font-family: inherit;
            z-index: 1000;
            background: white;
            text-align: center;
            box-sizing: border-box;
            outline: none;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        `;

        // 添加到页面
        document.body.appendChild(input);
        input.focus();
        input.select();

        // 添加窗口大小变化和滚动监听器
        const updatePosition = () => {
            const newSvgRect = svg.getBoundingClientRect();
            const newInputLeft = newSvgRect.left + (node.x - nodeWidth / 2);
            const newInputTop = newSvgRect.top + (node.y - nodeHeight / 2);
            input.style.left = `${newInputLeft}px`;
            input.style.top = `${newInputTop}px`;
        };

        // 监听窗口大小变化
        window.addEventListener('resize', updatePosition);
        
        // 监听滚动事件
        window.addEventListener('scroll', updatePosition, true);

        // 处理输入完成
        const finishEdit = () => {
            // 移除事件监听器
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            
            const newLabel = input.value.trim();
            if (newLabel && newLabel !== node.label) {
                node.label = newLabel;
                
                // 更新全局变量
                window.currentGraphData = currentGraphData;
                
                drawGraph(currentGraphData);
                updateStatusBar(currentGraphData);
                saveToHistory(currentGraphData);
                showMessage('节点文字已更新', 'success');
            }
            document.body.removeChild(input);
        };

        // 回车键确认
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                finishEdit();
            }
        });

        // 失去焦点时确认
        input.addEventListener('blur', finishEdit);

        // ESC键取消
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // 移除事件监听器
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
                document.body.removeChild(input);
            }
        });
    }

    // 选中节点
    function selectNode(nodeId) {
        console.log(`选中节点: ${nodeId}, 之前选中的节点: ${selectedNodeId}`);
        
        // 先取消所有节点的选中状态
        const allNodes = document.querySelectorAll('g[data-node-id]');
        allNodes.forEach(nodeGroup => {
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                rect.setAttribute('stroke', '#fff');
                rect.setAttribute('stroke-width', '2');
            }
            // 移除之前节点的控制手柄
            removeNodeHandles(nodeGroup);
        });

        // 选中新节点
        selectedNodeId = nodeId;
        const nodeGroup = document.querySelector(`g[data-node-id="${nodeId}"]`);
        if (nodeGroup) {
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                rect.setAttribute('stroke', '#ffd700'); // 金色边框表示选中
                rect.setAttribute('stroke-width', '3');
            }
            
            // 为选中的节点添加控制手柄
            addNodeHandles(nodeGroup);
        }

        // 更新删除和编辑按钮状态
        updateNodeOperationButtons();
        
        console.log(`选中状态更新完成，当前选中节点: ${selectedNodeId}`);
        showMessage(`已选中节点: ${nodeId}`, 'info');
    }

    // 取消选中节点
    function deselectNode() {
        if (selectedNodeId) {
            const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
            if (nodeGroup) {
                const rect = nodeGroup.querySelector('rect');
                if (rect) {
                    rect.setAttribute('stroke', '#fff');
                    rect.setAttribute('stroke-width', '2');
                }
                // 移除控制手柄
                removeNodeHandles(nodeGroup);
            }
            selectedNodeId = null;
            updateNodeOperationButtons();
        }
    }

    // 为节点添加控制手柄
    function addNodeHandles(nodeGroup) {
        const rect = nodeGroup.querySelector('rect');
        if (!rect) return;

        const nodeId = nodeGroup.getAttribute('data-node-id');
        const node = currentGraphData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // 获取节点尺寸 - 优先使用保存的尺寸，否则从实际的rect元素获取
        const nodeData = currentGraphData.nodes.find(n => n.id === nodeId);
        const nodeWidth = nodeData?.width || (() => {
            const actualRect = nodeGroup.querySelector('rect');
            return actualRect ? parseFloat(actualRect.getAttribute('width')) : Math.max(80, (nodeData?.label || '').length * 8);
        })();
        const nodeHeight = nodeData?.height || (() => {
            const actualRect = nodeGroup.querySelector('rect');
            return actualRect ? parseFloat(actualRect.getAttribute('height')) : 40;
        })();

        // 创建8个控制手柄
        const handlePositions = [
            // 四个角落的箭头（用于调整大小）- 移到节点外部
            { x: -nodeWidth/2 - 15, y: -nodeHeight/2 - 15, type: 'resize', direction: 'top-left' },
            { x: nodeWidth/2 + 15, y: -nodeHeight/2 - 15, type: 'resize', direction: 'top-right' },
            { x: nodeWidth/2 + 15, y: nodeHeight/2 + 15, type: 'resize', direction: 'bottom-right' },
            { x: -nodeWidth/2 - 15, y: nodeHeight/2 + 15, type: 'resize', direction: 'bottom-left' },
            // 四个边缘的箭头（用于创建连接线）
            { x: 0, y: -nodeHeight/2 - 10, type: 'connect', direction: 'top' },
            { x: nodeWidth/2 + 10, y: 0, type: 'connect', direction: 'right' },
            { x: 0, y: nodeHeight/2 + 10, type: 'connect', direction: 'bottom' },
            { x: -nodeWidth/2 - 10, y: 0, type: 'connect', direction: 'left' }
        ];

        handlePositions.forEach((pos, index) => {
            const handle = createHandle(pos, index, nodeId);
            nodeGroup.appendChild(handle);
        });
    }

    // 创建控制手柄
    function createHandle(pos, index, nodeId) {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        handle.setAttribute('class', 'node-handle');
        handle.setAttribute('data-handle-type', pos.type);
        handle.setAttribute('data-handle-direction', pos.direction);
        handle.setAttribute('data-node-id', nodeId);
        handle.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

        if (pos.type === 'resize') {
            // 创建调整大小的手柄（小方块）- 移到节点外部
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '12');
            rect.setAttribute('height', '12');
            rect.setAttribute('x', '-6');
            rect.setAttribute('y', '-6');
            rect.setAttribute('fill', '#ffd700');
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('cursor', 'nw-resize');
            handle.appendChild(rect);

            // 添加调整大小的事件监听器
            addResizeHandlers(handle, pos.direction, nodeId);
        } else {
            // 创建连接线手柄（小箭头）
            const arrow = createArrow(pos.direction);
            handle.appendChild(arrow);

            // 添加连接线的事件监听器
            addConnectionHandlers(handle, pos.direction, nodeId);
        }

        return handle;
    }

    // 创建箭头
    function createArrow(direction) {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('fill', '#007bff');
        arrow.setAttribute('stroke', '#333');
        arrow.setAttribute('stroke-width', '2');
        arrow.setAttribute('cursor', 'crosshair');

        // 根据方向设置箭头路径 - 稍微增大箭头
        const arrowPaths = {
            'top': 'M0,-8 L-4,0 L4,0 Z',
            'right': 'M8,0 L0,-4 L0,4 Z',
            'bottom': 'M0,8 L-4,0 L4,0 Z',
            'left': 'M-8,0 L0,-4 L0,4 Z'
        };

        arrow.setAttribute('d', arrowPaths[direction] || arrowPaths['top']);
        return arrow;
    }

    // 移除节点的控制手柄
    function removeNodeHandles(nodeGroup) {
        const handles = nodeGroup.querySelectorAll('.node-handle');
        handles.forEach(handle => handle.remove());
    }

    // 添加调整大小的事件监听器
    function addResizeHandlers(handle, direction, nodeId) {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            // 设置全局调整大小状态
            window.isResizing = true;
            window.resizeStartX = e.clientX;
            window.resizeStartY = e.clientY;
            
            const node = currentGraphData.nodes.find(n => n.id === nodeId);
            if (node) {
                window.originalWidth = Math.max(80, (node.label || '').length * 8);
                window.originalHeight = 40;
            }
            
            // 添加全局调整大小事件监听器
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleResizeEnd);
            
            // 防止文本选择
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'nw-resize';
        });
    }

    // 处理调整大小
    function handleResize(e) {
        if (!window.isResizing) return;
        
        const deltaX = e.clientX - window.resizeStartX;
        const deltaY = e.clientY - window.resizeStartY;
        
        // 根据拖拽方向计算新的尺寸 - 让缩放幅度与拖动范围一致
        // 使用更大的乘数，让拖拽距离直接对应缩放效果
        const scaleX = 1 + (deltaX / window.originalWidth) * 1.0;  // 增加敏感度到1.0，拖拽一个节点宽度对应2倍缩放
        const scaleY = 1 + (deltaY / window.originalHeight) * 1.0; // 增加敏感度到1.0，拖拽一个节点高度对应2倍缩放
        
        // 等比例缩放
        const scale = Math.min(scaleX, scaleY);
        
        // 确保缩放系数在合理范围内，扩大缩放范围
        const clampedScale = Math.max(0.2, Math.min(scale, 8.0)); // 限制缩放范围在0.2到8.0之间
        
        // 添加调试信息
        console.log('缩放调试:', {
            deltaX, deltaY,
            originalWidth: window.originalWidth,
            originalHeight: window.originalHeight,
            scale, clampedScale,
            newWidth: Math.max(80, window.originalWidth * clampedScale),
            newHeight: Math.max(40, window.originalHeight * clampedScale)
        });
        
        // 更新节点尺寸
        const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
        if (nodeGroup) {
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                const newWidth = Math.max(80, window.originalWidth * clampedScale);
                const newHeight = Math.max(40, window.originalHeight * clampedScale);
                
                rect.setAttribute('width', newWidth);
                rect.setAttribute('height', newHeight);
                rect.setAttribute('x', -newWidth / 2);
                rect.setAttribute('y', -newHeight / 2);
                
                // 更新文字大小 - 让文字缩放更加明显
                const text = nodeGroup.querySelector('text');
                let newFontSize = 12; // 默认字体大小
                if (text) {
                    newFontSize = Math.max(8, 12 * clampedScale);
                    text.setAttribute('font-size', newFontSize);
                    
                    // 同时调整文字位置，确保在节点中心
                    text.setAttribute('y', 4); // 保持垂直居中
                }
                
                // 将缩放后的尺寸保存到节点数据中
                const node = currentGraphData.nodes.find(n => n.id === selectedNodeId);
                if (node) {
                    node.width = newWidth;
                    node.height = newHeight;
                    node.fontSize = newFontSize;
                    node.scale = clampedScale;
                    
                    // 添加调试信息
                    console.log('节点缩放数据已保存:', {
                        nodeId: selectedNodeId,
                        width: node.width,
                        height: node.height,
                        fontSize: node.fontSize,
                        scale: node.scale
                    });
                }
            }
        }
    }

    // 处理调整大小结束
    function handleResizeEnd(e) {
        if (!window.isResizing) return;
        
        window.isResizing = false;
        
        // 恢复页面样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // 移除全局事件监听器
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
        
        // 重新绘制图形以更新控制手柄位置
        if (selectedNodeId) {
            const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
            if (nodeGroup) {
                removeNodeHandles(nodeGroup);
                addNodeHandles(nodeGroup);
            }
        }
        
        // 保存到历史记录
        saveToHistory(currentGraphData);
        showMessage('节点大小已调整', 'info');
    }

    // 添加连接线的事件监听器 - 改为拖拽模式
    function addConnectionHandlers(handle, direction, nodeId) {
        let isDragging = false;
        let virtualLine = null;
        let startX, startY;
        
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 进入拖拽连接线创建模式
            enterConnectionDragMode(nodeId, direction, e);
            
            // 创建虚拟连接线
            window.virtualLine = createVirtualConnectionLine(nodeId, direction, e.clientX, e.clientY);
            
            // 添加全局拖拽事件监听器
            document.addEventListener('mousemove', handleConnectionDrag);
            document.addEventListener('mouseup', handleConnectionDragEnd);
            
            // 防止文本选择
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'crosshair';
        });
    }

    // 进入连接线创建模式
    function enterConnectionMode(sourceNodeId, direction) {
        // 设置连接线创建状态
        isLinkCreationMode = true;
        linkSourceNodeId = sourceNodeId;
        linkTargetNodeId = null;
        
        // 更新按钮状态
        addLinkBtn.textContent = '取消连线';
        addLinkBtn.style.backgroundColor = '#dc3545';
        
        // 显示提示信息
        showMessage(`从节点 ${sourceNodeId} 的 ${direction} 方向创建连线，请选择目标节点`, 'info');
        
        // 添加画布点击事件，用于选择目标节点
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            svg.addEventListener('click', handleConnectionTargetSelection);
        }
        
        // 修改按钮点击事件，用于取消连线创建
        addLinkBtn.removeEventListener('click', addNewLink);
        addLinkBtn.addEventListener('click', exitConnectionMode);
    }

    // 处理连接线目标节点选择
    function handleConnectionTargetSelection(e) {
        if (!isLinkCreationMode) return;
        
        // 检查是否点击的是节点
        const nodeGroup = e.target.closest('g[data-node-id]');
        if (!nodeGroup) return;
        
        const targetNodeId = nodeGroup.getAttribute('data-node-id');
        
        if (targetNodeId !== linkSourceNodeId) {
            // 选择目标节点
            linkTargetNodeId = targetNodeId;
            
            // 创建连线
            createLink(linkSourceNodeId, targetNodeId);
            
            // 退出连接线创建模式
            exitConnectionMode();
        } else {
            showMessage('不能连接到同一个节点', 'warning');
        }
    }

    // 退出连接线创建模式
    function exitConnectionMode() {
        isLinkCreationMode = false;
        linkSourceNodeId = null;
        linkTargetNodeId = null;
        
        // 恢复按钮状态和事件
        addLinkBtn.textContent = '添加连线';
        addLinkBtn.style.backgroundColor = '';
        
        // 移除取消事件监听器，恢复原有的事件监听器
        addLinkBtn.removeEventListener('click', exitConnectionMode);
        addLinkBtn.addEventListener('click', addNewLink);
        
        // 移除画布点击事件
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            svg.removeEventListener('click', handleConnectionTargetSelection);
        }
        
        showMessage('已退出连线创建模式', 'info');
    }

    // 新增：节点操作函数
    function addNewNode() {
        console.log('addNewNode 函数被调用');
        
        // 若未初始化，创建空图并展示画布
        ensureGraphInitialized();
        console.log('图形初始化完成，当前数据:', currentGraphData);
        
        const newNodeId = (currentGraphData.nodes.length + 1).toString();
        console.log('新节点ID:', newNodeId);
        
        // 计算新节点位置，避免重叠
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            x = Math.random() * 600 + 100;
            y = Math.random() * 260 + 80;
            attempts++;
            
            // 检查是否与现有节点重叠
            const overlap = currentGraphData.nodes.some(existingNode => {
                const distance = Math.sqrt(
                    Math.pow(x - existingNode.x, 2) + 
                    Math.pow(y - existingNode.y, 2)
                );
                // 考虑矩形节点的尺寸（宽度约80，高度40）
                return distance < 80;
            });
            
            if (!overlap || attempts >= maxAttempts) break;
        } while (attempts < maxAttempts);

        const newNode = {
            id: newNodeId,
            label: `新节点${newNodeId}`,
            x: x,
            y: y,
            type: 'detail'
        };
        
        console.log('新节点对象:', newNode);
        
        currentGraphData.nodes.push(newNode);
        console.log('节点已添加到数据中，当前节点数量:', currentGraphData.nodes.length);
        
        // 更新全局变量
        window.currentGraphData = currentGraphData;
        
        console.log('开始绘制图形...');
        drawGraph(currentGraphData);
        console.log('图形绘制完成');
        
        updateStatusBar(currentGraphData);
        console.log('状态栏已更新');
        
        saveToHistory(currentGraphData);
        console.log('历史记录已保存');
        
        showMessage('新节点已添加', 'success');
        console.log('addNewNode 函数执行完成');
    }

    function deleteSelectedNode() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可删除的节点', 'warning');
            return;
        }
        
        if (!selectedNodeId) {
        showMessage('请先选择要删除的节点', 'info');
            return;
        }

        // 从数据中移除节点
        currentGraphData.nodes = currentGraphData.nodes.filter(node => node.id !== selectedNodeId);
        
        // 从连线中移除包含该节点的连线
        currentGraphData.links = currentGraphData.links.filter(link => 
            link.source !== selectedNodeId && link.target !== selectedNodeId
        );

        // 更新全局变量
        window.currentGraphData = currentGraphData;

        // 重新绘制图形
        drawGraph(currentGraphData);
        updateStatusBar(currentGraphData);
        saveToHistory(currentGraphData);
        deselectNode(); // 取消选中
        showMessage('节点已删除', 'success');
    }

    function editSelectedNode() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可编辑的节点', 'warning');
            return;
        }
        
        if (!selectedNodeId) {
        showMessage('请先选择要编辑的节点', 'info');
            return;
        }

        editNodeText(selectedNodeId);
    }

    // 新增：连线操作函数
    function addNewLink() {
        if (!currentGraphData || currentGraphData.nodes.length < 2) {
            showMessage('需要至少两个节点才能添加连线', 'warning');
            return;
        }
        
        // 进入连线添加模式
        enterLinkCreationMode();
    }

    // 连线创建模式相关变量
    let isLinkCreationMode = false;
    let linkSourceNodeId = null;
    let linkTargetNodeId = null;

    // 进入连线创建模式
    function enterLinkCreationMode() {
        isLinkCreationMode = true;
        linkSourceNodeId = null;
        linkTargetNodeId = null;
        
        // 更新按钮状态
        addLinkBtn.textContent = '取消连线';
        addLinkBtn.style.backgroundColor = '#dc3545';
        
        // 显示提示信息
        showMessage('请选择连线的起始节点，或点击"取消连线"按钮退出', 'info');
        
        // 添加画布点击事件，用于选择节点
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            svg.addEventListener('click', handleLinkNodeSelection);
        }
        
        // 移除原有的事件监听器，添加新的取消事件监听器
        addLinkBtn.removeEventListener('click', addNewLink);
        addLinkBtn.addEventListener('click', exitLinkCreationMode);
    }

    // 退出连线创建模式
    function exitLinkCreationMode() {
        isLinkCreationMode = false;
        linkSourceNodeId = null;
        linkTargetNodeId = null;
        
        // 恢复按钮状态和事件
        addLinkBtn.textContent = '添加连线';
        addLinkBtn.style.backgroundColor = '';
        
        // 移除取消事件监听器，恢复原有的事件监听器
        addLinkBtn.removeEventListener('click', exitLinkCreationMode);
        addLinkBtn.addEventListener('click', addNewLink);
        
        // 移除画布点击事件
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            svg.removeEventListener('click', handleLinkNodeSelection);
        }
        
        // 清除所有节点的临时选中状态
        clearTemporaryNodeSelection();
        
        showMessage('已退出连线创建模式', 'info');
    }

    // 处理连线节点选择
    function handleLinkNodeSelection(e) {
        if (!isLinkCreationMode) return;
        
        // 检查是否点击的是节点
        const nodeGroup = e.target.closest('g[data-node-id]');
        if (!nodeGroup) return;
        
        const nodeId = nodeGroup.getAttribute('data-node-id');
        
        if (!linkSourceNodeId) {
            // 选择起始节点
            linkSourceNodeId = nodeId;
            highlightNodeForLink(nodeId, 'source');
            showMessage(`已选择起始节点: ${nodeId}，请选择结束节点`, 'info');
        } else if (!linkTargetNodeId && nodeId !== linkSourceNodeId) {
            // 选择结束节点
            linkTargetNodeId = nodeId;
            highlightNodeForLink(nodeId, 'target');
            
            // 创建连线
            createLink(linkSourceNodeId, linkTargetNodeId);
            
            // 退出连线创建模式
            exitLinkCreationMode();
        } else if (nodeId === linkSourceNodeId) {
            // 重新选择起始节点
            linkSourceNodeId = null;
            clearTemporaryNodeSelection();
            showMessage('请重新选择连线的起始节点', 'info');
        }
    }

    // 高亮节点用于连线选择
    function highlightNodeForLink(nodeId, type) {
        const nodeGroup = document.querySelector(`g[data-node-id="${nodeId}"]`);
        if (nodeGroup) {
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                if (type === 'source') {
                    rect.setAttribute('stroke', '#28a745'); // 绿色表示起始节点
                    rect.setAttribute('stroke-width', '4');
                } else if (type === 'target') {
                    rect.setAttribute('stroke', '#007bff'); // 蓝色表示结束节点
                    rect.setAttribute('stroke-width', '4');
                }
            }
        }
    }

    // 清除临时节点选中状态
    function clearTemporaryNodeSelection() {
        const allNodes = document.querySelectorAll('g[data-node-id]');
        allNodes.forEach(nodeGroup => {
            const rect = nodeGroup.querySelector('rect');
            if (rect) {
                // 恢复原始样式
                if (selectedNodeId === nodeGroup.getAttribute('data-node-id')) {
                    rect.setAttribute('stroke', '#ffd700'); // 保持选中状态
                    rect.setAttribute('stroke-width', '3');
                } else {
                    rect.setAttribute('stroke', '#fff');
                    rect.setAttribute('stroke-width', '2');
                }
            }
        });
    }

    // 创建连线
    function createLink(sourceId, targetId) {
        // 检查是否已存在相同的连线
        const existingLink = currentGraphData.links.find(link => 
            (link.source === sourceId && link.target === targetId) ||
            (link.source === targetId && link.target === sourceId)
        );
        
        if (existingLink) {
            showMessage('这两个节点之间已经存在连线', 'warning');
            return;
        }
        
        // 创建新连线
        const newLink = {
            id: `link-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            label: '', // 可以后续添加连线标签
            // 确保使用直线连接，不使用贝塞尔曲线
            isCurved: false
        };
        
        // 添加到数据中
        currentGraphData.links.push(newLink);
        
        // 更新全局变量
        window.currentGraphData = currentGraphData;
        
        // 重新绘制图形
        drawGraph(currentGraphData);
        
        // 更新状态栏
        updateStatusBar(currentGraphData);
        
        // 保存到历史记录
        saveToHistory(currentGraphData);
        
        showMessage(`连线已创建: ${sourceId} → ${targetId}`, 'success');
    }

    function deleteSelectedLink() {
        if (!currentGraphData || currentGraphData.links.length === 0) {
            showMessage('没有可删除的连线', 'warning');
            return;
        }
        
        // 这里将来会实现连线删除逻辑
        showMessage('请先选择要删除的连线', 'info');
    }

    function editSelectedLink() {
        if (!currentGraphData || currentGraphData.links.length === 0) {
            showMessage('没有可编辑的连线', 'warning');
            return;
        }
        
        // 这里将来会实现连线编辑逻辑
        showMessage('请先选择要编辑的连线', 'info');
    }

    // 新增：布局控制函数
    async function applyAutoLayout() {
        if (!currentGraphData) return;
        
        showMessage('正在应用智能布局...', 'info');
        
        try {
            // 应用智能布局算法
            const optimizedGraph = applyIntelligentLayout(currentGraphData);
            
            if (optimizedGraph) {
                // 更新当前图形数据
                currentGraphData = optimizedGraph;
                window.currentGraphData = currentGraphData;
                
                // 重新绘制图形
                drawGraph(currentGraphData);
                
                // 更新状态栏
                updateStatusBar(currentGraphData);
                
                showMessage('智能布局应用成功！', 'success');
            } else {
                showMessage('布局优化失败', 'warning');
            }
        } catch (error) {
            showMessage('布局优化失败: ' + error.message, 'error');
            console.error('布局优化失败:', error);
        }
    }

    function changeLayout() {
        const selectedLayout = layoutSelect.value;
        showMessage(`正在应用${layoutSelect.options[layoutSelect.selectedIndex].text}...`, 'info');
        
        if (!currentGraphData) {
            showMessage('没有可用的图形数据', 'warning');
            return;
        }
        
        try {
            // 根据选择的布局类型应用不同的算法
            let optimizedGraph;
            
            switch (selectedLayout) {
                case 'force':
                    // 力导向布局
                    optimizedGraph = applyForceDirectedLayoutOnly(currentGraphData);
                    break;
                case 'hierarchical':
                    // Sugiyama布局
                    optimizedGraph = applyHierarchicalLayout(currentGraphData);
                    break;
                default:
                    // 默认智能布局
                    optimizedGraph = applyIntelligentLayout(currentGraphData);
            }
            
            if (optimizedGraph) {
                // 更新当前图形数据
                currentGraphData = optimizedGraph;
                window.currentGraphData = currentGraphData;
                
                // 重新绘制图形
                drawGraph(currentGraphData);
                
                // 更新状态栏
                updateStatusBar(currentGraphData);
                
                showMessage(`${layoutSelect.options[layoutSelect.selectedIndex].text}应用成功！`, 'success');
            }
        } catch (error) {
            showMessage('布局切换失败: ' + error.message, 'error');
            console.error('布局切换失败:', error);
        }
    }

    // 新增：样式设置函数
    function changeNodeColor() {
        const color = nodeColorPicker.value;
        showMessage(`节点颜色已更改为: ${color}`, 'info');
        
        // 这里将来会更新D3.js节点颜色
    }

    function changeLinkColor() {
        const color = linkColorPicker.value;
        showMessage(`连线颜色已更改为: ${color}`, 'info');
        
        // 这里将来会更新D3.js连线颜色
    }

    function changeNodeShape() {
        const shape = nodeShapeSelect.value;
        showMessage(`节点形状已更改为: ${nodeShapeSelect.options[nodeShapeSelect.selectedIndex].text}`, 'info');
        
        // 这里将来会更新D3.js节点形状
    }

    // 新增：数据管理函数
    function saveConceptMap() {
        if (!currentGraphData) {
            showMessage('没有可保存的概念图', 'warning');
            return;
        }
        
        try {
            const dataStr = JSON.stringify(currentGraphData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `概念图_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('概念图已保存', 'success');
        } catch (error) {
            showMessage('保存失败', 'error');
            console.error('保存失败:', error);
        }
    }

    function loadConceptMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.nodes && data.links) {
                        currentGraphData = data;
                        window.currentGraphData = currentGraphData;
                        displayConceptMap(data);
                        showMessage('概念图加载成功', 'success');
                    } else {
                        showMessage('文件格式不正确', 'error');
                    }
                } catch (error) {
                    showMessage('文件解析失败', 'error');
                    console.error('解析失败:', error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // 新增：历史记录管理
    function saveToHistory(data) {
        console.log('saveToHistory 被调用，数据:', data);
        
        // 移除当前位置之后的历史记录
        operationHistory = operationHistory.slice(0, currentHistoryIndex + 1);
        console.log('历史记录已截断，当前索引:', currentHistoryIndex);
        
        // 添加新的状态
        operationHistory.push(JSON.parse(JSON.stringify(data)));
        console.log('新状态已添加到历史记录');
        
        // 限制历史记录大小
        if (operationHistory.length > maxHistorySize) {
            operationHistory.shift();
            console.log('历史记录已限制大小，移除最旧记录');
        } else {
            currentHistoryIndex++;
            console.log('历史记录索引已更新:', currentHistoryIndex);
        }
        
        updateHistoryButtons();
        console.log('历史记录按钮状态已更新');
    }

    function undoOperation() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const previousData = operationHistory[currentHistoryIndex];
            currentGraphData = JSON.parse(JSON.stringify(previousData));
            window.currentGraphData = currentGraphData;
            updateStatusBar(currentGraphData);
            updateHistoryButtons();
            showMessage('已撤销操作', 'info');
            
            // 重新绘制图形
            drawGraph(currentGraphData);
        }
    }

    function redoOperation() {
        if (currentHistoryIndex < operationHistory.length - 1) {
            currentHistoryIndex++;
            const nextData = operationHistory[currentHistoryIndex];
            currentGraphData = JSON.parse(JSON.stringify(nextData));
            window.currentGraphData = currentGraphData;
            updateStatusBar(nextData);
            updateHistoryButtons();
            showMessage('已重做操作', 'info');
            
            // 重新绘制图形
            drawGraph(currentGraphData);
        }
    }

    function clearHistory() {
        operationHistory = [];
        currentHistoryIndex = -1;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        console.log('updateHistoryButtons 被调用');
        
        if (undoBtn) {
            undoBtn.disabled = currentHistoryIndex <= 0;
            console.log('撤销按钮状态:', undoBtn.disabled);
        } else {
            console.error('undoBtn 元素未找到');
        }
        
        if (redoBtn) {
            redoBtn.disabled = currentHistoryIndex >= operationHistory.length - 1;
            console.log('重做按钮状态:', redoBtn.disabled);
        } else {
            console.error('redoBtn 元素未找到');
        }
    }

    // 新增：状态栏更新
    function updateStatusBar(data) {
        console.log('updateStatusBar 被调用，数据:', data);
        
        if (nodeCountSpan) {
            nodeCountSpan.textContent = `节点: ${data.nodes.length}`;
            console.log('节点数量已更新:', data.nodes.length);
        } else {
            console.error('nodeCountSpan 元素未找到');
        }
        
        if (linkCountSpan) {
            linkCountSpan.textContent = `连线: ${data.links.length}`;
            console.log('连线数量已更新:', data.links.length);
        } else {
            console.error('linkCountSpan 元素未找到');
        }
    }

    // 显示加载状态
    function showLoadingState() {
        // 找到当前正在生成的按钮
        const loadingBtns = document.querySelectorAll('.btn-primary');
        loadingBtns.forEach(btn => {
            if (btn.textContent.includes('生成中')) {
                btn.classList.add('loading');
                btn.textContent = '生成中...';
                btn.disabled = true;
            }
        });
    }

    // 隐藏加载状态
    function hideLoadingState() {
        // 恢复关键词生成按钮
        if (keywordBtn) {
            keywordBtn.classList.remove('loading');
            keywordBtn.textContent = '生成概念图';
            keywordBtn.disabled = false;
        }
        
        // 恢复文本分析按钮
        if (descriptionBtn) {
            descriptionBtn.classList.remove('loading');
            descriptionBtn.textContent = '分析生成';
            descriptionBtn.disabled = false;
        }
        
        // 清理下方文本区域的加载状态
        const aiIntroText = document.getElementById('aiIntroText');
        if (aiIntroText) {
            // 如果有loading-box，保留文本内容但移除加载动画
            if (aiIntroText.querySelector('.loading-box')) {
                const loadingText = aiIntroText.querySelector('.loading-text');
                const contentText = loadingText ? loadingText.textContent.trim() : '';
                if (contentText && contentText !== '') {
                    // 直接显示文本内容，不添加额外的样式或标记
                    aiIntroText.innerHTML = contentText;
                }
            }
            // 无论如何都要移除loading类，恢复正常的intro-text样式
            aiIntroText.className = 'intro-text';
        }
    }

    // 显示焦点问题 - 优化居中显示和边界间距，确保与节点位置协调
    function displayFocusQuestion() {
        const svg = document.querySelector('.concept-graph');
        if (!svg || !window.focusQuestion) return;
        
        // 移除已存在的焦点问题
        const existingFocusQuestion = svg.querySelector('#focus-question');
        if (existingFocusQuestion) {
            existingFocusQuestion.remove();
        }
        
        // 获取SVG的实际尺寸和viewBox
        const svgRect = svg.getBoundingClientRect();
        const svgWidth = svgRect.width || 800;
        const svgHeight = svgRect.height || 600;
        
        // 获取当前viewBox信息
        const viewBox = svg.getAttribute('viewBox');
        let viewBoxWidth = svgWidth;
        let viewBoxHeight = svgHeight;
        
        if (viewBox) {
            const viewBoxParts = viewBox.split(' ');
            if (viewBoxParts.length === 4) {
                viewBoxWidth = parseFloat(viewBoxParts[2]);
                viewBoxHeight = parseFloat(viewBoxParts[3]);
            }
        }
        
        // 统一的边界间距 - 与assignCoordinates函数中保持一致
        const margin = 150; // 左右边界间距，确保不贴边
        const topMargin = 30; // 顶部间距，保持在顶部位置
        
        // 计算焦点问题框的尺寸和位置
        const focusBoxWidth = Math.max(400, viewBoxWidth - 2 * margin); // 确保最小宽度
        const focusBoxHeight = 60; // 增加高度
        const focusBoxX = (viewBoxWidth - focusBoxWidth) / 2; // 水平居中
        const focusBoxY = topMargin;
        
        // 创建焦点问题组
        const focusGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        focusGroup.setAttribute('id', 'focus-question');
        
        // 创建背景矩形
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', focusBoxX);
        bgRect.setAttribute('y', focusBoxY);
        bgRect.setAttribute('width', focusBoxWidth);
        bgRect.setAttribute('height', focusBoxHeight);
        bgRect.setAttribute('rx', '10');
        bgRect.setAttribute('fill', '#f8f9fa');
        bgRect.setAttribute('stroke', '#667eea');
        bgRect.setAttribute('stroke-width', '2');
        bgRect.setAttribute('fill-opacity', '0.9');
        
        // 创建焦点问题文字
        const focusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        focusText.setAttribute('x', viewBoxWidth / 2); // 水平居中
        focusText.setAttribute('y', focusBoxY + focusBoxHeight / 2); // 垂直居中
        focusText.setAttribute('text-anchor', 'middle');
        focusText.setAttribute('dominant-baseline', 'middle');
        focusText.setAttribute('font-size', '16');
        focusText.setAttribute('font-weight', '600');
        focusText.setAttribute('fill', '#2c3e50');
        focusText.textContent = window.focusQuestion;
        
        // 将元素添加到组中
        focusGroup.appendChild(bgRect);
        focusGroup.appendChild(focusText);
        
        // 将焦点问题组添加到SVG的最前面
        svg.insertBefore(focusGroup, svg.firstChild);
        
        console.log('焦点问题已显示:', window.focusQuestion, '位置:', { 
            x: focusBoxX, y: focusBoxY, width: focusBoxWidth, 
            viewBoxWidth, viewBoxHeight, svgWidth, svgHeight 
        });
    }

    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // 添加样式
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        // 根据类型设置背景色
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // 初始化页面状态
    function initializePage() {
        console.log('开始初始化页面...');
        
        // 禁用导出按钮（初始状态）
        if (exportBtn) {
            exportBtn.disabled = true;
            console.log('导出按钮已禁用');
        } else {
            console.error('exportBtn 元素未找到');
        }
        
        // 确保编辑工具栏可见
        const editToolbar = document.querySelector('.edit-toolbar');
        if (editToolbar) {
            editToolbar.style.display = 'grid';
            console.log('编辑工具栏已设置为可见');
        } else {
            console.error('editToolbar 元素未找到');
        }
        
        // 添加一些示例数据提示
        if (keywordInput) {
            keywordInput.placeholder = '例如：人工智能、机器学习、区块链...';
            console.log('关键词输入框占位符已设置');
        } else {
            console.error('keywordInput 元素未找到');
        }
        
        if (descriptionTextarea) {
            descriptionTextarea.placeholder = '例如：人工智能是计算机科学的一个分支，致力于开发能够执行通常需要人类智能的任务的系统...';
            console.log('描述文本框占位符已设置');
        } else {
            console.error('descriptionTextarea 元素未找到');
        }
        
        // 初始化状态栏
        updateStatusBar({ nodes: [], links: [] });
        console.log('状态栏已初始化');
        
        // 初始化历史记录按钮
        updateHistoryButtons();
        console.log('历史记录按钮已初始化');
        
        // 初始化节点操作按钮状态
        updateNodeOperationButtons();
        console.log('节点操作按钮状态已初始化');
        
        showMessage('欢迎使用概念图自动生成系统！您可以直接使用右侧工具栏创建概念图，或使用AI生成', 'info');
        console.log('页面初始化完成');
    }

    // 页面初始化
    initializePage();

    // 更新节点操作按钮状态
    function updateNodeOperationButtons() {
        console.log('updateNodeOperationButtons 被调用，selectedNodeId:', selectedNodeId);
        
        if (deleteNodeBtn) {
            deleteNodeBtn.disabled = !selectedNodeId;
            console.log('删除节点按钮状态:', deleteNodeBtn.disabled);
        } else {
            console.error('deleteNodeBtn 元素未找到');
        }
        
        if (editNodeBtn) {
            editNodeBtn.disabled = !selectedNodeId;
            console.log('编辑节点按钮状态:', editNodeBtn.disabled);
        } else {
            console.error('editNodeBtn 元素未找到');
        }
    }

    // 重置视图
    function resetView() {
        // 显示确认弹窗
        if (!confirm('你确定要重置视图吗？未保存的内容将全部被清除')) {
            return; // 用户取消，不执行重置
        }
        
        // 清除所有生成的内容
        currentGraphData = null;
        window.currentGraphData = null;
        
        // 显示占位符
        graphPlaceholder.style.display = 'flex';
        
        // 隐藏概念图展示区域
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        if (conceptMapDisplay) {
            conceptMapDisplay.style.display = 'none';
        }
        
        // 保持编辑工具栏可见，让用户可以继续创建概念图
        if (editToolbar) {
            editToolbar.style.display = 'grid';
        }
        
        // 取消节点选中状态
        deselectNode();
        
        // 清空输入框
        if (keywordInput) {
            keywordInput.value = '';
        }
        if (descriptionTextarea) {
            descriptionTextarea.value = '';
        }
        
        // 清空AI介绍文字
        const aiIntroText = document.getElementById('aiIntroText');
        if (aiIntroText) {
            aiIntroText.innerHTML = '';
            aiIntroText.className = 'intro-text';
        }
        
        // 清空SVG画布内容
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }
            
            // 默认显示文字
            const defaultText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            defaultText.setAttribute('x', '400');
            defaultText.setAttribute('y', '300');
            defaultText.setAttribute('text-anchor', 'middle');
            defaultText.setAttribute('dominant-baseline', 'middle');
            defaultText.setAttribute('font-size', '16');
            defaultText.setAttribute('fill', '#666');
            defaultText.textContent = '概念图将在这里显示';
            svg.appendChild(defaultText);
        }
        
        // 清除焦点问题
        window.focusQuestion = null;
        
        // 禁用导出按钮
        if (exportBtn) {
            exportBtn.disabled = true;
        }
        
        // 重置状态栏
        updateStatusBar({ nodes: [], links: [] });
        
        // 清空历史记录
        clearHistory();
        
        // 重置所有相关状态
        selectedNodeId = null;
        isDragging = false;
        isLinkCreationMode = false;
        linkSourceNodeId = null;
        linkTargetNodeId = null;
        isGenerating = false;
        
        // 重置全局调整大小状态
        if (window.isResizing !== undefined) {
            window.isResizing = false;
        }
        if (window.resizeStartX !== undefined) {
            window.resizeStartX = 0;
        }
        if (window.resizeStartY !== undefined) {
            window.resizeStartY = 0;
        }
        if (window.originalWidth !== undefined) {
            window.originalWidth = 0;
        }
        if (window.originalHeight !== undefined) {
            window.originalHeight = 0;
        }
        
        // 重置虚拟连接线状态
        if (window.virtualLine) {
            window.virtualLine = null;
        }
        
        // 移除可能存在的虚拟连接线
        const virtualLines = document.querySelectorAll('.virtual-connection-line');
        virtualLines.forEach(line => line.remove());
        
        // 移除可能存在的输入框
        const floatingInputs = document.querySelectorAll('input[style*="position: fixed"], input[style*="position: absolute"]');
        floatingInputs.forEach(input => {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        });
        
        // 移除可能存在的控制手柄
        const nodeHandles = document.querySelectorAll('.node-handle');
        nodeHandles.forEach(handle => handle.remove());
        
        showMessage('视图已重置，所有内容已清除，您可以重新开始创建概念图', 'success');
    }

    // 导出概念图
    function exportConceptMap() {
        if (!currentGraphData) {
            showMessage('没有可导出的概念图', 'warning');
            return;
        }
        
        // 这里将来会实现实际的导出功能
        showMessage('导出功能开发中...', 'info');
        
        // 模拟导出过程
        setTimeout(() => {
            showMessage('概念图导出成功！', 'success');
        }, 1000);
    }
    
    // 新增：拖拽连接线创建功能
    
    // 进入拖拽连接线创建模式
    function enterConnectionDragMode(sourceNodeId, direction, e) {
        // 设置连接线创建状态
        isLinkCreationMode = true;
        linkSourceNodeId = sourceNodeId;
        linkTargetNodeId = null;
        
        // 更新按钮状态
        addLinkBtn.textContent = '取消连线';
        addLinkBtn.style.backgroundColor = '#dc3545';
        
        // 显示提示信息
        showMessage(`从节点 ${sourceNodeId} 的 ${direction} 方向拖拽创建连线，松开鼠标到目标节点上完成连接`, 'info');
        
        // 修改按钮点击事件，用于取消连线创建
        addLinkBtn.removeEventListener('click', addNewLink);
        addLinkBtn.addEventListener('click', exitConnectionMode);
    }
    
    // 创建虚拟连接线
    function createVirtualConnectionLine(sourceNodeId, direction, startX, startY) {
        const svg = document.querySelector('.concept-graph');
        if (!svg) return null;
        
        // 创建虚拟连接线组
        const virtualLineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        virtualLineGroup.setAttribute('class', 'virtual-connection-line');
        
        // 创建虚拟连接线路径
        const virtualLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        virtualLine.setAttribute('stroke', '#ff6b6b');
        virtualLine.setAttribute('stroke-width', '2');
        virtualLine.setAttribute('stroke-dasharray', '5,5');
        virtualLine.setAttribute('opacity', '0.7');
        virtualLine.setAttribute('fill', 'none');
        
        // 设置起点（从源节点的边缘开始）
        const sourceNode = currentGraphData.nodes.find(n => n.id === sourceNodeId);
        if (sourceNode) {
            const nodeWidth = sourceNode.width || Math.max(80, (sourceNode.label || '').length * 8);
            const nodeHeight = sourceNode.height || 40;
            
            let startX, startY;
            switch (direction) {
                case 'top':
                    startX = sourceNode.x;
                    startY = sourceNode.y - nodeHeight / 2;
                    break;
                case 'right':
                    startX = sourceNode.x + nodeWidth / 2;
                    startY = sourceNode.y;
                    break;
                case 'bottom':
                    startX = sourceNode.x;
                    startY = sourceNode.y + nodeHeight / 2;
                    break;
                case 'left':
                    startX = sourceNode.x - nodeWidth / 2;
                    startY = sourceNode.y;
                    break;
            }
            
            // 创建初始路径（从起点到起点，形成点）
            const initialPath = `M ${startX} ${startY} L ${startX} ${startY}`;
            virtualLine.setAttribute('d', initialPath);
            
            // 存储起点信息，供拖拽时使用
            virtualLine.setAttribute('data-start-x', startX);
            virtualLine.setAttribute('data-start-y', startY);
        }
        
        // 将虚拟连接线添加到组中
        virtualLineGroup.appendChild(virtualLine);
        svg.appendChild(virtualLineGroup);
        return virtualLineGroup;
    }
    
    // 处理连接线拖拽
    function handleConnectionDrag(e) {
        if (!isLinkCreationMode || !window.virtualLine) return;
        
        const virtualLineGroup = window.virtualLine;
        if (virtualLineGroup) {
            const virtualLine = virtualLineGroup.querySelector('path');
            if (virtualLine) {
                // 将鼠标坐标转换为SVG坐标
                const svg = document.querySelector('.concept-graph');
                if (svg) {
                    const pt = svg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
                    
                    // 获取起点坐标
                    const startX = parseFloat(virtualLine.getAttribute('data-start-x'));
                    const startY = parseFloat(virtualLine.getAttribute('data-start-y'));
                    
                    // 更新虚拟连接线路径
                    const path = `M ${startX} ${startY} L ${svgPt.x} ${svgPt.y}`;
                    virtualLine.setAttribute('d', path);
                }
            }
        }
    }
    
    // 处理连接线拖拽结束
    function handleConnectionDragEnd(e) {
        if (!isLinkCreationMode) return;
        
        // 恢复页面样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // 移除全局事件监听器
        document.removeEventListener('mousemove', handleConnectionDrag);
        document.removeEventListener('mouseup', handleConnectionDragEnd);
        
        // 检查鼠标是否在目标节点上
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const targetNodeGroup = targetElement?.closest('g[data-node-id]');
        
        if (targetNodeGroup) {
            const targetNodeId = targetNodeGroup.getAttribute('data-node-id');
            
            if (targetNodeId !== linkSourceNodeId) {
                // 创建连线
                createLink(linkSourceNodeId, targetNodeId);
                showMessage(`已创建从节点 ${linkSourceNodeId} 到节点 ${targetNodeId} 的连接线`, 'success');
            } else {
                showMessage('不能连接到同一个节点', 'warning');
            }
        } else {
            showMessage('请拖拽到目标节点上完成连接', 'warning');
        }
        
        // 移除虚拟连接线
        if (window.virtualLine) {
            window.virtualLine.remove();
            window.virtualLine = null;
        }
        
        // 退出连接线创建模式
        exitConnectionMode();
    }

    // 力导向布局专用函数
    function applyForceDirectedLayoutOnly(graphData) {
        console.log('应用力导向布局...');
        
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            return graphData;
        }

        const nodes = [...graphData.nodes];
        const links = [...graphData.links];
        
        // 动态计算画布尺寸，根据节点数量和内容长度
        const maxNodeWidth = Math.max(...nodes.map(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            return node.width || nodeDimensions.width;
        }));
        const maxNodesInLevel = Math.max(...Array.from(assignLayers(nodes, links).values()).map(level => level.length));
        
        // 计算合适的画布尺寸
        const width = Math.max(600, Math.min(1200, maxNodesInLevel * (maxNodeWidth + 80) + 200)); // 600-1200px
        const height = Math.max(400, Math.min(800, nodes.length * 60 + 200)); // 400-800px
        
        // 力导向布局参数 - 根据画布尺寸动态调整
        const nodeSpacing = Math.max(60, Math.min(100, width / (maxNodesInLevel + 2))); // 60-100px
        const linkLength = Math.max(80, Math.min(120, height / (nodes.length + 2))); // 80-120px
        
        // 初始化位置
        initializeNodePositions(nodes, width, height);
        
        // 应用力导向算法
        applyForceDirectedLayout(nodes, links, width, height, nodeSpacing, linkLength);
        
        // 最终调整
        finalizePositions(nodes, width, height);
        
        // 调整viewBox
        adjustViewBox(nodes, width, height);
        
        return { ...graphData, nodes, links };
    }

    // Sugiyama层次布局算法
    function applyHierarchicalLayout(graphData) {
        console.log('应用Sugiyama层次布局算法...');
        
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            return graphData;
        }

        const nodes = [...graphData.nodes];
        const links = [...graphData.links];
        
        // 动态计算画布尺寸，根据节点数量和内容长度
        const maxNodeWidth = Math.max(...nodes.map(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            return node.width || nodeDimensions.width;
        }));
        const maxNodesInLevel = Math.max(...Array.from(assignLayers(nodes, links).values()).map(level => level.length));
        
        // 计算合适的画布尺寸
        const width = Math.max(600, Math.min(1200, maxNodesInLevel * (maxNodeWidth + 80) + 200)); // 600-1200px
        const height = Math.max(400, Math.min(800, nodes.length * 60 + 200)); // 400-800px
        
        // 步骤1: 层次分配
        const levels = assignLayers(nodes, links);
        
        // 步骤2: 节点排序（减少交叉）
        const orderedLevels = orderNodesInLayers(nodes, links, levels);
        
        // 步骤3: 坐标分配
        assignCoordinates(nodes, orderedLevels, width, height);
        
        // 步骤4: 连线优化
        optimizeLinkRouting(nodes, links);
        
        // 步骤5: 调整viewBox
        adjustViewBox(nodes, width, height);
        
        return { ...graphData, nodes, links };
    }

    // Sugiyama算法步骤1: 层次分配 - 优化确保第一级关键词节点在最上方
    function assignLayers(nodes, links) {
        console.log('步骤1: 层次分配...');
        
        const levels = new Map();
        const visited = new Set();
        const inDegree = new Map();
        const nodeMap = new Map();
        
        // 创建节点映射
        nodes.forEach(node => {
            nodeMap.set(node.id, node);
            inDegree.set(node.id, 0);
        });
        
        // 计算入度
        links.forEach(link => {
            const target = link.target;
            inDegree.set(target, (inDegree.get(target) || 0) + 1);
        });
        
        // 获取当前关键词（第一级节点）
        let currentKeyword = '';
        if (window.focusQuestion) {
            const match = window.focusQuestion.match(/焦点问题：(.*?)(是什么|\?|\.\.\.)/);
            if (match) {
                currentKeyword = match[1].trim();
            }
        }
        
        // 如果没有关键词，尝试从元数据中获取
        if (!currentKeyword && window.currentGraphData && window.currentGraphData.metadata) {
            currentKeyword = window.currentGraphData.metadata.keyword || '';
        }
        
        // 找到第一级关键词节点
        let firstLevelNodes = [];
        if (currentKeyword) {
            // 查找与关键词匹配的节点
            const keywordNodes = nodes.filter(node => {
                const nodeLabel = node.label || '';
                return nodeLabel === currentKeyword || 
                       nodeLabel.includes(currentKeyword) || 
                       currentKeyword.includes(nodeLabel);
            });
            
            if (keywordNodes.length > 0) {
                firstLevelNodes = keywordNodes;
            }
        }
        
        // 如果没有找到关键词节点，使用入度为0的节点作为第一级
        if (firstLevelNodes.length === 0) {
            firstLevelNodes = nodes.filter(node => inDegree.get(node.id) === 0);
        }
        
        // 如果仍然没有找到，选择入度最小的节点作为第一级
        if (firstLevelNodes.length === 0) {
            const minInDegree = Math.min(...inDegree.values());
            firstLevelNodes = nodes.filter(node => inDegree.get(node.id) === minInDegree);
        }
        
        // 确保第一级节点在数组的第一位
        if (firstLevelNodes.length > 0) {
            // 将第一级节点放在数组开头
            const firstNode = firstLevelNodes[0];
            const nodeIndex = nodes.findIndex(n => n.id === firstNode.id);
            if (nodeIndex > 0) {
                nodes.splice(nodeIndex, 1);
                nodes.unshift(firstNode);
            }
        }
        
        // 使用BFS进行层次分配，从第一级节点开始
        let currentLevel = 0;
        let currentNodes = [...firstLevelNodes];
        
        while (currentNodes.length > 0) {
            levels.set(currentLevel, currentNodes);
            currentNodes.forEach(node => visited.add(node.id));
            
            const nextLevel = [];
            currentNodes.forEach(node => {
                // 找到子节点
                links.forEach(link => {
                    if (link.source === node.id && !visited.has(link.target)) {
                        const targetNode = nodeMap.get(link.target);
                        if (targetNode && !nextLevel.includes(targetNode)) {
                            nextLevel.push(targetNode);
                        }
                    }
                });
            });
            
            currentNodes = nextLevel;
            currentLevel++;
        }
        
        // 处理孤立的节点，将它们放在最后一级
        const isolatedNodes = nodes.filter(node => !visited.has(node.id));
        if (isolatedNodes.length > 0) {
            levels.set(currentLevel, isolatedNodes);
        }
        
        console.log(`层次分配完成，共${levels.size}层，第一级节点:`, firstLevelNodes.map(n => n.label));
        return levels;
    }

    // Sugiyama算法步骤2: 节点排序（减少交叉）
    function orderNodesInLayers(nodes, links, levels) {
        console.log('步骤2: 节点排序（减少交叉）...');
        
        const orderedLevels = new Map();
        const nodeMap = new Map();
        nodes.forEach(node => nodeMap.set(node.id, node));
        
        // 为每一层排序节点
        levels.forEach((levelNodes, level) => {
            if (level === 0) {
                // 第一层保持原顺序
                orderedLevels.set(level, [...levelNodes]);
            } else {
                // 使用重心排序算法减少交叉
                const sortedNodes = sortNodesByBarycenter(levelNodes, links, nodeMap, level);
                orderedLevels.set(level, sortedNodes);
            }
        });
        
        console.log('节点排序完成');
        return orderedLevels;
    }
    
    // 重心排序算法
    function sortNodesByBarycenter(levelNodes, links, nodeMap, level) {
        // 计算每个节点的重心（基于父节点的位置）
        const barycenters = new Map();
        
        levelNodes.forEach(node => {
            let totalX = 0;
            let count = 0;
            
            // 找到所有指向该节点的连线
            links.forEach(link => {
                if (link.target === node.id) {
                    const sourceNode = nodeMap.get(link.source);
                    if (sourceNode) {
                        totalX += sourceNode.x || 0;
                        count++;
                    }
                }
            });
            
            // 计算重心
            if (count > 0) {
                barycenters.set(node.id, totalX / count);
            } else {
                // 如果没有父节点，使用节点ID的哈希值
                barycenters.set(node.id, node.id.charCodeAt(0));
            }
        });
        
        // 按重心排序
        const sortedNodes = [...levelNodes].sort((a, b) => {
            const baryA = barycenters.get(a.id) || 0;
            const baryB = barycenters.get(b.id) || 0;
            return baryA - baryB;
        });
        
        // 应用迭代优化，减少交叉
        return optimizeNodeOrder(sortedNodes, links, nodeMap, level);
    }
    
    // 优化节点顺序，减少连线交叉
    function optimizeNodeOrder(levelNodes, links, nodeMap, level) {
        if (levelNodes.length <= 2) return levelNodes;
        
        let improved = true;
        let iterations = 0;
        const maxIterations = 10;
        
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            for (let i = 0; i < levelNodes.length - 1; i++) {
                const current = levelNodes[i];
                const next = levelNodes[i + 1];
                
                // 计算当前顺序的交叉数
                const currentCrossings = countCrossings(levelNodes, links, nodeMap, level);
                
                // 尝试交换相邻节点
                [levelNodes[i], levelNodes[i + 1]] = [levelNodes[i + 1], levelNodes[i]];
                
                // 计算交换后的交叉数
                const newCrossings = countCrossings(levelNodes, links, nodeMap, level);
                
                if (newCrossings >= currentCrossings) {
                    // 如果交叉数没有减少，恢复原顺序
                    [levelNodes[i], levelNodes[i + 1]] = [levelNodes[i + 1], levelNodes[i]];
                } else {
                    improved = true;
                }
            }
        }
        
        return levelNodes;
    }
    
    // 计算连线交叉数
    function countCrossings(levelNodes, links, nodeMap, level) {
        let crossings = 0;
        
        for (let i = 0; i < levelNodes.length; i++) {
            for (let j = i + 1; j < levelNodes.length; j++) {
                const nodeA = levelNodes[i];
                const nodeB = levelNodes[j];
                
                // 计算从这两个节点出发的连线交叉
                links.forEach(linkA => {
                    if (linkA.source === nodeA.id) {
                        links.forEach(linkB => {
                            if (linkB.source === nodeB.id) {
                                // 检查连线是否交叉
                                if (doLinesCross(linkA, linkB, nodeMap)) {
                                    crossings++;
                                }
                            }
                        });
                    }
                });
            }
        }
        
        return crossings;
    }
    
    // 检查两条连线是否交叉
    function doLinesCross(linkA, linkB, nodeMap) {
        const sourceA = nodeMap.get(linkA.source);
        const targetA = nodeMap.get(linkA.target);
        const sourceB = nodeMap.get(linkB.source);
        const targetB = nodeMap.get(linkB.target);
        
        if (!sourceA || !targetA || !sourceB || !targetB) return false;
        
        // 简化的交叉检测：检查连线是否在水平方向上有重叠
        const minX1 = Math.min(sourceA.x, targetA.x);
        const maxX1 = Math.max(sourceA.x, targetA.x);
        const minX2 = Math.min(sourceB.x, targetB.x);
        const maxX2 = Math.max(sourceB.x, targetB.x);
        
        return !(maxX1 < minX2 || maxX2 < minX1);
    }
    
    // Sugiyama算法步骤3: 坐标分配 - 优化确保所有节点都在可视区域内，并将第一级节点放在焦点问题下方
    function assignCoordinates(nodes, orderedLevels, width, height) {
        console.log('步骤3: 坐标分配...');
        
        // 统一的边界间距，确保所有节点都在可视区域内
        const margin = 150; // 左右边界间距，确保不贴边
        const topMargin = 90; // 减小顶部边界间距，让第一级节点更接近焦点问题
        const bottomMargin = 150; // 底部边界间距
        
        // 计算可用的布局区域
        const availableWidth = width - 2 * margin;
        const availableHeight = height - topMargin - bottomMargin;
        
        // 计算层次间距，确保所有层次都在可用区域内
        const levelHeight = Math.max(100, Math.min(140, availableHeight / (orderedLevels.size + 1)));
        
        orderedLevels.forEach((levelNodes, level) => {
            // 计算当前层次的Y坐标，确保在可用区域内
            // 修改：第一级节点放在焦点问题下方(topMargin+80)，其他各级依次向下摆放
            const y = level === 0 
                ? topMargin + 80 // 第一级节点直接放在焦点问题下方
                : topMargin + 80 + level * levelHeight; // 其他级节点依次向下摆放
            
            if (levelNodes.length === 1) {
                // 单节点水平居中
                levelNodes[0].x = width / 2;
                levelNodes[0].y = y;
            } else {
                // 多节点均匀分布，确保不重叠且在可用宽度内
                const totalNodeWidth = levelNodes.reduce((total, node) => {
                    const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
                    const nodeWidth = node.width || nodeDimensions.width;
                    return total + nodeWidth;
                }, 0);
                
                // 计算节点间距，确保所有节点都在可用宽度内
                const totalSpacing = availableWidth - totalNodeWidth;
                const spacing = totalSpacing / (levelNodes.length - 1);
                
                // 确保最小间距
                const minSpacing = Math.max(80, spacing);
                
                // 重新计算起始位置，确保居中
                const requiredWidth = totalNodeWidth + (levelNodes.length - 1) * minSpacing;
                const startX = (width - requiredWidth) / 2;
                
                let currentX = startX;
                levelNodes.forEach((node, index) => {
                    const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
                    const nodeWidth = node.width || nodeDimensions.width;
                    
                    if (index === 0) {
                        node.x = startX + nodeWidth / 2;
                    } else {
                        currentX += minSpacing;
                        node.x = currentX + nodeWidth / 2;
                        currentX += nodeWidth;
                    }
                    node.y = y;
                });
            }
        });
        
        // 严格的边界验证，确保所有节点都在边界内
        nodes.forEach(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            const nodeWidth = node.width || nodeDimensions.width;
            const nodeHeight = node.height || nodeDimensions.height;
            
            // 确保节点不超出左右边界，增加额外的安全边距
            const safeMargin = margin + 20; // 额外20px安全边距
            if (node.x - nodeWidth / 2 < safeMargin) {
                node.x = safeMargin + nodeWidth / 2;
            }
            if (node.x + nodeWidth / 2 > width - safeMargin) {
                node.x = width - safeMargin - nodeWidth / 2;
            }
            
            // 确保节点不超出上下边界，增加额外的安全边距
            const safeTopMargin = topMargin + 20; // 额外20px安全边距
            const safeBottomMargin = bottomMargin + 20; // 额外20px安全边距
            if (node.y - nodeHeight / 2 < safeTopMargin) {
                node.y = safeTopMargin + nodeHeight / 2;
            }
            if (node.y + nodeHeight / 2 > height - safeBottomMargin) {
                node.y = height - safeBottomMargin - nodeHeight / 2;
            }
        });
        
        console.log('坐标分配完成，严格边界验证通过');
    }



    // 调整SVG viewBox，确保所有节点和连线都在可视范围内
    function adjustViewBox(nodes, baseWidth, baseHeight) {
        if (!nodes || nodes.length === 0) return;
        
        // 统一的边界间距
        const margin = 150; // 左右边界间距
        const topMargin = 180; // 顶部边界间距（为焦点问题留出空间）
        const bottomMargin = 150; // 底部边界间距
        
        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 40, 24);
            const nodeWidth = node.width || nodeDimensions.width;
            const nodeHeight = node.height || nodeDimensions.height;
            
            minX = Math.min(minX, node.x - nodeWidth / 2);
            minY = Math.min(minY, node.y - nodeHeight / 2);
            maxX = Math.max(maxX, node.x + nodeWidth / 2);
            maxY = Math.max(maxY, node.y + nodeHeight / 2);
        });
        
        // 计算连线的边界（包括箭头、控制点、标签等）
        if (window.currentGraphData && window.currentGraphData.links) {
            window.currentGraphData.links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                
                if (source && target) {
                    // 计算连线起点和终点
                    const sourceDimensions = calculateNodeDimensions(source.label || '', 100, 40, 24);
                    const targetDimensions = calculateNodeDimensions(target.label || '', 100, 40, 24);
                    
                    const sourceWidth = source.width || sourceDimensions.width;
                    const sourceHeight = source.height || sourceDimensions.height;
                    const targetWidth = target.width || targetDimensions.width;
                    const targetHeight = target.height || targetDimensions.height;
                    
                    // 连线起点和终点
                    let startX, startY, endX, endY;
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0) {
                            startX = source.x + sourceWidth / 2;
                            startY = source.y;
                            endX = target.x - targetWidth / 2;
                            endY = target.y;
                        } else {
                            startX = source.x - sourceWidth / 2;
                            startY = source.y;
                            endX = target.x + targetWidth / 2;
                            endY = target.y;
                        }
                    } else {
                        if (dy > 0) {
                            startX = source.x;
                            startY = source.y + sourceHeight / 2;
                            endX = target.x;
                            endY = target.y - targetHeight / 2;
                        } else {
                            startX = source.x;
                            startY = source.y - sourceHeight / 2;
                            endX = target.x;
                            endY = target.y + targetHeight / 2;
                        }
                    }
                    
                    // 考虑箭头位置
                    const arrowLength = 8;
                    const offsetDistance = 8;
                    const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                    const arrowOffset = offsetDistance / lineLength;
                    const arrowX = endX - (endX - startX) * arrowOffset;
                    const arrowY = endY - (endY - startY) * arrowOffset;
                    
                    // 考虑连线标签
                    const textWidth = Math.max(60, (link.label || '双击编辑').length * 8);
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    
                    minX = Math.min(minX, midX - textWidth / 2);
                    maxX = Math.max(maxX, midX + textWidth / 2);
                    minY = Math.min(minY, midY - 10);
                    maxY = Math.max(maxY, midY + 10);
                    
                    // 考虑箭头顶点
                    const angle = Math.atan2(endY - startY, endX - startX);
                    const arrowAngle1 = angle + Math.PI / 8;
                    const arrowAngle2 = angle - Math.PI / 8;
                    
                    const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
                    const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
                    const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
                    const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
                    
                    minX = Math.min(minX, arrowPoint1X, arrowPoint2X);
                    maxX = Math.max(maxX, arrowPoint1X, arrowPoint2X);
                    minY = Math.min(minY, arrowPoint1Y, arrowPoint2Y);
                    maxY = Math.max(maxY, arrowPoint1Y, arrowPoint2Y);
                }
            });
        }
        
        // 考虑焦点问题的位置
        if (window.focusQuestion) {
            // 焦点问题位于顶部，确保包含在内
            minY = Math.min(minY, 0);
            maxY = Math.max(maxY, 120); // 焦点问题的高度 + 边距
        }
        
        // 使用统一的边界间距，确保所有元素都在可视范围内
        minX = Math.max(0, minX - margin);
        minY = Math.max(0, minY - topMargin);
        maxX = Math.min(baseWidth, maxX + margin);
        maxY = Math.min(baseHeight, maxY + bottomMargin);
        
        // 计算新的viewBox
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        
        // 确保最小尺寸
        const minWidth = Math.max(600, newWidth);
        const minHeight = Math.max(400, newHeight);
        
        // 更新SVG的viewBox
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            svg.setAttribute('viewBox', `${minX} ${minY} ${minWidth} ${minHeight}`);
            console.log(`ViewBox已调整: ${minX} ${minY} ${minWidth} ${minHeight}`);
            console.log(`节点边界: ${minX} ${minY} ${maxX} ${maxY}`);
        }
    }

    // 下载概念图图片
    function downloadConceptMapImage() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可下载的概念图', 'warning');
            return;
        }

        try {
            // 获取SVG元素
            const svg = document.querySelector('.concept-graph');
            if (!svg) {
                showMessage('找不到概念图元素', 'error');
                return;
            }

            // 显示下载中状态
            showMessage('正在生成PNG图片，请稍候...', 'info');

            // 创建SVG的副本，避免修改原始元素
            const clonedSvg = svg.cloneNode(true);
            
            // 设置SVG的尺寸和样式
            const svgRect = svg.getBoundingClientRect();
            const width = svgRect.width;
            const height = svgRect.height;
            
            // 设置SVG属性
            clonedSvg.setAttribute('width', width);
            clonedSvg.setAttribute('height', height);
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
            // 获取当前viewBox
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                clonedSvg.setAttribute('viewBox', viewBox);
            }
            
            // 添加背景色
            const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            backgroundRect.setAttribute('width', '100%');
            backgroundRect.setAttribute('height', '100%');
            backgroundRect.setAttribute('fill', 'white');
            clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild);
            
            // 将SVG转换为字符串
            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            
            // 创建Image对象
            const img = new Image();
            
            // 添加错误处理
            img.onerror = function() {
                showMessage('图片生成失败，请重试', 'error');
            };
            
            img.onload = function() {
                try {
                    // 创建Canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 设置Canvas尺寸
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 绘制白色背景
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    
                    // 将SVG绘制到Canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // 转换为PNG格式
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            // 创建下载链接
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            
                            // 生成文件名
                            const now = new Date();
                            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
                            const filename = `概念图_${timestamp}.png`;
                            
                            link.download = filename;
                            link.style.display = 'none';
                            
                            // 触发下载
                            document.body.appendChild(link);
                            link.click();
                            
                            // 清理
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            
                            showMessage('概念图已下载为PNG文件', 'success');
                        } else {
                            showMessage('PNG图片生成失败', 'error');
                        }
                    }, 'image/png', 0.95); // 设置PNG质量
                } catch (canvasError) {
                    console.error('Canvas处理失败:', canvasError);
                    showMessage('图片处理失败: ' + canvasError.message, 'error');
                }
            };
            
            // 设置SVG数据
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            
        } catch (error) {
            console.error('下载失败:', error);
            showMessage('下载失败: ' + error.message, 'error');
        }
    }

    // 保存概念图数据（JSON格式）
    function saveConceptMap() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可保存的概念图数据', 'warning');
            return;
        }

        try {
            // 创建要保存的数据对象
            const saveData = {
                ...currentGraphData,
                exportInfo: {
                    exportTime: new Date().toISOString(),
                    version: '1.0',
                    system: '概念图自动生成系统'
                }
            };

            // 创建Blob
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { 
                type: 'application/json;charset=utf-8' 
            });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // 生成文件名
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `概念图_${timestamp}.json`;
            
            link.download = filename;
            link.style.display = 'none';
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('概念图数据已保存为JSON文件', 'success');
            
        } catch (error) {
            console.error('保存失败:', error);
            showMessage('保存失败: ' + error.message, 'error');
        }
    }

    // 统一绑定概念图事件
    function bindGraphEvents() {
        // 已废弃：恢复为在drawGraph内直接绑定
    }

    function bindNodeEvents() {}

    function bindLinkEvents() {}
}); 