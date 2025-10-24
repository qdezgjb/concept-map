// 概念图自动生成系统 - 核心模块
// 包含: DOM初始化、事件绑定、应用初始化、概念图生成

//=============================================================================
// 全局变量定义
//=============================================================================

// 当前概念图数据
window.currentGraphData = null;
window.isGenerating = false;

// 节点选中和拖动相关变量
window.selectedNodeId = null;
window.isDragging = false;
window.dragStartX = 0;
window.dragStartY = 0;
window.dragOriginalNodeX = 0;
window.dragOriginalNodeY = 0;

// 操作历史记录
window.operationHistory = [];
window.currentHistoryIndex = -1;
window.maxHistorySize = 20;

//=============================================================================
// 应用初始化函数
//=============================================================================

function cleanup() {
    // 移除全局拖动事件监听器
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // 恢复页面样式
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
}

function initializePage() {
    console.log('开始初始化页面...');
    
    // 禁用导出按钮（初始状态）
    if (window.exportBtn) {
        window.exportBtn.disabled = true;
        console.log('导出按钮已禁用');
    } else {
        console.error('exportBtn 元素未找到');
    }
    
    // 确保编辑工具栏可见
    if (window.editToolbar) {
        window.editToolbar.style.display = 'grid';
        console.log('编辑工具栏已设置为可见');
    } else {
        console.error('editToolbar 元素未找到');
    }
    
    // 添加示例数据提示
    if (window.keywordInput) {
        window.keywordInput.placeholder = '人工智能的背景';
        console.log('关键词输入框占位符已设置');
    } else {
        console.error('keywordInput 元素未找到');
    }
    
    if (window.descriptionTextarea) {
        window.descriptionTextarea.placeholder = '例如：人工智能是计算机科学的一个分支，致力于开发能够执行通常需要人类智能的任务的系统...';
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

function resetView() {
    // 显示确认弹窗
    if (!confirm('你确定要重置视图吗？未保存的内容将全部被清除')) {
        return;
    }
    
    // 清除所有生成的内容
    currentGraphData = null;
    window.currentGraphData = null;
    
    // 显示占位符
    window.graphPlaceholder.style.display = 'flex';
    
    // 隐藏概念图展示区域
    const conceptMapDisplay = document.querySelector('.concept-map-display');
    if (conceptMapDisplay) {
        conceptMapDisplay.style.display = 'none';
    }
    
    // 保持编辑工具栏可见
    if (window.editToolbar) {
        window.editToolbar.style.display = 'grid';
    }
    
    // 取消节点选中状态
    deselectNode();
    
    // 清空输入框
    if (window.keywordInput) {
        window.keywordInput.value = '';
    }
    if (window.descriptionTextarea) {
        window.descriptionTextarea.value = '';
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
    if (window.exportBtn) {
        window.exportBtn.disabled = true;
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
    
    // 重置生成按钮状态
    resetGenerateButtons();
    
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

//=============================================================================
// 概念图生成函数
//=============================================================================

/**
 * 重置生成按钮状态
 */
function resetGenerateButtons() {
    if (window.keywordBtn) {
        window.keywordBtn.classList.remove('loading');
        window.keywordBtn.textContent = '生成';
        window.keywordBtn.disabled = false;
    }
    if (window.descriptionBtn) {
        window.descriptionBtn.classList.remove('loading');
        window.descriptionBtn.textContent = '分析生成';
        window.descriptionBtn.disabled = false;
    }
}

async function generateConceptMapWithLLM(type, data) {
    console.log('generateConceptMapWithLLM函数被调用，类型:', type, '数据:', data);
    
    if (isGenerating) {
        console.log('正在生成中，忽略重复请求');
        return;
    }
    
    isGenerating = true;
    console.log('开始生成概念图流程...');
    
    // 清除之前的概念图内容
    console.log('清除之前的概念图内容...');
    clearPreviousConceptMap();
    
    // 清除之前的步骤用时记录
    window.stepDurations = {};
    
    // 记录总开始时间
    const totalStartTime = performance.now();
    
    try {
        // 先显示概念图展示区域
        const conceptMapDisplay = document.querySelector('.concept-map-display');
        conceptMapDisplay.style.display = 'flex';
        
        // 隐藏占位符
        graphPlaceholder.style.display = 'none';
        
        // 显示加载动画
        showLoadingAnimation();
        
        // 显示内容加载状态
        showContentLoadingState(type, data);
        
        // 生成焦点问题
        generateFocusQuestion(type, data);
        
        // 针对焦点问题模式，使用两步流程
        if (type === 'keyword') {
            // === 步骤1：生成介绍文本（流式输出） ===
            const step1Start = performance.now();
            updateProcessStatus(1, 'active');
            
            // 清空并准备文本内容展示区域
            const textDisplayArea = window.aiIntroText;
            if (textDisplayArea) {
                textDisplayArea.innerHTML = '<div class="streaming-text" style="padding: 10px; line-height: 1.8; color: #333; font-size: 14px;"></div>';
            }
            
            const streamingDiv = textDisplayArea ? textDisplayArea.querySelector('.streaming-text') : null;
            let introText = '';
            
            console.log('准备开始流式生成介绍文本，显示区域:', textDisplayArea);
            
            // 调用流式生成介绍文本
            const introResult = await window.llmManager.generateIntroduction(
                data.keyword,
                (chunk) => {
                    // 实时显示生成的文本
                    introText += chunk;
                    if (streamingDiv) {
                        streamingDiv.textContent = introText;
                    }
                }
            );
            
            console.log('==================== 步骤1完成检查 ====================');
            console.log('流式文本生成完成，总字数:', introText.length);
            console.log('introResult对象:', introResult);
            console.log('introResult.success:', introResult?.success);
            console.log('introResult.text:', introResult?.text ? '存在，长度:' + introResult.text.length : '不存在');
            console.log('=========================================================');
            
            const step1Duration = ((performance.now() - step1Start) / 1000).toFixed(2) + 's';
            
            if (!introResult) {
                console.error('❌ introResult为null或undefined');
                updateProcessStatus(1, 'error');
                showMessage('文本生成返回结果为空', 'warning');
                isGenerating = false;
                resetGenerateButtons();
                return;
            }
            
            if (!introResult.success) {
                console.error('❌ introResult.success为false，introResult:', introResult);
                updateProcessStatus(1, 'error');
                showMessage(introResult?.message || '文本生成失败', 'warning');
                isGenerating = false;
                resetGenerateButtons();
                return;
            }
            
            if (!introResult.text || introResult.text.length === 0) {
                console.error('❌ 生成的文本为空');
                updateProcessStatus(1, 'error');
                showMessage('生成的文本为空，请重试', 'warning');
                isGenerating = false;
                resetGenerateButtons();
                return;
            }
            
            console.log('✅ 介绍文本生成成功，文本长度:', introResult.text.length);
            console.log('准备进入步骤2：提取三元组');
            updateProcessStatus(1, 'completed', step1Duration);
            
            // 等待一小段时间，确保第一次流式连接完全释放
            console.log('⏳ 等待连接清理...');
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('✅ 连接清理完成，开始步骤2');
            
            // === 步骤2：提取三元组 ===
            const step2Start = performance.now();
            updateProcessStatus(2, 'active');
            
            console.log('=== 步骤2开始：提取三元组 ===');
            console.log('开始从介绍文本提取三元组，文本长度:', introResult.text.length);
            console.log('文本前100字:', introResult.text.substring(0, 100));
            console.log('window.llmManager存在:', !!window.llmManager);
            console.log('extractTriples方法存在:', typeof window.llmManager?.extractTriples);
            
            // 在文本展示区域显示处理状态
            if (streamingDiv) {
                streamingDiv.innerHTML = introText + '<br><br><div style="color: #666; font-style: italic;">正在提取三元组...</div>';
            }
            
            let tripleResult;
            try {
                console.log('准备调用extractTriples...');
                tripleResult = await window.llmManager.extractTriples(introResult.text);
                console.log('extractTriples调用完成');
                console.log('三元组提取返回结果:', tripleResult);
            } catch (error) {
                console.error('三元组提取异常:', error);
                updateProcessStatus(2, 'error');
                showMessage('三元组提取异常：' + error.message, 'error');
                if (streamingDiv) {
                    streamingDiv.innerHTML = introText + '<br><br><div style="color: red;">三元组提取异常: ' + error.message + '</div>';
                }
                isGenerating = false;
                resetGenerateButtons();
                return;
            }
            
            const step2Duration = ((performance.now() - step2Start) / 1000).toFixed(2) + 's';
            
            if (!tripleResult || !tripleResult.success || !tripleResult.triples || tripleResult.triples.length === 0) {
                console.error('❌ 三元组提取失败，详细信息:', tripleResult);
                updateProcessStatus(2, 'error');
                const errorMsg = tripleResult?.message || tripleResult?.error || '未知错误';
                showMessage('三元组提取失败：' + errorMsg, 'error');
                if (streamingDiv) {
                    let errorHtml = introText + '<br><br><div style="color: #dc3545; background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">';
                    errorHtml += '<strong>❌ 三元组提取失败</strong><br><br>';
                    errorHtml += '<div style="color: #333;">' + errorMsg + '</div>';
                    
                    // 如果有原始响应，显示出来供调试
                    if (tripleResult?.rawResponse) {
                        errorHtml += '<br><details style="cursor: pointer;"><summary style="color: #666;">查看AI原始响应（用于调试）</summary>';
                        const escapedResponse = tripleResult.rawResponse
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                        errorHtml += '<pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 12px;">' + 
                                     escapedResponse + '</pre>';
                        errorHtml += '</details>';
                    }
                    
                    errorHtml += '</div>';
                    streamingDiv.innerHTML = errorHtml;
                }
                isGenerating = false;
                resetGenerateButtons();
                return;
            }
            
            console.log('三元组提取成功，数量:', tripleResult.triples.length, '三元组列表:', tripleResult.triples);
            updateProcessStatus(2, 'completed', step2Duration);
            
            // 恢复原始介绍文本，移除"正在提取三元组..."的提示
            if (streamingDiv) {
                streamingDiv.textContent = introText;
            }
            
            // === 步骤3：概念图的生成（数据处理+渲染） ===
            const step3Start = performance.now();
            updateProcessStatus(3, 'active');
            
            // 将三元组转换为概念图数据
            console.log('开始将三元组转换为概念图数据...');
            const conceptData = window.convertTriplesToConceptData(tripleResult.triples);
            console.log('概念图数据转换完成:', conceptData);
            
            const graphData = window.convertToD3Format(conceptData);
            console.log('D3格式数据转换完成:', graphData);
            
            // 渲染概念图
            displayConceptMap(graphData);
            
            // 更新显示信息
            updateGenerationInfo(type, data, conceptData, introResult.text, '');
            
            const step3Duration = ((performance.now() - step3Start) / 1000).toFixed(2) + 's';
            updateProcessStatus(3, 'completed', step3Duration);
            
            // === 步骤4：完成 ===
            const totalDuration = ((performance.now() - totalStartTime) / 1000).toFixed(2) + 's';
            updateProcessStatus(4, 'completed', totalDuration);
            
            showMessage('概念图生成完成！', 'success');
            
        } else {
            // 文本分析模式，保持原有流程
            const step1Start = performance.now();
            updateProcessStatus(1, 'active');
            
            const result = await window.llmManager.generateConceptMap(type, data);
            
            const step1Duration = ((performance.now() - step1Start) / 1000).toFixed(2) + 's';
            
            if (result.success) {
                console.log('文本内容生成成功');
                updateProcessStatus(1, 'completed', step1Duration);
                
                const step2Start = performance.now();
                updateProcessStatus(2, 'active');
                
                const conceptData = result.data;
                const graphData = window.convertToD3Format(conceptData);
                
                const step2Duration = ((performance.now() - step2Start) / 1000).toFixed(2) + 's';
                updateProcessStatus(2, 'completed', step2Duration);
                
                const step3Start = performance.now();
                updateProcessStatus(3, 'active');
                
                displayConceptMap(graphData);
                updateGenerationInfo(type, data, conceptData, result.aiResponse, result.aiDescription);
                
                const step3Duration = ((performance.now() - step3Start) / 1000).toFixed(2) + 's';
                updateProcessStatus(3, 'completed', step3Duration);
                
                const totalDuration = ((performance.now() - totalStartTime) / 1000).toFixed(2) + 's';
                updateProcessStatus(5, 'completed', totalDuration);
                
                showMessage(result.message, 'success');
            } else {
                console.error('概念图生成失败:', result.error);
                let errorStep = 1;
                if (result.error && result.error.includes('解析')) {
                    errorStep = 2;
                }
                updateProcessStatus(errorStep, 'error');
                showMessage(result.message, 'warning');
                updateErrorState(type, result.message);
            }
        }
        
    } catch (error) {
        console.error('生成过程出错:', error);
        updateProcessStatus(1, 'error'); // 标记为概念图文本内容生成阶段错误
        showMessage('生成失败，请稍后重试', 'warning');
    } finally {
        isGenerating = false;
        hideLoadingState();
        resetGenerateButtons();
    }
}

function generateFocusQuestion(type, data) {
    let focusQuestion = '';
    if (type === 'keyword') {
        // 焦点问题模式
        const keyword = data.keyword;
        // 完整显示焦点问题，不使用省略号
        focusQuestion = `焦点问题：${keyword}是什么？`;
    } else {
        // 文本分析模式
        const textContent = data.description;
        // 提取核心概念
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
}

function clearPreviousConceptMap() {
    console.log('开始清除之前的概念图内容...');
    
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
    }
    
    // 清除焦点问题
    window.focusQuestion = null;
    
    // 清空当前图数据
    currentGraphData = { nodes: [], links: [] };
    
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
    
    console.log('概念图内容清除完成');
}

//=============================================================================
// DOM初始化和事件绑定
//=============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始获取元素...');
    
    // 初始化大模型交互模块
    if (window.llmManager) {
        window.llmManager.init();
        console.log('大模型交互模块已初始化');
    } else {
        console.error('大模型交互模块未找到');
    }
    
    // 获取DOM元素并设为全局变量（让所有模块都能访问）
    window.keywordInput = document.getElementById('keyword');
    window.descriptionTextarea = document.getElementById('description');
    window.keywordBtn = document.getElementById('generateKeywordBtn');
    window.descriptionBtn = document.getElementById('generateDescriptionBtn');
    window.resetBtn = document.getElementById('resetViewBtn');
    window.exportBtn = document.getElementById('exportImageBtn');
    window.graphPlaceholder = document.querySelector('.graph-placeholder');
    window.aiIntroText = document.getElementById('aiIntroText');
    
    console.log('基本元素获取结果:');
    console.log('keywordInput:', window.keywordInput);
    console.log('descriptionTextarea:', window.descriptionTextarea);
    console.log('keywordBtn:', window.keywordBtn);
    console.log('descriptionBtn:', window.descriptionBtn);
    console.log('resetBtn:', window.resetBtn);
    console.log('exportBtn:', window.exportBtn);
    console.log('graphPlaceholder:', window.graphPlaceholder);
    
    // 编辑工具栏元素（全局）
    window.editToolbar = document.querySelector('.edit-toolbar');
    window.addNodeBtn = document.getElementById('addNodeBtn');
    window.deleteNodeBtn = document.getElementById('deleteNodeBtn');
    window.editNodeBtn = document.getElementById('editNodeBtn');
    window.addLinkBtn = document.getElementById('addLinkBtn');
    window.deleteLinkBtn = document.getElementById('deleteLinkBtn');
    window.editLinkBtn = document.getElementById('editLinkBtn');
    window.layoutSelect = document.getElementById('layoutSelect');
    window.autoLayoutBtn = document.getElementById('autoLayoutBtn');
    window.nodeColorPicker = document.getElementById('nodeColorPicker');
    window.linkColorPicker = document.getElementById('linkColorPicker');
    window.nodeShapeSelect = document.getElementById('nodeShapeSelect');
    
    console.log('编辑工具栏元素获取结果:');
    console.log('editToolbar:', window.editToolbar);
    console.log('addNodeBtn:', window.addNodeBtn);
    console.log('deleteNodeBtn:', window.deleteNodeBtn);
    console.log('editNodeBtn:', window.editNodeBtn);
    console.log('addLinkBtn:', window.addLinkBtn);
    console.log('deleteLinkBtn:', window.deleteLinkBtn);
    console.log('editLinkBtn:', window.editLinkBtn);
    console.log('layoutSelect:', window.layoutSelect);
    console.log('autoLayoutBtn:', window.autoLayoutBtn);
    console.log('nodeColorPicker:', window.nodeColorPicker);
    console.log('linkColorPicker:', window.linkColorPicker);
    console.log('nodeShapeSelect:', window.nodeShapeSelect);
    
    // 当前流程元素（全局）
    window.processText = document.getElementById('processText');
    
    console.log('当前流程元素获取结果:');
    console.log('processText:', window.processText);
    
    // 状态栏元素（全局）
    window.nodeCountSpan = document.getElementById('nodeCount');
    window.linkCountSpan = document.getElementById('linkCount');
    window.downloadBtn = document.getElementById('downloadBtn');
    window.loadBtn = document.getElementById('loadBtn');
    window.undoBtn = document.getElementById('undoBtn');
    window.redoBtn = document.getElementById('redoBtn');
    
    console.log('状态栏元素获取结果:');
    console.log('nodeCountSpan:', window.nodeCountSpan);
    console.log('linkCountSpan:', window.linkCountSpan);
    console.log('downloadBtn:', window.downloadBtn);
    console.log('loadBtn:', window.loadBtn);
    console.log('undoBtn:', window.undoBtn);
    console.log('redoBtn:', window.redoBtn);

    //=============================================================================
    // 事件监听器绑定
    //=============================================================================
    
    // 焦点问题生成概念图事件
    if (window.keywordBtn) {
        window.keywordBtn.addEventListener('click', function() {
            console.log('焦点问题生成按钮被点击');
            const keyword = window.keywordInput.value.trim();
            if (!keyword) {
                showMessage('请输入焦点问题', 'warning');
                return;
            }
            
            // 设置按钮加载状态
            window.keywordBtn.classList.add('loading');
            window.keywordBtn.textContent = '生成中...';
            window.keywordBtn.disabled = true;
            
            console.log('开始生成概念图，焦点问题:', keyword);
            generateConceptMapWithLLM('keyword', { keyword: keyword });
        });
    }

    // 文本分析生成概念图事件
    if (window.descriptionBtn) {
        window.descriptionBtn.addEventListener('click', function() {
            console.log('文本分析按钮被点击');
            const description = window.descriptionTextarea.value.trim();
            if (!description) {
                showMessage('请输入描述文本', 'warning');
                return;
            }
            
            // 设置按钮加载状态
            window.descriptionBtn.classList.add('loading');
            window.descriptionBtn.textContent = '生成中...';
            window.descriptionBtn.disabled = true;
            
            console.log('开始生成概念图，描述:', description);
            generateConceptMapWithLLM('description', { description: description });
        });
    }

    // 重置视图按钮事件
    if (window.resetBtn) {
        window.resetBtn.addEventListener('click', function() {
            console.log('重置视图按钮被点击');
            resetView();
        });
    }

    // 导出图片按钮事件
    if (window.exportBtn) {
        window.exportBtn.addEventListener('click', function() {
            console.log('导出图片按钮被点击');
            exportConceptMap();
        });
    }

    // 编辑工具栏事件绑定
    if (window.addNodeBtn) {
        window.addNodeBtn.addEventListener('click', function() {
            console.log('添加节点按钮被点击');
            addNewNode();
        });
    }

    if (window.deleteNodeBtn) {
        window.deleteNodeBtn.addEventListener('click', function() {
            console.log('删除节点按钮被点击');
            deleteSelectedNode();
        });
    }

    if (window.editNodeBtn) {
        window.editNodeBtn.addEventListener('click', function() {
            console.log('编辑节点按钮被点击');
            editSelectedNode();
        });
    }

    if (window.addLinkBtn) {
        window.addLinkBtn.addEventListener('click', function() {
            console.log('添加连线按钮被点击');
            addNewLink();
        });
    }

    if (window.deleteLinkBtn) {
        window.deleteLinkBtn.addEventListener('click', function() {
            console.log('删除连线按钮被点击');
            deleteSelectedLink();
        });
    }

    if (window.editLinkBtn) {
        window.editLinkBtn.addEventListener('click', function() {
            console.log('编辑连线按钮被点击');
            editSelectedLink();
        });
    }

    if (window.layoutSelect) {
        window.layoutSelect.addEventListener('change', function() {
            console.log('布局选择改变:', window.layoutSelect.value);
            changeLayout(window.layoutSelect.value);
        });
    }

    if (window.autoLayoutBtn) {
        window.autoLayoutBtn.addEventListener('click', function() {
            console.log('自动布局按钮被点击');
            applyAutoLayout();
        });
    }

    if (window.nodeColorPicker) {
        window.nodeColorPicker.addEventListener('input', function() {
            console.log('节点颜色改变:', window.nodeColorPicker.value);
            changeNodeColor(window.nodeColorPicker.value);
        });
    }

    if (window.linkColorPicker) {
        window.linkColorPicker.addEventListener('input', function() {
            console.log('连线颜色改变:', window.linkColorPicker.value);
            changeLinkColor(window.linkColorPicker.value);
        });
    }

    if (window.nodeShapeSelect) {
        window.nodeShapeSelect.addEventListener('change', function() {
            console.log('节点形状改变:', window.nodeShapeSelect.value);
            changeNodeShape(window.nodeShapeSelect.value);
        });
    }

    // 状态栏按钮事件
    if (window.downloadBtn) {
        window.downloadBtn.addEventListener('click', function() {
            console.log('下载图片按钮被点击');
            downloadConceptMapImage();
        });
    }

    if (window.loadBtn) {
        window.loadBtn.addEventListener('click', function() {
            console.log('加载数据按钮被点击');
            loadConceptMap();
        });
    }

    if (window.undoBtn) {
        window.undoBtn.addEventListener('click', function() {
            console.log('撤销按钮被点击');
            undoOperation();
        });
    }

    if (window.redoBtn) {
        window.redoBtn.addEventListener('click', function() {
            console.log('重做按钮被点击');
            redoOperation();
        });
    }

    // 初始化页面
    initializePage();
});

