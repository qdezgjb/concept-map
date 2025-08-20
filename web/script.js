// 概念图自动生成系统 - 基础交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const keywordInput = document.getElementById('keyword');
    const descriptionTextarea = document.getElementById('description');
    const keywordBtn = document.getElementById('generateKeywordBtn');
    const descriptionBtn = document.getElementById('generateDescriptionBtn');
    const resetBtn = document.getElementById('resetViewBtn');
    const exportBtn = document.getElementById('exportImageBtn');
    const graphPlaceholder = document.querySelector('.graph-placeholder');
    
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
    
    // 新增：状态栏元素
    const nodeCountSpan = document.getElementById('nodeCount');
    const linkCountSpan = document.getElementById('linkCount');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

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
    addNodeBtn.addEventListener('click', addNewNode);
    deleteNodeBtn.addEventListener('click', deleteSelectedNode);
    editNodeBtn.addEventListener('click', editSelectedNode);
    addLinkBtn.addEventListener('click', addNewLink);
    deleteLinkBtn.addEventListener('click', deleteSelectedLink);
    editLinkBtn.addEventListener('click', editSelectedLink);
    autoLayoutBtn.addEventListener('click', applyAutoLayout);
    layoutSelect.addEventListener('change', changeLayout);
    nodeColorPicker.addEventListener('change', changeNodeColor);
    linkColorPicker.addEventListener('change', changeLinkColor);
    nodeShapeSelect.addEventListener('change', changeNodeShape);
    
    // 新增：状态栏事件绑定
    saveBtn.addEventListener('click', saveConceptMap);
    loadBtn.addEventListener('click', loadConceptMap);
    undoBtn.addEventListener('click', undoOperation);
    redoBtn.addEventListener('click', redoOperation);

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
            
            // 显示AI介绍加载状态
            const aiIntroText = document.getElementById('aiIntroText');
            aiIntroText.innerHTML = '正在生成AI介绍内容...';
            aiIntroText.className = 'intro-text loading';
            
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
    {"source": "1", "target": "2", "label": "包含", "type": "hierarchy", "strength": 8},
    {"source": "1", "target": "3", "label": "包含", "type": "hierarchy", "strength": 7}
  ],
  "metadata": {
    "keyword": "${data.keyword}",
    "summary": "基于关键词'${data.keyword}'生成的概念图",
    "domain": "通用领域"
  }
}`;
            } else {
                conceptPrompt = `请分析以下描述文字，提取关键概念和关系，返回JSON格式：

描述内容：${data.description}

请提取核心概念、相关概念、概念间的关系，返回严格的JSON格式：
{
  "nodes": [
    {"id": "1", "label": "核心概念", "type": "main", "description": "从描述中提取的核心概念", "importance": 10},
    {"id": "2", "label": "相关概念A", "type": "sub", "description": "与核心概念相关的概念", "importance": 8},
    {"id": "3", "label": "相关概念B", "type": "sub", "description": "与核心概念相关的概念", "importance": 7}
  ],
  "links": [
    {"source": "1", "target": "2", "label": "具有", "type": "feature", "strength": 8},
    {"source": "1", "target": "3", "label": "包含", "type": "hierarchy", "strength": 7}
  ],
  "metadata": {
    "summary": "基于描述文字生成的概念图",
    "domain": "通用领域",
    "keyInsights": "从描述中提取的关键洞察"
  }
}`;
            }
            
            // 构建AI介绍生成提示词
            let introPrompt = '';
            if (type === 'keyword') {
                introPrompt = `请为关键词"${data.keyword}"生成一段详细的介绍文字，要求：
1. 介绍该概念的基本含义和定义
2. 说明其重要性和意义
3. 描述相关的历史背景或发展历程
4. 列举主要特点或特征
5. 语言要通俗易懂，适合一般读者理解
6. 字数控制在300-500字之间

请直接返回介绍文字，不要包含其他格式标记。`;
            } else {
                introPrompt = `请为以下描述内容生成一段详细的介绍文字，要求：
1. 总结描述的核心要点
2. 解释相关概念的含义
3. 分析其重要性和应用价值
4. 语言要通俗易懂，适合一般读者理解
5. 字数控制在300-500字之间

描述内容：${data.description}

