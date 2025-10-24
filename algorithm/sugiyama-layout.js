// Sugiyama层次布局算法模块
// 包含完整的Sugiyama算法实现，用于绘制层次结构的概念图

/**
 * 应用每层节点数量限制（最多4个节点）
 * @param {Map} levels - 层次Map，键为层次编号，值为该层的节点数组
 * @returns {Map} 应用限制后的层次Map
 */
function applyLayerNodeLimit(levels) {
    console.log('应用每层节点数量限制（最多4个节点）...');
    
    const maxNodesPerLayer = 4;
    const newLevels = new Map();
    let currentLevelIndex = 0;
    
    levels.forEach((levelNodes, originalLevel) => {
        console.log(`处理第${originalLevel}层，节点数量: ${levelNodes.length}`);
        
        if (levelNodes.length <= maxNodesPerLayer) {
            // 如果节点数量不超过限制，直接使用
            newLevels.set(currentLevelIndex, levelNodes);
            console.log(`第${originalLevel}层节点数量(${levelNodes.length})未超限，分配到第${currentLevelIndex}层`);
            currentLevelIndex++;
        } else {
            // 如果节点数量超过限制，需要分流到多个层级
            console.log(`第${originalLevel}层节点数量(${levelNodes.length})超限，开始分流...`);
            
            // 对节点进行智能分组，优先保持相关性
            const nodeGroups = intelligentNodeGrouping(levelNodes, maxNodesPerLayer);
            
            // 将分组后的节点分配到不同层级
            nodeGroups.forEach((group, groupIndex) => {
                newLevels.set(currentLevelIndex + groupIndex, group);
                console.log(`分组${groupIndex + 1}(${group.length}个节点)分配到第${currentLevelIndex + groupIndex}层:`, group.map(n => n.label));
            });
            
            currentLevelIndex += nodeGroups.length;
        }
    });
    
    console.log(`层级限制应用完成，原${levels.size}层扩展为${newLevels.size}层`);
    return newLevels;
}

/**
 * 智能节点分组算法 - 保持相关节点在同一层
 * @param {Array} nodes - 节点数组
 * @param {number} maxNodesPerGroup - 每组最大节点数
 * @returns {Array} 分组后的节点数组
 */
function intelligentNodeGrouping(nodes, maxNodesPerGroup) {
    console.log(`开始智能分组，节点数量: ${nodes.length}，每组最大: ${maxNodesPerGroup}`);
    
    if (nodes.length <= maxNodesPerGroup) {
        return [nodes];
    }
    
    const groups = [];
    const remainingNodes = [...nodes];
    
    // 优先策略1：按节点重要性分组（如果有importance属性）
    remainingNodes.sort((a, b) => {
        const importanceA = a.importance || 5;
        const importanceB = b.importance || 5;
        // 先按重要性排序，重要性相同的按标签长度排序
        if (importanceA !== importanceB) {
            return importanceB - importanceA; // 重要性高的在前
        }
        const lengthA = (a.label || '').length;
        const lengthB = (b.label || '').length;
        return lengthA - lengthB; // 标签短的在前
    });
    
    while (remainingNodes.length > 0) {
        const currentGroup = [];
        
        // 每组取最多maxNodesPerGroup个节点
        for (let i = 0; i < maxNodesPerGroup && remainingNodes.length > 0; i++) {
            currentGroup.push(remainingNodes.shift());
        }
        
        groups.push(currentGroup);
        console.log(`创建分组${groups.length}，包含${currentGroup.length}个节点:`, currentGroup.map(n => n.label));
    }
    
    console.log(`智能分组完成，共创建${groups.length}个分组`);
    return groups;
}

/**
 * Sugiyama算法步骤1: 层次分配 - 支持基于layer属性的三层结构
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 * @returns {Map} 层次Map
 */
function assignLayers(nodes, links) {
    console.log('步骤1: 层次分配...');
    
    const levels = new Map();
    
    // 检查节点是否有layer属性
    const hasLayerInfo = nodes.some(node => node.layer !== undefined);
    
    if (hasLayerInfo) {
        // 使用节点的layer属性进行分层
        console.log('检测到节点包含layer属性，使用layer属性进行分层');
        
        // 按layer属性分组
        const layer1Nodes = nodes.filter(node => node.layer === 1);
        const layer2Nodes = nodes.filter(node => node.layer === 2);
        const layer3Nodes = nodes.filter(node => node.layer === 3);
        const otherNodes = nodes.filter(node => !node.layer || (node.layer !== 1 && node.layer !== 2 && node.layer !== 3));
        
        console.log('基于layer属性的层次分配:');
        console.log('  第一层节点数:', layer1Nodes.length, layer1Nodes.map(n => n.label));
        console.log('  第二层节点数:', layer2Nodes.length, layer2Nodes.map(n => n.label));
        console.log('  第三层节点数:', layer3Nodes.length, layer3Nodes.map(n => n.label));
        
        if (layer1Nodes.length > 0) {
            levels.set(0, layer1Nodes);
        }
        if (layer2Nodes.length > 0) {
            levels.set(1, layer2Nodes);
        }
        if (layer3Nodes.length > 0) {
            levels.set(2, layer3Nodes);
        }
        if (otherNodes.length > 0) {
            // 将没有layer信息的节点放在最后一层
            levels.set(3, otherNodes);
        }
        
        // 应用每层节点数量限制（最多4个节点）
        const limitedLevels = applyLayerNodeLimit(levels);
        
        console.log(`基于layer属性的层次分配完成，共${limitedLevels.size}层`);
        return limitedLevels;
    }
    
    // 如果没有layer属性，使用原有的BFS算法
    console.log('节点不包含layer属性，使用BFS算法进行分层');
    
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
    
    // 新增：应用每层节点数量限制（最多4个节点）
    const limitedLevels = applyLayerNodeLimit(levels);
    
    console.log(`层次分配完成，共${limitedLevels.size}层，第一级节点:`, firstLevelNodes.map(n => n.label));
    return limitedLevels;
}

