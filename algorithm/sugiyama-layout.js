// Sugiyama层次布局算法模块
// 包含完整的Sugiyama算法实现，用于绘制层次结构的概念图

/**
 * 应用每层节点数量限制（最多5个节点）
 * @param {Map} levels - 层次Map，键为层次编号，值为该层的节点数组
 * @returns {Map} 应用限制后的层次Map
 */
function applyLayerNodeLimit(levels) {
    console.log('应用每层节点数量限制（最多5个节点）...');
    
    const maxNodesPerLayer = 5;
    const newLevels = new Map();
    
    levels.forEach((levelNodes, originalLevel) => {
        console.log(`处理第${originalLevel}层，节点数量: ${levelNodes.length}`);
        
        if (levelNodes.length <= maxNodesPerLayer) {
            // 如果节点数量不超过限制，直接使用，保持原始层级编号
            newLevels.set(originalLevel, levelNodes);
            console.log(`第${originalLevel}层节点数量(${levelNodes.length})未超限，保持不变`);
        } else {
            // 如果节点数量超过限制，需要分流到多个层级
            console.log(`第${originalLevel}层节点数量(${levelNodes.length})超限，开始分流...`);
            
            // 对节点进行智能分组，优先保持相关性
            const nodeGroups = intelligentNodeGrouping(levelNodes, maxNodesPerLayer);
            
            // 将分组后的节点分配到同一层级的不同子层（使用小数表示）
            // 例如：如果originalLevel=1，第一个分组为1.0，第二个为1.1，依此类推
            nodeGroups.forEach((group, groupIndex) => {
                const subLevel = originalLevel + (groupIndex * 0.1); // 使用小数点分隔子层
                newLevels.set(subLevel, group);
                console.log(`分组${groupIndex + 1}(${group.length}个节点)分配到第${originalLevel}层（子层${groupIndex}）:`, group.map(n => n.label));
            });
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
    console.log(`开始智能分组，总节点数: ${nodes.length}，每组最大: ${maxNodesPerGroup}`);
    
    if (nodes.length <= maxNodesPerGroup) {
        return [nodes];
    }
    
    const groups = [];
    let currentGroup = [];
    
    // 按节点标签长度排序，优先处理短标签（通常是核心概念）
    const sortedNodes = [...nodes].sort((a, b) => {
        const aLength = (a.label || '').length;
        const bLength = (b.label || '').length;
        return aLength - bLength;
    });
    
    sortedNodes.forEach((node, index) => {
        currentGroup.push(node);
        
        // 如果当前组已满或者是最后一个节点，完成当前组
        if (currentGroup.length >= maxNodesPerGroup || index === sortedNodes.length - 1) {
            groups.push([...currentGroup]);
            console.log(`完成分组${groups.length}: ${currentGroup.map(n => n.label).join(', ')}`);
            currentGroup = [];
        }
    });
    
    console.log(`智能分组完成，共${groups.length}组`);
    return groups;
}

/**
 * Sugiyama算法步骤1: 层次分配
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 * @returns {Map} 层次Map，键为层次编号，值为该层的节点数组
 */
function assignLayers(nodes, links) {
    console.log('开始层次分配...');
    
    // 创建节点Map以便快速查找
    const nodeMap = new Map();
    nodes.forEach(node => {
        nodeMap.set(node.id, node);
    });
    
    // 初始化所有节点的层次为-1（未分配）
    nodes.forEach(node => {
        node.layer = -1;
    });
    
    // 找到所有入度为0的节点（根节点）
    const inDegree = new Map();
    nodes.forEach(node => {
        inDegree.set(node.id, 0);
    });
    
    links.forEach(link => {
        const targetId = link.target;
        inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });
    
    const rootNodes = nodes.filter(node => inDegree.get(node.id) === 0);
    console.log(`找到${rootNodes.length}个根节点:`, rootNodes.map(n => n.label));
    
    // 从根节点开始进行BFS层次分配
    const levels = new Map();
    let currentLevel = 0;
    let currentLevelNodes = [...rootNodes];
    
    while (currentLevelNodes.length > 0) {
        console.log(`分配第${currentLevel}层，节点数: ${currentLevelNodes.length}`);
        
        // 将当前层的节点标记层次
        currentLevelNodes.forEach(node => {
            node.layer = currentLevel;
        });
        
        // 存储当前层
        levels.set(currentLevel, currentLevelNodes);
        
        // 找到下一层的节点
        const nextLevelNodes = [];
        currentLevelNodes.forEach(node => {
            links.forEach(link => {
                if (link.source === node.id) {
                    const targetNode = nodeMap.get(link.target);
                    if (targetNode && targetNode.layer === -1) {
                        // 检查是否已经在下一层候选列表中
                        if (!nextLevelNodes.find(n => n.id === targetNode.id)) {
                            nextLevelNodes.push(targetNode);
                        }
                    }
                }
            });
        });
        
        currentLevelNodes = nextLevelNodes;
        currentLevel++;
    }
    
    // 处理孤立的节点（没有连线的节点）
    const isolatedNodes = nodes.filter(node => node.layer === -1);
    if (isolatedNodes.length > 0) {
        console.log(`发现${isolatedNodes.length}个孤立节点，分配到第${currentLevel}层`);
        isolatedNodes.forEach(node => {
            node.layer = currentLevel;
        });
        levels.set(currentLevel, isolatedNodes);
    }
    
    console.log(`层次分配完成，共${levels.size}层`);
    levels.forEach((levelNodes, level) => {
        console.log(`第${level}层: ${levelNodes.map(n => n.label).join(', ')}`);
    });
    
    // 应用每层节点数量限制
    return applyLayerNodeLimit(levels);
}

/**
 * Sugiyama算法步骤2: 节点排序 - 减少连线交叉
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连线数组
 * @param {Map} levels - 层次Map
 * @returns {Map} 排序后的层次Map
 */
function orderNodesInLayers(nodes, links, levels) {
    console.log('开始节点排序，减少连线交叉...');
    
    // 创建节点Map
    const nodeMap = new Map();
    nodes.forEach(node => {
        nodeMap.set(node.id, node);
    });
    
    const orderedLevels = new Map();
    
    // 对每一层进行排序
    levels.forEach((levelNodes, level) => {
        console.log(`排序第${level}层，节点数: ${levelNodes.length}`);
        
        if (levelNodes.length <= 1) {
            // 如果只有0个或1个节点，直接使用
            orderedLevels.set(level, levelNodes);
            return;
        }
        
        // 使用重心排序算法
        const sortedNodes = sortNodesByBarycenter(levelNodes, links, nodeMap, level);
        
        // 禁用节点顺序优化，直接返回排序后的节点
        orderedLevels.set(level, sortedNodes);
        
        console.log(`第${level}层排序完成:`, sortedNodes.map(n => n.label));
    });
    
    console.log('节点排序完成');
    return orderedLevels;
}

/**
 * 按重心排序节点
 * @param {Array} levelNodes - 层次中的节点数组
 * @param {Array} links - 连线数组
 * @param {Map} nodeMap - 节点Map
 * @param {number} level - 层次编号
 * @returns {Array} 排序后的节点数组
 */
function sortNodesByBarycenter(levelNodes, links, nodeMap, level) {
    console.log(`对第${level}层进行重心排序...`);
    
    // 计算每个节点的重心
    const nodeBarycenters = new Map();
    
    levelNodes.forEach(node => {
        let totalWeight = 0;
        let weightedSum = 0;
        
        // 计算连接到上层和下层节点的平均位置
        links.forEach(link => {
            if (link.source === node.id) {
                const targetNode = nodeMap.get(link.target);
                if (targetNode && targetNode.layer > level) {
                    // 连接到下层
                    const targetIndex = Array.from(nodeMap.values())
                        .filter(n => n.layer === targetNode.layer)
                        .sort((a, b) => a.x - b.x)
                        .findIndex(n => n.id === targetNode.id);
                    
                    if (targetIndex !== -1) {
                        weightedSum += targetIndex;
                        totalWeight += 1;
                    }
                }
            } else if (link.target === node.id) {
                const sourceNode = nodeMap.get(link.source);
                if (sourceNode && sourceNode.layer < level) {
                    // 连接到上层
                    const sourceIndex = Array.from(nodeMap.values())
                        .filter(n => n.layer === sourceNode.layer)
                        .sort((a, b) => a.x - b.x)
                        .findIndex(n => n.id === sourceNode.id);
                    
                    if (sourceIndex !== -1) {
                        weightedSum += sourceIndex;
                        totalWeight += 1;
                    }
                }
            }
        });
        
        const barycenter = totalWeight > 0 ? weightedSum / totalWeight : 0;
        nodeBarycenters.set(node.id, barycenter);
    });
    
    // 按重心排序
    const sortedNodes = [...levelNodes].sort((a, b) => {
        const barycenterA = nodeBarycenters.get(a.id) || 0;
        const barycenterB = nodeBarycenters.get(b.id) || 0;
        return barycenterA - barycenterB;
    });
    
    console.log(`第${level}层重心排序完成`);
    return sortedNodes;
}

/**
 * Sugiyama算法步骤3: 坐标分配 - 支持多层布局，层间距相同，居中显示，四周间距相同
 * @param {Array} nodes - 节点数组
 * @param {Map} orderedLevels - 排序后的层次Map
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
function assignCoordinates(nodes, orderedLevels, width, height) {
    console.log('开始坐标分配...');
    
    // 计算布局参数
    const horizontalMargin = 150; // 左右边距（增大水平边距）
    const focusToLayer1Spacing = 80; // 焦点问题到第一层的间距（减小间距，让第一层节点更靠近顶部）
    const uniformSpacing = 100; // 各层之间的统一间距
    
    // 计算焦点问题和第一层的Y坐标
    // 让焦点问题到上边界和第一层的距离相等
    const focusQuestionY = focusToLayer1Spacing; // 焦点问题的Y坐标（等于焦点到第一层的距离）
    const layer1Y = focusQuestionY + focusToLayer1Spacing; // 第一层的Y坐标（第一层在焦点问题下方）
    const verticalMargin = focusToLayer1Spacing; // 上下边距（等于焦点问题到上边界的距离）
    
    console.log(`布局参数: 上下边距=${verticalMargin}, 焦点到第一层间距=${focusToLayer1Spacing}, 层间距=${uniformSpacing}`);
    console.log(`焦点问题Y坐标: ${focusQuestionY}, 第一层Y坐标: ${layer1Y}`);
    
    // 遍历每一层，分配坐标
    orderedLevels.forEach((levelNodes, level) => {
        // 直接使用level值（包括小数），这样小数层级也会被正确分开
        // 例如：level 0, 0.1, 0.2会被分配到不同的Y坐标
        // level 0 → y = layer1Y (第一层主层)
        // level 0.1 → y = layer1Y + 10 (第一层子层1)
        // level 1 → y = layer1Y + 100 (第二层主层)
        // level 1.1 → y = layer1Y + 110 (第二层子层1)
        const y = layer1Y + (level * uniformSpacing);
        
        console.log(`第${level}层Y坐标: ${y}`);
        
        // 计算当前层的可用宽度
        const availableWidth = width - 2 * horizontalMargin;
        
        // 计算节点间距
        let nodeSpacing;
        if (levelNodes.length === 1) {
            // 只有一个节点时，居中显示
            nodeSpacing = 0;
        } else {
            // 多个节点时，均匀分布
            nodeSpacing = availableWidth / (levelNodes.length - 1);
        }
        
        // 计算起始X坐标（居中显示）
        const startX = horizontalMargin;
        
        // 为每个节点分配坐标
        levelNodes.forEach((node, index) => {
            let x;
            if (levelNodes.length === 1) {
                // 单个节点居中
                x = width / 2;
            } else {
                // 多个节点均匀分布
                x = startX + index * nodeSpacing;
            }
            
            node.x = x;
            node.y = y;
            
            console.log(`节点 "${node.label}" 坐标: (${x}, ${y})`);
        });
        
        console.log(`第${level}层坐标分配完成，节点数: ${levelNodes.length}`);
    });
    
    console.log('坐标分配完成');
}

/**
 * 调整SVG的viewBox，确保所有节点都在可视范围内
 * @param {Array} nodes - 节点数组
 * @param {number} baseWidth - 基础宽度
 * @param {number} baseHeight - 基础高度
 */
function adjustViewBox(nodes, baseWidth, baseHeight) {
    console.log('调整viewBox...');
    
    if (!nodes || nodes.length === 0) {
        console.log('没有节点，跳过viewBox调整');
        return;
    }
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        }
    });
    
    // 添加边距
    const horizontalMargin = 50;
    const verticalMarginTop = 0; // 顶部边距设为0，让焦点问题贴近顶部
    const verticalMarginBottom = 50; // 底部边距
    
    minX = Math.max(0, minX - horizontalMargin);
    minY = Math.max(0, minY - verticalMarginTop); // 使用顶部的垂直边距
    maxX = Math.min(baseWidth, maxX + horizontalMargin);
    maxY = Math.min(baseHeight, maxY + verticalMarginBottom); // 使用底部的垂直边距
    
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
    
    // 重新显示焦点问题，确保位置正确
    if (typeof window.displayFocusQuestion === 'function') {
        window.displayFocusQuestion();
    }
    
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