请直接返回介绍文字，不要包含其他格式标记。`;
            }
            
            // 并行调用两个API：概念图生成和AI介绍生成
            const [conceptResponse, introResponse] = await Promise.all([
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
            
            const conceptResult = await conceptResponse.json();
            const introResult = await introResponse.json();
            
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
            
            // 处理AI介绍生成结果
            if (introResult.success) {
                aiIntroText.innerHTML = introResult.response;
                aiIntroText.className = 'intro-text';
                showMessage('AI介绍生成成功！', 'success');
            } else {
                aiIntroText.innerHTML = 'AI介绍生成失败，请稍后重试。';
                aiIntroText.className = 'intro-text';
                showMessage('AI介绍生成失败', 'warning');
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

    // 转换API数据为D3.js格式
    function convertToD3Format(conceptData) {
        const nodes = conceptData.nodes.map((node, index) => ({
            id: node.id,
            label: node.label,
            x: Math.random() * 400 + 100, // 随机位置，后续会通过布局算法优化
            y: Math.random() * 300 + 100,
            type: node.type,
            description: node.description,
            importance: node.importance || 5
        }));

        const links = conceptData.links.map((link, index) => ({
            source: link.source,
            target: link.target,
            label: link.label,
            type: link.type,
            strength: link.strength || 5
        }));

        return {
            nodes: nodes,
            links: links,
            metadata: conceptData.metadata || {}
        };
    }

    // 已移除：默认/模拟概念图生成代码

    // 显示并渲染概念图
    function displayConceptMap(graphData) {
        currentGraphData = graphData;
        ensureCanvasVisible();
        drawGraph(currentGraphData);
        exportBtn.disabled = false;
        updateStatusBar(currentGraphData);
        saveToHistory(currentGraphData);
    }

    // 确保画布可见
    function ensureCanvasVisible() {
        graphPlaceholder.style.display = 'none';
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        conceptMapDisplay.style.display = 'flex';
        editToolbar.style.display = 'grid';
    }

    // 初始化空图数据
    function ensureGraphInitialized() {
        if (!currentGraphData) {
            currentGraphData = { nodes: [], links: [] };
            ensureCanvasVisible();
            updateStatusBar(currentGraphData);
            saveToHistory(currentGraphData);
        }
    }

    // 使用原生SVG简单渲染节点和连线
    function drawGraph(data) {
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        const svg = conceptMapDisplay.querySelector('.concept-graph');
        const width = svg.clientWidth || svg.viewBox?.baseVal?.width || 800;
        const height = svg.clientHeight || svg.viewBox?.baseVal?.height || 400;

        // 清空
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // 先渲染连线
        const nodeById = new Map(data.nodes.map(n => [n.id, n]));
        data.links.forEach(link => {
            const source = nodeById.get(link.source);
            const target = nodeById.get(link.target);
            if (!source || !target) return;
            
            // 计算连线起点和终点（矩形节点边缘）
            const sourceWidth = Math.max(80, (source.label || '').length * 8);
            const sourceHeight = 40;
            const targetWidth = Math.max(80, (target.label || '').length * 8);
            const targetHeight = 40;
            
            // 计算连线起点和终点（始终连接到节点边缘的中点）
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            
            let startX, startY, endX, endY;
            
            // 确定连接方向并计算边缘中点
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平距离更大，从左右边缘连接
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
            } else {
                // 垂直距离更大，从上下边缘连接
                if (dy > 0) {
                    // 源节点在上，目标节点在下
                    startX = source.x;                    // 源节点水平中点
                    startY = source.y + sourceHeight / 2; // 源节点下边缘中点
                    endX = target.x;                      // 目标节点水平中点
                    endY = target.y - targetHeight / 2;   // 目标节点上边缘中点
                } else {
                    // 源节点在下，目标节点在上
                    startX = source.x;                    // 源节点水平中点
                    startY = source.y - sourceHeight / 2; // 源节点上边缘中点
                    endX = target.x;                      // 目标节点水平中点
                    endY = target.y + targetHeight / 2;   // 目标节点下边缘中点
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
            
<<<<<<< HEAD
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
            
            // 创建一条从起点到终点的完整路径
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
=======
            // 创建第一段连接线（从起点到中点）
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const line1Path = `M ${startX} ${startY} L ${midX} ${midY}`;
            line1.setAttribute('d', line1Path);
            line1.setAttribute('stroke', '#aaa');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('fill', 'none');
            
            // 创建第二段连接线（从中点到箭头位置）
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const line2Path = `M ${midX} ${midY} L ${arrowX} ${arrowY}`;
            line2.setAttribute('d', line2Path);
            line2.setAttribute('stroke', '#aaa');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('fill', 'none');
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            
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
            linkLabel.setAttribute('x', midX);
<<<<<<< HEAD
            linkLabel.setAttribute('y', midY + 4); // 稍微向下偏移，让文字在断开位置居中
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '12');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('fill', '#333');
=======
            linkLabel.setAttribute('y', midY - 5); // 稍微向上偏移，避免与连接线重叠
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '12');
            linkLabel.setAttribute('fill', '#333');
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            linkLabel.setAttribute('font-weight', '500');
            linkLabel.setAttribute('pointer-events', 'all');
            linkLabel.setAttribute('cursor', 'pointer');
            linkLabel.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            linkLabel.setAttribute('data-link-label', 'true');
            
            // 设置标签文字内容
            linkLabel.textContent = link.label || '双击编辑';
            
            // 添加双击编辑事件
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
            // 将连接线、箭头和标签添加到组中
<<<<<<< HEAD
            lineGroup.appendChild(line);
=======
            lineGroup.appendChild(line1);
            lineGroup.appendChild(line2);
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            lineGroup.appendChild(arrow);
            lineGroup.appendChild(linkLabel);
            svg.appendChild(lineGroup);
        });

        // 再渲染节点
        data.nodes.forEach((node, idx) => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('data-node-id', node.id);

            // 计算节点尺寸 - 优先使用保存的尺寸，否则使用默认值
            const nodeWidth = node.width || Math.max(80, (node.label || `节点${idx + 1}`).length * 8);
            const nodeHeight = node.height || 40;
            const radius = 8; // 圆角半径

            // 设置组的位置
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
            text.setAttribute('y', 4); // 相对于组的中心位置
            text.setAttribute('text-anchor', 'middle');
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
            text.textContent = node.label || `节点${idx + 1}`;

            // 为每个节点添加事件监听器（每次绘制都添加）
            // 添加单击选中事件
            g.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                selectNode(node.id);
            });

            // 添加双击事件监听器
            g.addEventListener('dblclick', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                editNodeText(node.id);
            });

                    // 添加拖动功能 - 只在节点内部触发
            rect.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                // 开始拖动
                startDrag(node.id, e.clientX, e.clientY);
            });

            // 确保g元素能够接收事件，但拖动只在节点内部触发
            g.style.pointerEvents = 'all';
            // 防止节点组本身触发拖动
            g.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                // 不阻止默认行为，让子元素处理
            });

            // 完全禁用悬停效果，避免抖动
            // g.addEventListener('mouseenter', function() {
            //     // 检查全局拖动标志，只有在非拖动状态下才应用悬停效果
            //     if (!document.body.hasAttribute('data-dragging')) {
            //         rect.setAttribute('fill-opacity', '1');
            //         rect.setAttribute('stroke-width', '3');
            //     }
            // });

            // g.addEventListener('mouseleave', function() {
            //     // 检查全局拖动标志，只有在非拖动状态下才恢复默认样式
            //     if (!document.body.hasAttribute('data-dragging')) {
            //         // 检查节点是否被选中
            //         if (selectedNodeId === node.id) {
            //             rect.setAttribute('fill-opacity', '0.9');
            //             rect.setAttribute('stroke-width', '3'); // 保持选中状态的边框
            //         } else {
            //             rect.setAttribute('fill-opacity', '0.9');
            //             rect.setAttribute('stroke-width', '2');
            //         }
            //     }
            // });

            // 移除鼠标移动事件，避免不必要的干扰
            // g.addEventListener('mousemove', function() {
            //     if (isDragging) {
            //         // 拖动过程中，保持当前样式，不触发悬停效果
            //         return;
            //     }
            // });

            g.appendChild(rect);
            g.appendChild(text);
            svg.appendChild(g);
        });

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

        // 只移动被拖动的节点，其他节点保持静止
        const nodeGroup = document.querySelector(`g[data-node-id="${selectedNodeId}"]`);
        if (nodeGroup) {
            // 设置组的transform，将整个组移动到新位置
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
    }

    // 更新单个连线的位置
    function updateLinkPosition(linkGroup, link) {
        const sourceNode = currentGraphData.nodes.find(n => n.id === link.source);
        const targetNode = currentGraphData.nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return;

<<<<<<< HEAD
        // 获取连接线、箭头和标签元素
        const line = linkGroup.querySelector('path:nth-child(1)'); // 连接线
        const arrow = linkGroup.querySelector('path:nth-child(2)'); // 箭头
        const linkLabel = linkGroup.querySelector('text'); // 标签
        
        if (!line || !arrow || !linkLabel) return;
=======
        // 获取连接线段、箭头和标签元素
        const line1 = linkGroup.querySelector('path:nth-child(1)'); // 第一段连接线
        const line2 = linkGroup.querySelector('path:nth-child(2)'); // 第二段连接线
        const arrow = linkGroup.querySelector('path:nth-child(3)'); // 箭头
        const linkLabel = linkGroup.querySelector('text'); // 标签
        
        if (!line1 || !line2 || !arrow || !linkLabel) return;
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45

        // 计算连线起点和终点（矩形节点边缘）
        const sourceWidth = sourceNode.width || Math.max(80, (sourceNode.label || '').length * 8);
        const sourceHeight = sourceNode.height || 40;
        const targetWidth = targetNode.width || Math.max(80, (targetNode.label || '').length * 8);
        const targetHeight = targetNode.height || 40;

        // 计算连线起点和终点（始终连接到节点边缘的中点）
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        
        let startX, startY, endX, endY;
        
        // 确定连接方向并计算边缘中点
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平距离更大，从左右边缘连接
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
        } else {
            // 垂直距离更大，从上下边缘连接
            if (dy > 0) {
                // 源节点在上，目标节点在下
                startX = sourceNode.x;                    // 源节点水平中点
                startY = sourceNode.y + sourceHeight / 2; // 源节点下边缘中点
                endX = targetNode.x;                      // 目标节点水平中点
                endY = targetNode.y - targetHeight / 2;   // 目标节点上边缘中点
            } else {
                // 源节点在下，目标节点在上
                startX = sourceNode.x;                    // 源节点水平中点
                startY = sourceNode.y - sourceHeight / 2; // 源节点上边缘中点
                endX = targetNode.x;                      // 目标节点水平中点
                endY = targetNode.y + targetHeight / 2;   // 目标节点下边缘中点
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
        
<<<<<<< HEAD
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
        
        // 更新标签位置
        linkLabel.setAttribute('x', midX);
        linkLabel.setAttribute('y', midY + 4);
=======
        // 更新第一段连接线（从起点到中点）
        const line1Path = `M ${startX} ${startY} L ${midX} ${midY}`;
        line1.setAttribute('d', line1Path);
        
        // 更新第二段连接线（从中点到箭头位置）
        const line2Path = `M ${midX} ${midY} L ${arrowX} ${arrowY}`;
        line2.setAttribute('d', line2Path);
        
        // 更新标签位置
        linkLabel.setAttribute('x', midX);
        linkLabel.setAttribute('y', midY - 5);
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
        
        // 更新箭头位置
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowAngle1 = angle + Math.PI / 8; // 缩小箭头角度，让箭头更精致
        const arrowAngle2 = angle - Math.PI / 8; // 缩小箭头角度，让箭头更精致
        
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
            
            // 计算连线起点和终点（始终连接到节点边缘的中点，与updateLinkPosition保持一致）
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            
            let startX, startY, endX, endY;
            
            // 确定连接方向并计算边缘中点
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平距离更大，从左右边缘连接
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
            } else {
                // 垂直距离更大，从上下边缘连接
                if (dy > 0) {
                    // 源节点在上，目标节点在下
                    startX = sourceNode.x;                    // 源节点水平中点
                    startY = sourceNode.y + sourceHeight / 2; // 源节点下边缘中点
                    endX = targetNode.x;                      // 目标节点水平中点
                    endY = targetNode.y - targetHeight / 2;   // 目标节点上边缘中点
                } else {
                    // 源节点在下，目标节点在上
                    startX = sourceNode.x;                    // 源节点水平中点
                    startY = sourceNode.y - sourceHeight / 2; // 源节点上边缘中点
                    endX = targetNode.x;                      // 目标节点水平中点
                    endY = targetNode.y + targetHeight / 2;   // 目标节点下边缘中点
                }
            }
            
            // 创建带箭头的连接线
            const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            lineGroup.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            
<<<<<<< HEAD
            // 计算连接线中点
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // 计算文字区域的宽度，为文字留出空间
            const textWidth = Math.max(60, (link.label || '双击编辑').length * 8);
            const textHeight = 20;
            
            // 计算文字区域的边界
            const textLeft = midX - textWidth / 2;
            const textRight = midX + textWidth / 2;
=======
            // 创建连接线路径
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            
            // 计算箭头位置（确保箭头到结束节点的距离与连接线到开始节点的距离一致）
            const arrowLength = 8; // 缩小箭头长度
            const arrowWidth = 6;  // 缩小箭头宽度
            
<<<<<<< HEAD
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
=======
            // 计算箭头偏移距离，确保与连接线到开始节点的距离一致
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            const offsetDistance = 8; // 固定偏移距离，与连接线到开始节点的距离保持一致
            const arrowOffset = offsetDistance / lineLength; // 箭头偏移比例
            
            const arrowX = endX - (endX - startX) * arrowOffset;
            const arrowY = endY - (endY - startY) * arrowOffset;
            
<<<<<<< HEAD
            // 创建一条完整的连接线，使用stroke-dasharray创建断开效果
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 创建一条从起点到终点的完整路径
=======
            // 创建连接线路径（从起点到箭头位置）
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            const linePath = `M ${startX} ${startY} L ${arrowX} ${arrowY}`;
            line.setAttribute('d', linePath);
            line.setAttribute('stroke', '#aaa');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
<<<<<<< HEAD
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
=======
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            
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
            
<<<<<<< HEAD
            // 创建连接线标签（可编辑的文字）
            const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            linkLabel.setAttribute('x', midX);
            linkLabel.setAttribute('y', midY + 4); // 稍微向下偏移，让文字在断开位置居中
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
            
            // 添加双击编辑事件
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
            // 将连接线、箭头和标签添加到组中
            lineGroup.appendChild(line);
            lineGroup.appendChild(arrow);
            lineGroup.appendChild(linkLabel);
=======
            // 将连接线和箭头添加到组中
            lineGroup.appendChild(line);
            lineGroup.appendChild(arrow);
>>>>>>> d39f10e21ad3bdc06da9b39a1dc26e81226bce45
            svg.appendChild(lineGroup);
        });
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
            position: fixed;
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
        // 若未初始化，创建空图并展示画布
        ensureGraphInitialized();
        
        const newNodeId = (currentGraphData.nodes.length + 1).toString();
        
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
        
        currentGraphData.nodes.push(newNode);
        drawGraph(currentGraphData);
        updateStatusBar(currentGraphData);
        saveToHistory(currentGraphData);
        showMessage('新节点已添加', 'success');
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
            label: '' // 可以后续添加连线标签
        };
        
        // 添加到数据中
        currentGraphData.links.push(newLink);
        
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
        
        showMessage('正在应用自动布局...', 'info');
        
        try {
            // 构建布局优化提示词
            const prompt = `请为以下概念图推荐最优的布局方式：