/**
 * Sugiyama算法步骤2: 节点排序（减少交叉）
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 * @param {Map} levels - 层次Map
 * @returns {Map} 排序后的层次Map
 */
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

/**
 * 重心排序算法
 * @param {Array} levelNodes - 层次中的节点数组
 * @param {Array} links - 连线数组
 * @param {Map} nodeMap - 节点Map
 * @param {number} level - 层次编号
 * @returns {Array} 排序后的节点数组
 */
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

/**
 * 优化节点顺序，减少连线交叉
 * @param {Array} levelNodes - 层次中的节点数组
 * @param {Array} links - 连线数组
 * @param {Map} nodeMap - 节点Map
 * @param {number} level - 层次编号
 * @returns {Array} 优化后的节点数组
 */
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

/**
 * 计算连线交叉数
 * @param {Array} levelNodes - 层次中的节点数组
 * @param {Array} links - 连线数组
 * @param {Map} nodeMap - 节点Map
 * @param {number} level - 层次编号
 * @returns {number} 交叉数
 */
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

/**
 * 检查两条连线是否交叉
 * @param {Object} linkA - 连线A
 * @param {Object} linkB - 连线B
 * @param {Map} nodeMap - 节点Map
 * @returns {boolean} 是否交叉
 */
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

/**
 * Sugiyama算法步骤3: 坐标分配 - 严格三层布局，层间距相同，居中显示，四周间距相同
 * @param {Array} nodes - 节点数组
 * @param {Map} orderedLevels - 排序后的层次Map
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
function assignCoordinates(nodes, orderedLevels, width, height) {
    console.log('步骤3: 严格三层布局坐标分配...');
    
    // 分别设置左右和上下边距
    const horizontalMargin = 20; // 左右边距：最小化以充分利用宽度
    const verticalMargin = 80; // 上下边距：保持较大间距
    
    // 计算可用的布局区域
    const availableWidth = width - 2 * horizontalMargin;
    const availableHeight = height - 2 * verticalMargin;
    
    // 获取实际的层数（确保是三层）
    const actualLayers = orderedLevels.size;
    console.log(`实际层数: ${actualLayers}`);
    
    // 严格按照三层来布局
    // 第一层: 焦点问题下方，留小间距
    // 第二层和第三层: 均匀分布，间距更大
    
    // 焦点问题框的位置和尺寸
    const focusQuestionTop = 40; // 与renderer.js中的topMargin保持一致
    const focusQuestionHeight = 60;
    const focusQuestionBottom = focusQuestionTop + focusQuestionHeight;
    
    // 第一层距离焦点问题框的间距（缩短）
    const layer1ToFocusSpacing = 50;
    
    // 第一层的Y坐标
    const layer1Y = focusQuestionBottom + layer1ToFocusSpacing;
    
    // 层与层之间的统一间距（缩短）
    const layerSpacing = 140; // 固定层间距，使布局更紧凑
    
    console.log(`焦点问题底部: ${focusQuestionBottom}px`);
    console.log(`第一层Y: ${layer1Y.toFixed(2)}px`);
    console.log(`层间距: ${layerSpacing}px（固定间距，布局更紧凑）`);
    console.log(`可用宽度: ${availableWidth}px, 可用高度: ${availableHeight}px`);
    
    // 遍历每一层，分配坐标
    orderedLevels.forEach((levelNodes, level) => {
        // 计算当前层的Y坐标（使用统一的固定间距）
        let y;
        if (level === 0) {
            // 第一层：焦点问题下方
            y = layer1Y;
        } else if (level === 1) {
            // 第二层：第一层下方
            y = layer1Y + layerSpacing;
        } else {
            // 第三层：第二层下方
            y = layer1Y + layerSpacing * 2;
        }
        
        console.log(`第${level + 1}层, Y坐标: ${y.toFixed(2)}, 节点数: ${levelNodes.length}`);
        
        // 计算该层所有节点的总宽度和间距
        const nodeWidths = levelNodes.map(node => {
            const nodeDimensions = window.calculateNodeDimensions(node.label || '', 100, 50, 25);
            return node.width || nodeDimensions.width;
        });
        
        // 布局策略：使用固定的最小节点间距，确保节点和文字不重叠
        if (levelNodes.length === 1) {
            // 单个节点：严格居中
            levelNodes[0].x = width / 2;
            levelNodes[0].y = y;
            console.log(`  节点 "${levelNodes[0].label}": (${levelNodes[0].x.toFixed(2)}, ${levelNodes[0].y.toFixed(2)})`);
        } else {
            // 多个节点：充分利用整个可用宽度，向两侧扩展
            const totalNodeWidth = nodeWidths.reduce((sum, w) => sum + w, 0);
            
            // 计算可用于节点间距的总空间
            const availableSpacingWidth = availableWidth - totalNodeWidth;
            
            // 计算节点间距（均匀分配可用空间）
            const nodeSpacing = availableSpacingWidth / (levelNodes.length - 1);
            
            // 设置最小间距以确保不会太挤
            const minSpacing = 100; // 最小节点间距
            const finalSpacing = Math.max(nodeSpacing, minSpacing);
            
            console.log(`第${level + 1}层布局: 节点总宽=${totalNodeWidth.toFixed(2)}px, 可用空间=${availableSpacingWidth.toFixed(2)}px, 节点间距=${finalSpacing.toFixed(2)}px`);
            
            // 如果间距太小，使用最小间距并从左边界开始布局
            if (nodeSpacing < minSpacing) {
                console.warn(`⚠️ 第${level + 1}层空间不足，使用最小间距${minSpacing}px`);
                let currentX = horizontalMargin + nodeWidths[0] / 2;
                
                levelNodes.forEach((node, index) => {
                    node.x = currentX;
                    node.y = y;
                    console.log(`  节点 "${node.label}": X=${node.x.toFixed(2)}, Y=${node.y.toFixed(2)}`);
                    
                    if (index < levelNodes.length - 1) {
                        currentX += nodeWidths[index] / 2 + minSpacing + nodeWidths[index + 1] / 2;
                    }
                });
            } else {
                // 空间充足：从左边界开始，充分利用整个宽度
                // 第一个节点紧靠左边界，最后一个节点紧靠右边界
                let currentX = horizontalMargin + nodeWidths[0] / 2;
                
                levelNodes.forEach((node, index) => {
                    node.x = currentX;
                    node.y = y;
                    console.log(`  节点 "${node.label}": X=${node.x.toFixed(2)}, Y=${node.y.toFixed(2)}`);
                    
                    if (index < levelNodes.length - 1) {
                        // 使用均匀间距，充分利用整个宽度
                        currentX += nodeWidths[index] / 2 + finalSpacing + nodeWidths[index + 1] / 2;
                    }
                });
                
                // 验证最后一个节点是否接近右边界
                const lastNode = levelNodes[levelNodes.length - 1];
                const lastNodeRightEdge = lastNode.x + nodeWidths[nodeWidths.length - 1] / 2;
                const rightBoundary = width - horizontalMargin;
                console.log(`  最后节点右边缘: ${lastNodeRightEdge.toFixed(2)}px, 右边界: ${rightBoundary.toFixed(2)}px, 差距: ${(rightBoundary - lastNodeRightEdge).toFixed(2)}px`);
            }
            
            // 验证节点间距
            for (let i = 0; i < levelNodes.length - 1; i++) {
                const node1 = levelNodes[i];
                const node2 = levelNodes[i + 1];
                const width1 = nodeWidths[i];
                const width2 = nodeWidths[i + 1];
                
                const centerDistance = node2.x - node1.x;
                const edgeToEdgeDistance = centerDistance - width1 / 2 - width2 / 2;
                
                console.log(`  节点间距: "${node1.label}" 到 "${node2.label}": 中心距=${centerDistance.toFixed(2)}px, 边缘距=${edgeToEdgeDistance.toFixed(2)}px`);
            }
        }
    });
    
    // 注释掉：不再强制节点间距统一，只保证同层节点Y坐标相同
    // detectAndResolveOverlaps(nodes, orderedLevels, width, availableWidth);
    
    console.log('三层布局坐标分配完成（同层节点Y坐标相同，自然分布）');
}

/**
 * 检测并解决节点重叠问题
 * @param {Array} nodes - 节点数组
 * @param {Map} orderedLevels - 排序后的层次Map
 * @param {number} canvasWidth - 画布总宽度
 * @param {number} availableWidth - 可用宽度
 */
