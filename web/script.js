// 概念图自动生成系统 - 基础交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const keywordInput = document.getElementById('keyword');
    const descriptionTextarea = document.getElementById('description');
    const keywordBtn = document.querySelector('.function-card:first-child .btn-primary');
    const descriptionBtn = document.querySelector('.function-card:nth-child(2) .btn-primary');
    const resetBtn = document.querySelector('.btn-secondary');
    const exportBtn = document.querySelectorAll('.btn-secondary')[1];
    const graphPlaceholder = document.querySelector('.graph-placeholder');
    const sampleGraph = document.querySelector('.sample-graph');
    
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
    
    // 新增：操作历史记录
    let operationHistory = [];
    let currentHistoryIndex = -1;
    let maxHistorySize = 20;

    // 关键词生成概念图事件
    keywordBtn.addEventListener('click', function() {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            showMessage('请输入关键词', 'warning');
            return;
        }
        
        generateConceptMap('keyword', { keyword: keyword });
    });

    // 文本分析生成概念图事件
    descriptionBtn.addEventListener('click', function() {
        const description = descriptionTextarea.value.trim();
        if (!description) {
            showMessage('请输入描述文字', 'warning');
            return;
        }
        
        if (description.length < 10) {
            showMessage('描述文字至少需要10个字符', 'warning');
            return;
        }
        
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
    function generateConceptMap(type, data) {
        if (isGenerating) return;
        
        isGenerating = true;
        showLoadingState();
        
        // 模拟API调用延迟
        setTimeout(() => {
            try {
                // 这里将来会调用实际的AI API
                const mockData = generateMockConceptMap(type, data);
                displayConceptMap(mockData);
                
                showMessage('概念图生成成功！', 'success');
            } catch (error) {
                showMessage('生成失败，请重试', 'error');
                console.error('生成概念图失败:', error);
            } finally {
                isGenerating = false;
                hideLoadingState();
            }
        }, 2000);
    }

    // 生成模拟概念图数据（将来替换为真实AI API调用）
    function generateMockConceptMap(type, data) {
        if (type === 'keyword') {
            return generateKeywordBasedMap(data.keyword);
        } else {
            return generateDescriptionBasedMap(data.description);
        }
    }

    // 基于关键词生成模拟数据
    function generateKeywordBasedMap(keyword) {
        const nodes = [
            { id: '1', label: keyword, x: 300, y: 200, type: 'main', size: 25 },
            { id: '2', label: '相关概念A', x: 150, y: 100, type: 'sub', size: 18 },
            { id: '3', label: '相关概念B', x: 450, y: 100, type: 'sub', size: 18 },
            { id: '4', label: '子概念A1', x: 100, y: 250, type: 'detail', size: 15 },
            { id: '5', label: '子概念A2', x: 200, y: 250, type: 'detail', size: 15 },
            { id: '6', label: '子概念B1', x: 400, y: 250, type: 'detail', size: 15 },
            { id: '7', label: '子概念B2', x: 500, y: 250, type: 'detail', size: 15 }
        ];

        const links = [
            { source: '1', target: '2', label: '包含', type: 'hierarchy' },
            { source: '1', target: '3', label: '包含', type: 'hierarchy' },
            { source: '2', target: '4', label: '细化', type: 'detail' },
            { source: '2', target: '5', label: '细化', type: 'detail' },
            { source: '3', target: '6', label: '细化', type: 'detail' },
            { source: '3', target: '7', label: '细化', type: 'detail' }
        ];

        return { nodes, links, keyword: keyword };
    }

    // 基于描述生成模拟数据
    function generateDescriptionBasedMap(description) {
        const nodes = [
            { id: '1', label: '核心概念', x: 300, y: 200, type: 'main', size: 25 },
            { id: '2', label: '主要特征', x: 150, y: 100, type: 'feature', size: 18 },
            { id: '3', label: '应用场景', x: 450, y: 100, type: 'application', size: 18 },
            { id: '4', label: '技术实现', x: 100, y: 300, type: 'technical', size: 18 },
            { id: '5', label: '优势特点', x: 200, y: 100, type: 'advantage', size: 16 },
            { id: '6', label: '实际案例', x: 400, y: 300, type: 'example', size: 16 }
        ];

        const links = [
            { source: '1', target: '2', label: '具有', type: 'feature' },
            { source: '1', target: '3', label: '应用于', type: 'application' },
            { source: '1', target: '4', label: '通过', type: 'technical' },
            { source: '2', target: '5', label: '包括', type: 'advantage' },
            { source: '3', target: '6', label: '例如', type: 'example' }
        ];

        return { nodes, links, description: description.substring(0, 50) + '...' };
    }

    // 显示概念图
    function displayConceptMap(graphData) {
        currentGraphData = graphData;
        
        // 隐藏占位符
        graphPlaceholder.style.display = 'none';
        
        // 显示概念图区域
        sampleGraph.style.display = 'block';
        
        // 显示编辑工具栏
        editToolbar.style.display = 'grid';
        
        // 这里将来会使用D3.js渲染实际的概念图
        // 现在先显示一个简单的文本描述
        const svg = sampleGraph.querySelector('.concept-graph');
        svg.innerHTML = `
            <text x="50%" y="50%" text-anchor="middle" font-size="16" fill="#666">
                概念图已生成，包含 ${graphData.nodes.length} 个节点和 ${graphData.links.length} 个连接
            </text>
            <text x="50%" y="70%" text-anchor="middle" font-size="14" fill="#999">
                这里将显示D3.js渲染的交互式概念图
            </text>
        `;
        
        // 更新导出按钮状态
        exportBtn.disabled = false;
        
        // 更新状态栏
        updateStatusBar(graphData);
        
        // 保存到历史记录
        saveToHistory(graphData);
    }

    // 重置视图
    function resetView() {
        currentGraphData = null;
        graphPlaceholder.style.display = 'flex';
        sampleGraph.style.display = 'none';
        editToolbar.style.display = 'none';
        
        // 清空输入
        keywordInput.value = '';
        descriptionTextarea.value = '';
        
        // 禁用导出按钮
        exportBtn.disabled = true;
        
        // 重置状态栏
        updateStatusBar({ nodes: [], links: [] });
        
        // 清空历史记录
        clearHistory();
        
        showMessage('视图已重置', 'info');
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

    // 新增：节点操作函数
    function addNewNode() {
        if (!currentGraphData) return;
        
        const newNodeId = (currentGraphData.nodes.length + 1).toString();
        const newNode = {
            id: newNodeId,
            label: '新节点',
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
            type: 'detail',
            size: 15
        };
        
        currentGraphData.nodes.push(newNode);
        updateStatusBar(currentGraphData);
        saveToHistory(currentGraphData);
        showMessage('新节点已添加', 'success');
        
        // 这里将来会更新D3.js渲染
    }

    function deleteSelectedNode() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可删除的节点', 'warning');
            return;
        }
        
        // 这里将来会实现节点选择逻辑
        showMessage('请先选择要删除的节点', 'info');
    }

    function editSelectedNode() {
        if (!currentGraphData || currentGraphData.nodes.length === 0) {
            showMessage('没有可编辑的节点', 'warning');
            return;
        }
        
        // 这里将来会实现节点编辑逻辑
        showMessage('请先选择要编辑的节点', 'info');
    }

    // 新增：连线操作函数
    function addNewLink() {
        if (!currentGraphData || currentGraphData.nodes.length < 2) {
            showMessage('需要至少两个节点才能添加连线', 'warning');
            return;
        }
        
        // 这里将来会实现连线添加逻辑
        showMessage('请选择连线的起始和结束节点', 'info');
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
    function applyAutoLayout() {
        if (!currentGraphData) return;
        
        showMessage('正在应用自动布局...', 'info');
        
        // 这里将来会实现D3.js力导向布局
        setTimeout(() => {
            showMessage('自动布局已应用', 'success');
        }, 1000);
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
        const activeBtn = event.target;
        activeBtn.classList.add('loading');
        activeBtn.textContent = '生成中...';
        activeBtn.disabled = true;
    }

    // 隐藏加载状态
    function hideLoadingState() {
        const loadingBtns = document.querySelectorAll('.btn-primary.loading');
        loadingBtns.forEach(btn => {
            btn.classList.remove('loading');
            btn.textContent = btn.textContent.includes('关键词') ? '生成概念图' : '分析生成';
            btn.disabled = false;
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
        // 禁用导出按钮（初始状态）
        exportBtn.disabled = true;
        
        // 添加一些示例数据提示
        keywordInput.placeholder = '例如：人工智能、机器学习、区块链...';
        descriptionTextarea.placeholder = '例如：人工智能是计算机科学的一个分支，致力于开发能够执行通常需要人类智能的任务的系统...';
        
        // 初始化状态栏
        updateStatusBar({ nodes: [], links: [] });
        
        // 初始化历史记录按钮
        updateHistoryButtons();
        
        showMessage('欢迎使用概念图自动生成系统！', 'info');
    }

    // 页面初始化
    initializePage();
}); 