概念图数据：${JSON.stringify(currentGraphData)}

请分析节点数量、关系复杂度、层次结构等因素，推荐最适合的布局算法：
- 力导向布局：适合关系复杂的图
- 层次布局：适合有明确层级的概念
- 圆形布局：适合中心辐射型概念
- 网格布局：适合结构化概念

返回严格的JSON格式：
{
  "recommendedLayout": "推荐的布局算法",
  "reason": "推荐理由",
  "parameters": {
    "nodeSpacing": "节点间距建议",
    "linkLength": "连线长度建议"
  }
}`;
            
            // 调用DeepSeek API
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                try {
                    const content = result.response;
                    const startIdx = content.indexOf('{');
                    const endIdx = content.lastIndexOf('}') + 1;
                    
                    if (startIdx !== -1 && endIdx !== -1) {
                        const jsonContent = content.substring(startIdx, endIdx);
                        const layoutData = JSON.parse(jsonContent);
                        showMessage(`布局优化完成: ${layoutData.recommendedLayout}`, 'success');
                        // 这里将来会应用推荐的布局算法
                    } else {
                        showMessage('AI响应格式错误', 'warning');
                    }
                } catch (parseError) {
                    showMessage('AI响应解析失败', 'warning');
                }
            } else {
                showMessage(`布局优化失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showMessage('布局优化请求失败', 'error');
            console.error('布局优化失败:', error);
        }
    }

    function changeLayout() {
        const selectedLayout = layoutSelect.value;
        showMessage(`已切换到${layoutSelect.options[layoutSelect.selectedIndex].text}`, 'info');
        
        // 这里将来会实现不同布局算法的切换
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
        // 移除当前位置之后的历史记录
        operationHistory = operationHistory.slice(0, currentHistoryIndex + 1);
        
        // 添加新的状态
        operationHistory.push(JSON.parse(JSON.stringify(data)));
        
        // 限制历史记录大小
        if (operationHistory.length > maxHistorySize) {
            operationHistory.shift();
        } else {
            currentHistoryIndex++;
        }
        
        updateHistoryButtons();
    }

    function undoOperation() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const previousData = operationHistory[currentHistoryIndex];
            currentGraphData = JSON.parse(JSON.stringify(previousData));
            updateStatusBar(currentGraphData);
            updateHistoryButtons();
            showMessage('已撤销操作', 'info');
            
            // 这里将来会更新D3.js渲染
        }
    }

    function redoOperation() {
        if (currentHistoryIndex < operationHistory.length - 1) {
            currentHistoryIndex++;
            const nextData = operationHistory[currentHistoryIndex];
            currentGraphData = JSON.parse(JSON.stringify(nextData));
            updateStatusBar(nextData);
            updateHistoryButtons();
            showMessage('已重做操作', 'info');
            
            // 这里将来会更新D3.js渲染
        }
    }

    function clearHistory() {
        operationHistory = [];
        currentHistoryIndex = -1;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        undoBtn.disabled = currentHistoryIndex <= 0;
        redoBtn.disabled = currentHistoryIndex >= operationHistory.length - 1;
    }

    // 新增：状态栏更新
    function updateStatusBar(data) {
        nodeCountSpan.textContent = `节点: ${data.nodes.length}`;
        linkCountSpan.textContent = `连线: ${data.links.length}`;
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
        // 禁用导出按钮（初始状态）
        exportBtn.disabled = true;
        
        // 确保编辑工具栏可见
        const editToolbar = document.querySelector('.edit-toolbar');
        if (editToolbar) {
            editToolbar.style.display = 'grid';
        }
        
        // 添加一些示例数据提示
        keywordInput.placeholder = '例如：人工智能、机器学习、区块链...';
        descriptionTextarea.placeholder = '例如：人工智能是计算机科学的一个分支，致力于开发能够执行通常需要人类智能的任务的系统...';
        
        // 初始化状态栏
        updateStatusBar({ nodes: [], links: [] });
        
        // 初始化历史记录按钮
        updateHistoryButtons();
        
        // 初始化节点操作按钮状态
        updateNodeOperationButtons();
        
        showMessage('欢迎使用概念图自动生成系统！您可以直接使用右侧工具栏创建概念图，或使用AI生成', 'info');
    }

    // 页面初始化
    initializePage();

    // 更新节点操作按钮状态
    function updateNodeOperationButtons() {
        if (deleteNodeBtn) deleteNodeBtn.disabled = !selectedNodeId;
        if (editNodeBtn) editNodeBtn.disabled = !selectedNodeId;
    }

    // 重置视图
    function resetView() {
        currentGraphData = null;
        graphPlaceholder.style.display = 'flex';
        
        // 隐藏概念图展示区域
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        conceptMapDisplay.style.display = 'none';
        
        // 保持编辑工具栏可见，让用户可以继续创建概念图
        editToolbar.style.display = 'grid';
        
        // 取消节点选中状态
        deselectNode();
        
        // 清空输入
        keywordInput.value = '';
        descriptionTextarea.value = '';
        
        // 清空AI介绍文字
        const aiIntroText = document.getElementById('aiIntroText');
        aiIntroText.innerHTML = '';
        aiIntroText.className = 'intro-text';
        
        // 禁用导出按钮
        exportBtn.disabled = true;
        
        // 重置状态栏
        updateStatusBar({ nodes: [], links: [] });
        
        // 清空历史记录
        clearHistory();
        
        showMessage('视图已重置，您可以继续使用工具栏创建概念图', 'info');
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
}); 