function detectAndResolveOverlaps(nodes, orderedLevels, canvasWidth, availableWidth) {
    console.log('检测并解决节点重叠...');
    
    let overlapCount = 0;
    const minSpacing = 50; // 最小安全间距
    
    // 使用画布中心
    const canvasCenter = canvasWidth / 2;
    
    console.log(`画布宽度: ${canvasWidth.toFixed(2)}px, 可用宽度: ${availableWidth.toFixed(2)}px, 中心点: ${canvasCenter.toFixed(2)}px`);
    
    // 检查同一层内的节点是否重叠
    orderedLevels.forEach((levelNodes, level) => {
        if (levelNodes.length <= 1) return;
        
        // 按X坐标排序，确保顺序正确
        levelNodes.sort((a, b) => a.x - b.x);
        
        // 计算所有节点的宽度
        const nodeWidths = levelNodes.map(node => {
            const dims = window.calculateNodeDimensions(node.label || '', 140, 70, 40);
            return node.width || dims.width;
        });
        
        // 检查是否存在重叠或间距不均
        let hasOverlap = false;
        let hasUnevenSpacing = false;
        const spacings = [];
        
        for (let i = 0; i < levelNodes.length - 1; i++) {
            const node1 = levelNodes[i];
            const node2 = levelNodes[i + 1];
            
            const width1 = nodeWidths[i];
            const width2 = nodeWidths[i + 1];
            
            // 计算实际间距（节点中心到中心）
            const actualSpacing = node2.x - node1.x;
            const requiredSpacing = width1 / 2 + width2 / 2 + minSpacing;
            
            spacings.push(actualSpacing);
            
            // 检查是否重叠
            if (actualSpacing < requiredSpacing) {
                hasOverlap = true;
                overlapCount++;
                console.warn(`第${level + 1}层节点 "${node1.label}" 和 "${node2.label}" 间距不足: ${actualSpacing.toFixed(2)}px < ${requiredSpacing.toFixed(2)}px`);
            }
        }
        
        // 检查边缘间距是否均匀（容差10px）
        const edgeSpacings = [];
        for (let i = 0; i < levelNodes.length - 1; i++) {
            const node1 = levelNodes[i];
            const node2 = levelNodes[i + 1];
            const width1 = nodeWidths[i];
            const width2 = nodeWidths[i + 1];
            
            // 计算边缘到边缘的间距
            const edgeSpacing = (node2.x - width2 / 2) - (node1.x + width1 / 2);
            edgeSpacings.push(edgeSpacing);
        }
        
        if (edgeSpacings.length > 1) {
            const avgEdgeSpacing = edgeSpacings.reduce((a, b) => a + b, 0) / edgeSpacings.length;
            const maxDiff = Math.max(...edgeSpacings.map(s => Math.abs(s - avgEdgeSpacing)));
            if (maxDiff > 10) {
                hasUnevenSpacing = true;
                console.warn(`第${level + 1}层节点边缘间距不均匀: 平均${avgEdgeSpacing.toFixed(2)}px, 最大偏差${maxDiff.toFixed(2)}px`);
                console.log(`  边缘间距分布: [${edgeSpacings.map(s => s.toFixed(2)).join(', ')}]`);
            }
        }
        
        // 如果存在重叠或间距不均，重新均匀分布该层所有节点
        if (hasOverlap || hasUnevenSpacing) {
            if (hasOverlap) {
                console.log(`⚠️ 第${level + 1}层存在节点重叠，开始重新分布`);
            } else {
                console.log(`⚠️ 第${level + 1}层间距不均匀，开始重新分布`);
            }
            
            // 计算总节点宽度
            const totalNodeWidth = nodeWidths.reduce((sum, w) => sum + w, 0);
            
            // 方案1: 尝试使用可用宽度
            let spacing = (availableWidth - totalNodeWidth) / (levelNodes.length - 1);
            
            // 如果计算出的间距小于最小间距，使用最小间距并扩展布局宽度
            if (spacing < minSpacing) {
                console.log(`  计算间距${spacing.toFixed(2)}px < 最小间距${minSpacing}px，使用最小间距`);
                spacing = minSpacing;
            }
            
            // 计算实际布局宽度
            const layoutWidth = totalNodeWidth + spacing * (levelNodes.length - 1);
            
            console.log(`  总节点宽度: ${totalNodeWidth.toFixed(2)}px`);
            console.log(`  统一间距: ${spacing.toFixed(2)}px`);
            console.log(`  布局总宽度: ${layoutWidth.toFixed(2)}px`);
            
            // 计算起始X坐标（以画布中心为基准，确保居中）
            let currentX = canvasCenter - layoutWidth / 2 + nodeWidths[0] / 2;
            
            // 重新分配X坐标，确保每个节点之间的间距完全相同
            levelNodes.forEach((node, index) => {
                const oldX = node.x;
                node.x = currentX;
                console.log(`  节点${index + 1} "${node.label}": ${oldX.toFixed(2)} -> ${node.x.toFixed(2)}`);
                
                // 移动到下一个节点位置（使用统一的间距）
                if (index < levelNodes.length - 1) {
                    currentX += nodeWidths[index] / 2 + spacing + nodeWidths[index + 1] / 2;
                }
            });
            
            // 验证边缘间距是否均匀
            console.log(`  验证边缘间距：`);
            for (let i = 0; i < levelNodes.length - 1; i++) {
                const node1 = levelNodes[i];
                const node2 = levelNodes[i + 1];
                const width1 = nodeWidths[i];
                const width2 = nodeWidths[i + 1];
                const edgeSpacing = (node2.x - width2 / 2) - (node1.x + width1 / 2);
                console.log(`    节点${i + 1}-节点${i + 2}: ${edgeSpacing.toFixed(2)}px (统一间距应为${spacing.toFixed(2)}px)`);
            }
            
            console.log(`✓ 第${level + 1}层节点重新分布完成，间距已统一为${spacing.toFixed(2)}px`);
        } else {
            console.log(`✓ 第${level + 1}层节点间距正常，无需调整`);
        }
    });
    
    if (overlapCount === 0) {
        console.log('✓ 未检测到节点重叠');
    } else {
        console.log(`✓ 检测并解决了 ${overlapCount} 处节点重叠`);
    }
}


/**
 * 调整SVG viewBox，确保所有节点和连线都在可视范围内
 * @param {Array} nodes - 节点数组
 * @param {number} baseWidth - 基础宽度
 * @param {number} baseHeight - 基础高度
 */
function adjustViewBox(nodes, baseWidth, baseHeight) {
    if (!nodes || nodes.length === 0) return;
    
    // 分别设置左右和上下边距，与assignCoordinates保持一致
    const horizontalMargin = 20; // 左右边距：最小化
    const verticalMargin = 80; // 上下边距：保持较大
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        const nodeDimensions = window.calculateNodeDimensions(node.label || '', 100, 50, 25);
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
                const sourceDimensions = calculateNodeDimensions(source.label || '', 100, 50, 25);
                const targetDimensions = calculateNodeDimensions(target.label || '', 100, 50, 25);
                
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
                const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
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
    
    // 分别处理左右和上下边界间距，确保所有元素都在可视范围内
    minX = Math.max(0, minX - horizontalMargin);
    minY = Math.max(0, minY - verticalMargin);
    maxX = Math.min(baseWidth, maxX + horizontalMargin);
    maxY = Math.min(baseHeight, maxY + verticalMargin);
    
    // 计算新的viewBox
    const newWidth = maxX - minX;
    const newHeight = maxY - minY;
    
    // 确保viewBox宽度至少等于画布宽度，充分利用整个显示区域
    const finalWidth = Math.max(baseWidth, newWidth, 600);
    const finalHeight = Math.max(newHeight, 400);
    
    // 如果实际内容宽度小于画布宽度，调整minX使内容居中
    if (newWidth < baseWidth) {
        const widthDiff = baseWidth - newWidth;
        minX = Math.max(0, minX - widthDiff / 2);
    }
    
    // 更新SVG的viewBox
    const svg = document.querySelector('.concept-graph');
    if (svg) {
        svg.setAttribute('viewBox', `${minX} ${minY} ${finalWidth} ${finalHeight}`);
        console.log(`ViewBox已调整: ${minX} ${minY} ${finalWidth} ${finalHeight}`);
        console.log(`节点边界: (${minX}, ${minY}) - (${maxX}, ${maxY})`);
        console.log(`画布尺寸: ${baseWidth} x ${baseHeight}`);
    }
}

// ==================== 连线路由优化算法 ====================
// 以下函数用于优化连线路由，避免重叠和文字标签重叠

/**
 * 优化连线路由，避免重叠和文字标签重叠
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 */
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
    // 注释掉：该功能已在 assignCoordinates 和 detectAndResolveOverlaps 中实现
    // ensureUniformSpacing(nodes, links);
}

/**
 * 检测连线是否相交
 * @param {Object} linkA - 连线A
 * @param {Object} linkB - 连线B
 * @param {Array} nodes - 节点数组
 * @returns {boolean} 是否相交
 */
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

/**
 * 检测连接线是否与节点重叠
 * @param {Object} link - 连线对象
 * @param {Array} nodes - 节点数组
 * @returns {Object} 重叠检测结果
 */
function hasLinkNodeOverlap(link, nodes) {
    const source = nodes.find(n => n.id === link.source);
    const target = nodes.find(n => n.id === link.target);
    
    if (!source || !target) return false;
    
    // 计算连接线的起点和终点（节点边缘）
    const sourceDimensions = calculateNodeDimensions(source.label || '', 100, 50, 25);
    const targetDimensions = calculateNodeDimensions(target.label || '', 100, 50, 25);
    
    const sourceWidth = source.width || sourceDimensions.width;
    const sourceHeight = source.height || sourceDimensions.height;
    const targetWidth = target.width || targetDimensions.width;
    const targetHeight = target.height || targetDimensions.height;
    
    // 判断节点间的层次关系
    const isHierarchical = window.isHierarchicalConnection(source, target, nodes, [link]);
    
    let startX, startY, endX, endY;
    
    if (isHierarchical) {
        // 层次连接：下级节点连接到上级节点的下面
        if (target.y > source.y) {
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
    } else {
        // 同级连接：连接到节点的左右
        const dx = target.x - source.x;
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
    }
    
    // 检查连接线是否与其他节点重叠
    for (const node of nodes) {
        if (node.id === link.source || node.id === link.target) continue;
        
        const nodeDimensions = window.calculateNodeDimensions(node.label || '', 100, 50, 25);
        const nodeWidth = node.width || nodeDimensions.width;
        const nodeHeight = node.height || nodeDimensions.height;
        
        // 检查线段与矩形是否相交
        if (lineRectIntersect(startX, startY, endX, endY, 
            node.x - nodeWidth / 2, node.y - nodeHeight / 2, 
            nodeWidth, nodeHeight)) {
            return { hasOverlap: true, overlappingNode: node };
        }
    }
    
    return { hasOverlap: false };
}

/**
 * 检测线段与矩形是否相交
 * @param {number} lineStartX - 线段起点X
 * @param {number} lineStartY - 线段起点Y
 * @param {number} lineEndX - 线段终点X
 * @param {number} lineEndY - 线段终点Y
 * @param {number} rectX - 矩形X坐标
 * @param {number} rectY - 矩形Y坐标
 * @param {number} rectWidth - 矩形宽度
 * @param {number} rectHeight - 矩形高度
 * @returns {boolean} 是否相交
 */
function lineRectIntersect(lineStartX, lineStartY, lineEndX, lineEndY, 
                          rectX, rectY, rectWidth, rectHeight) {
    // 检查线段的两个端点是否在矩形内
    if (pointInRect(lineStartX, lineStartY, rectX, rectY, rectWidth, rectHeight) ||
        pointInRect(lineEndX, lineEndY, rectX, rectY, rectWidth, rectHeight)) {
        return true;
    }
    
    // 检查线段是否与矩形的四条边相交
    const rectEdges = [
        [rectX, rectY, rectX + rectWidth, rectY], // 上边
        [rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight], // 右边
        [rectX, rectY + rectHeight, rectX + rectWidth, rectY + rectHeight], // 下边
        [rectX, rectY, rectX, rectY + rectHeight] // 左边
    ];
    
    for (const edge of rectEdges) {
        if (lineSegmentsIntersect(lineStartX, lineStartY, lineEndX, lineEndY,
            edge[0], edge[1], edge[2], edge[3])) {
            return true;
        }
    }
    
    return false;
}

/**
 * 检查点是否在矩形内
 * @param {number} px - 点X坐标
 * @param {number} py - 点Y坐标
 * @param {number} rectX - 矩形X坐标
 * @param {number} rectY - 矩形Y坐标
 * @param {number} rectWidth - 矩形宽度
 * @param {number} rectHeight - 矩形高度
 * @returns {boolean} 是否在矩形内
 */
function pointInRect(px, py, rectX, rectY, rectWidth, rectHeight) {
    return px >= rectX && px <= rectX + rectWidth && 
           py >= rectY && py <= rectY + rectHeight;
}

/**
 * 计算折线路径点，避开重叠的节点
 * @param {Object} link - 连线对象
 * @param {Array} nodes - 节点数组
 * @returns {Object} 路径数据
 */
function calculatePolylinePath(link, nodes) {
    const source = nodes.find(n => n.id === link.source);
    const target = nodes.find(n => n.id === link.target);
    
    if (!source || !target) return null;
    
    // 计算连接线的起点和终点（节点边缘）
    const sourceDimensions = calculateNodeDimensions(source.label || '', 100, 50, 25);
    const targetDimensions = calculateNodeDimensions(target.label || '', 100, 50, 25);
    
    const sourceWidth = source.width || sourceDimensions.width;
    const sourceHeight = source.height || sourceDimensions.height;
    const targetWidth = target.width || targetDimensions.width;
    const targetHeight = target.height || targetDimensions.height;
    
    // 判断节点间的层次关系
    const isHierarchical = window.isHierarchicalConnection(source, target, nodes, [link]);
    
    let startX, startY, endX, endY;
    
    if (isHierarchical) {
        // 层次连接：下级节点连接到上级节点的下面
        if (target.y > source.y) {
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
    } else {
        // 同级连接：连接到节点的左右
        const dx = target.x - source.x;
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
    }
    
    // 检查是否有重叠
    const overlapCheck = hasLinkNodeOverlap(link, nodes);
    if (!overlapCheck.hasOverlap) {
        // 没有重叠，返回直线路径
        return {
            isPolyline: false,
            path: `M ${startX} ${startY} L ${endX} ${endY}`,
            waypoints: [{ x: startX, y: startY }, { x: endX, y: endY }]
        };
    }
    
    // 有重叠，计算折线路径
    const waypoints = calculateWaypoints(startX, startY, endX, endY, nodes, link);
    
    // 构建SVG路径
    let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
    for (let i = 1; i < waypoints.length; i++) {
        path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
    }
    
    return {
        isPolyline: true,
        path: path,
        waypoints: waypoints
    };
}

/**
 * 计算折线的路径点 - 最多只生成3个路径点（2个线段）
 * @param {number} startX - 起点X坐标
 * @param {number} startY - 起点Y坐标
 * @param {number} endX - 终点X坐标
 * @param {number} endY - 终点Y坐标
 * @param {Array} nodes - 节点数组
 * @param {Object} link - 连线对象
 * @returns {Array} 路径点数组
 */
function calculateWaypoints(startX, startY, endX, endY, nodes, link) {
    const waypoints = [{ x: startX, y: startY }];
    
    // 获取所有可能重叠的节点
    const overlappingNodes = [];
    for (const node of nodes) {
        if (node.id === link.source || node.id === link.target) continue;
        
        const nodeDimensions = window.calculateNodeDimensions(node.label || '', 100, 50, 25);
        const nodeWidth = node.width || nodeDimensions.width;
        const nodeHeight = node.height || nodeDimensions.height;
        
        if (lineRectIntersect(startX, startY, endX, endY, 
            node.x - nodeWidth / 2, node.y - nodeHeight / 2, 
            nodeWidth, nodeHeight)) {
            overlappingNodes.push({
                node: node,
                x: node.x,
                y: node.y,
                width: nodeWidth,
                height: nodeHeight
            });
        }
    }
    
    if (overlappingNodes.length === 0) {
        // 没有重叠节点，返回直线
        waypoints.push({ x: endX, y: endY });
        return waypoints;
    }
    
    // 按距离起点的远近排序重叠节点
    overlappingNodes.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - startX, 2) + Math.pow(a.y - startY, 2));
        const distB = Math.sqrt(Math.pow(b.x - startX, 2) + Math.pow(b.y - startY, 2));
        return distA - distB;
    });
    
    // 只处理第一个重叠节点，创建两段折线
    const overlapNode = overlappingNodes[0];
    
    // 计算单个绕行点 - 只生成一个中间点，形成两段线
    const detourPoint = calculateSingleDetourPoint(
        startX, startY, endX, endY, 
        overlapNode.x, overlapNode.y, 
        overlapNode.width, overlapNode.height
    );
    
    // 只添加一个绕行点，形成两段折线
    if (detourPoint) {
        waypoints.push(detourPoint); // 中间绕行点
    }
    
    // 添加终点
    waypoints.push({ x: endX, y: endY });
    
    return waypoints;
}

/**
 * 计算单个绕行点 - 只生成一个中间点，形成两段折线
 * @param {number} startX - 起点X坐标
 * @param {number} startY - 起点Y坐标
 * @param {number} endX - 终点X坐标
 * @param {number} endY - 终点Y坐标
 * @param {number} nodeX - 节点X坐标
 * @param {number} nodeY - 节点Y坐标
 * @param {number} nodeWidth - 节点宽度
 * @param {number} nodeHeight - 节点高度
 * @returns {Object|null} 绕行点坐标
 */
function calculateSingleDetourPoint(startX, startY, endX, endY, 
                                  nodeX, nodeY, nodeWidth, nodeHeight) {
    // 计算节点边界
    const nodeLeft = nodeX - nodeWidth / 2;
    const nodeRight = nodeX + nodeWidth / 2;
    const nodeTop = nodeY - nodeHeight / 2;
    const nodeBottom = nodeY + nodeHeight / 2;
    
    // 计算连线的方向
    const dx = endX - startX;
    const dy = endY - startY;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    
    // 计算绕行距离，确保有足够空间放置文字，增加距离让角度更明显
    const detourDistance = 80;
    
    if (isHorizontal) {
        // 水平连线，垂直绕行 - 强制向下弯曲
        if (dx > 0) {
            // 从左到右
            if (startX < nodeLeft && endX > nodeRight) {
                // 连线穿过节点，需要绕行 - 强制选择下方绕行
                const detourY = nodeBottom + detourDistance; // 只使用下方绕行
                
                // 计算绕行点的X坐标，让两段长度尽量一致
                const totalDistance = endX - startX;
                const offsetRatio = 0.5; // 使用50%位置，让两段长度一致
                const detourX = startX + totalDistance * offsetRatio;
                
                return { x: detourX, y: detourY };
            }
        } else {
            // 从右到左
            if (startX > nodeRight && endX < nodeLeft) {
                // 强制选择下方绕行
                const detourY = nodeBottom + detourDistance;
                
                // 计算绕行点的X坐标，让两段长度尽量一致
                const totalDistance = startX - endX;
                const offsetRatio = 0.5; // 使用50%位置，让两段长度一致
                const detourX = endX + totalDistance * offsetRatio;
                
                return { x: detourX, y: detourY };
            }
        }
    } else {
        // 垂直连线，水平绕行 - 确保折线向下弯曲
        if (dy > 0) {
            // 从上到下 - 正常情况，绕行点向下
            if (startY < nodeTop && endY > nodeBottom) {
                const detourX1 = nodeLeft - detourDistance;
                const detourX2 = nodeRight + detourDistance;
                
                const distLeft = Math.abs(startX - detourX1) + Math.abs(endX - detourX1);
                const distRight = Math.abs(startX - detourX2) + Math.abs(endX - detourX2);
                
                const detourX = distLeft < distRight ? detourX1 : detourX2;
                
                // 计算绕行点的Y坐标，让两段长度尽量一致
                const totalDistance = endY - startY;
                const offsetRatio = 0.5; // 使用50%位置，让两段长度一致
                const detourY = startY + totalDistance * offsetRatio;
                
                return { x: detourX, y: detourY };
            }
        } else {
            // 从下到上 - 特殊处理，确保折线向下弯曲
            if (startY > nodeBottom && endY < nodeTop) {
                const detourX1 = nodeLeft - detourDistance;
                const detourX2 = nodeRight + detourDistance;
                
                const distLeft = Math.abs(startX - detourX1) + Math.abs(endX - detourX1);
                const distRight = Math.abs(startX - detourX2) + Math.abs(endX - detourX2);
                
                const detourX = distLeft < distRight ? detourX1 : detourX2;
                
                // 对于从下到上的连线，绕行点放在节点下方，确保折线向下弯曲
                const detourY = nodeBottom + detourDistance;
                
                return { x: detourX, y: detourY };
            }
        }
    }
    
    return null;
}

/**
 * 线段相交检测
 * @param {number} x1 - 线段1起点X
 * @param {number} y1 - 线段1起点Y
 * @param {number} x2 - 线段1终点X
 * @param {number} y2 - 线段1终点Y
 * @param {number} x3 - 线段2起点X
 * @param {number} y3 - 线段2起点Y
 * @param {number} x4 - 线段2终点X
 * @param {number} y4 - 线段2终点Y
 * @returns {boolean} 是否相交
 */
function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * 调整节点位置避免连线重叠
 * @param {Object} linkA - 连线A
 * @param {Object} linkB - 连线B
 * @param {Array} nodes - 节点数组
 */
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

/**
 * 优化文字标签位置，避免重叠
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 */
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
        const labelWidth = Math.max(80, (link.label || '双击编辑').length * 12);
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

/**
 * 计算标签与其他元素的重叠程度
 * @param {number} labelX - 标签X坐标
 * @param {number} labelY - 标签Y坐标
 * @param {number} labelWidth - 标签宽度
 * @param {number} labelHeight - 标签高度
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 * @param {string} currentLinkId - 当前连线ID
 * @returns {number} 重叠程度
 */
function calculateLabelOverlap(labelX, labelY, labelWidth, labelHeight, nodes, links, currentLinkId) {
    let overlap = 0;
    
    // 检查与节点的重叠
    nodes.forEach(node => {
        const nodeWidth = Math.max(100, (node.label || '').length * 12);
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
            const otherLabelWidth = Math.max(80, (link.label || '双击编辑').length * 12);
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

/**
 * 检查两个矩形是否重叠
 * @param {number} x1 - 矩形1X坐标
 * @param {number} y1 - 矩形1Y坐标
 * @param {number} w1 - 矩形1宽度
 * @param {number} h1 - 矩形1高度
 * @param {number} x2 - 矩形2X坐标
 * @param {number} y2 - 矩形2Y坐标
 * @param {number} w2 - 矩形2宽度
 * @param {number} h2 - 矩形2高度
 * @returns {boolean} 是否重叠
 */
function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

/**
 * 确保同级节点间距均匀
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 */
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
        
        // 计算所有节点的实际宽度
        const nodeWidths = levelNodes.map(node => {
            const nodeDimensions = calculateNodeDimensions(node.label || '', 100, 50, 25);
            return node.width || nodeDimensions.width;
        });
        
        // 固定间距，确保节点不重叠
        const minSpacing = 150; // 固定间距
        
        // 计算总宽度（所有节点宽度 + 间距）
        const totalNodeWidth = nodeWidths.reduce((sum, width) => sum + width, 0);
        const totalSpacing = (levelNodes.length - 1) * minSpacing;
        const totalWidth = totalNodeWidth + totalSpacing;
        
        // 计算起始位置（居中）
        const centerX = 400; // 画布中心
        let currentX = centerX - totalWidth / 2;
        
        // 重新分配x坐标，确保间距均匀
        levelNodes.forEach((node, index) => {
            const nodeWidth = nodeWidths[index];
            currentX += nodeWidth / 2;
            node.x = currentX;
            currentX += nodeWidth / 2 + minSpacing;
            
            console.log(`节点${index + 1} "${node.label}" 位置: (${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
        });
    });
}

/**
 * 应用Sugiyama布局算法 - 统一入口函数
 * @param {Object} graphData - 图形数据（包含nodes和links）
 * @returns {Object} 应用布局后的图形数据
 */
function applySugiyamaLayout(graphData) {
    console.log('开始应用Sugiyama层次布局算法...');
    
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        console.warn('图形数据为空，跳过布局');
        return graphData;
    }
    
    const nodes = [...graphData.nodes];
    const links = [...graphData.links];
    
    // 动态获取SVG容器的实际宽度
    const svg = document.querySelector('.concept-graph');
    let containerWidth = 1600;
    let containerHeight = 600;
    
    if (svg) {
        const svgRect = svg.getBoundingClientRect();
        containerWidth = svgRect.width || 1600;
        containerHeight = svgRect.height || 600;
        console.log(`SVG容器实际尺寸: ${containerWidth} x ${containerHeight}`);
    }
    
    // 使用容器的实际宽度（几乎占满整个可用空间）
    const width = Math.floor(containerWidth);
    const height = Math.max(600, Math.min(1200, nodes.length * 150 + 400));
    
    console.log(`画布尺寸: ${width} x ${height}`);
    
    // Sugiyama算法三步骤
    // 步骤1: 层次分配
    const levels = assignLayers(nodes, links);
    
    // 步骤2: 节点排序（减少交叉）
    const orderedLevels = orderNodesInLayers(nodes, links, levels);
    
    // 步骤3: 坐标分配
    assignCoordinates(nodes, orderedLevels, width, height);
    
    // 调整viewBox，确保所有元素都在可视范围内
    adjustViewBox(nodes, width, height);
    
    console.log('Sugiyama布局算法应用完成');
    
    return {
        nodes: nodes,
        links: links,
        metadata: graphData.metadata || {}
    };
}

// 导出函数供外部使用
if (typeof window !== 'undefined') {
    window.applySugiyamaLayout = applySugiyamaLayout;
    console.log('✅ Sugiyama布局算法已注册到全局作用域');
}

