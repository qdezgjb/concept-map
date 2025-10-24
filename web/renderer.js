// 概念图自动生成系统 - 渲染和UI管理模块
// 包含: 图形渲染、UI交互、状态管理

//=============================================================================
// 图形渲染函数
//=============================================================================


// displayConceptMap
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

// drawGraph
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
        const height = svg.clientHeight || 700;
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
            
            // 计算折线路径
            const pathData = calculatePolylinePath(link, data.nodes);
            if (!pathData) return;
            
            // 创建带箭头的连接线
            const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            lineGroup.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            
            // 获取路径点
            const waypoints = pathData.waypoints;
            const startX = waypoints[0].x;
            const startY = waypoints[0].y;
            const endX = waypoints[waypoints.length - 1].x;
            const endY = waypoints[waypoints.length - 1].y;
            
            // 计算连接线中点（用于标签位置）
            // 对于折线，使用中间点作为标签位置
            let midX, midY;
            if (waypoints.length === 3) {
                // 两段折线：使用中间点作为标签位置
                midX = waypoints[1].x;
                midY = waypoints[1].y;
            } else {
                // 直线：使用起点和终点的中点
                midX = (startX + endX) / 2;
                midY = (startY + endY) / 2;
            }
            
            // 计算箭头位置
            const arrowLength = 8;
            const arrowWidth = 6;
            
            // 对于折线，箭头位置需要基于最后一段线段计算
            let arrowX, arrowY;
            if (waypoints.length > 2) {
                // 折线：箭头位置基于最后一段线段
                const lastSegmentStart = waypoints[waypoints.length - 2];
                const lastSegmentEnd = waypoints[waypoints.length - 1];
                const segmentLength = Math.sqrt(
                    Math.pow(lastSegmentEnd.x - lastSegmentStart.x, 2) + 
                    Math.pow(lastSegmentEnd.y - lastSegmentStart.y, 2)
                );
                const arrowOffset = 8 / segmentLength;
                arrowX = lastSegmentEnd.x - (lastSegmentEnd.x - lastSegmentStart.x) * arrowOffset;
                arrowY = lastSegmentEnd.y - (lastSegmentEnd.y - lastSegmentStart.y) * arrowOffset;
            } else {
                // 直线：使用原来的计算方式
                const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const arrowOffset = 8 / lineLength;
                arrowX = endX - (endX - startX) * arrowOffset;
                arrowY = endY - (endY - startY) * arrowOffset;
            }
            
            // 创建连接线路径
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', pathData.path);
            line.setAttribute('stroke', '#aaa');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('stroke-linejoin', 'round'); // 让折线转角更圆润
            
            // 对于折线，在中间点周围断开用于放置文字
            if (pathData.isPolyline && waypoints.length === 3) {
                // 两段折线：在拐点处断开
                const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
                const textGap = Math.max(30, textWidth * 0.6); // 调整断开间隙大小
                
                // 计算两段线的长度
                const firstSegmentLength = Math.sqrt(
                    Math.pow(waypoints[1].x - waypoints[0].x, 2) + 
                    Math.pow(waypoints[1].y - waypoints[0].y, 2)
                );
                const secondSegmentLength = Math.sqrt(
                    Math.pow(waypoints[2].x - waypoints[1].x, 2) + 
                    Math.pow(waypoints[2].y - waypoints[1].y, 2)
                );
                
                // 在拐点处对称断开
                const halfGap = textGap / 2;
                const firstSegmentVisible = Math.max(0, firstSegmentLength - halfGap);
                const secondSegmentVisible = Math.max(0, secondSegmentLength - halfGap);
                
                // 设置断开模式：第一段可见长度 + 断开间隙 + 第二段可见长度
                line.setAttribute('stroke-dasharray', `${firstSegmentVisible} ${textGap} ${secondSegmentVisible}`);
            } else if (!pathData.isPolyline) {
                // 直线：使用原来的断开效果
                const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
                const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
                const textGap = Math.max(20, textWidth * 0.8);
                const gapStart = (totalLength - textGap) / 2;
                const gapEnd = gapStart + textGap;
                line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
            }
            
            // 创建箭头
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 计算箭头方向（基于最后一段线段）
            let angle;
            if (waypoints.length > 2) {
                const lastSegmentStart = waypoints[waypoints.length - 2];
                const lastSegmentEnd = waypoints[waypoints.length - 1];
                angle = Math.atan2(lastSegmentEnd.y - lastSegmentStart.y, lastSegmentEnd.x - lastSegmentStart.x);
            } else {
                angle = Math.atan2(endY - startY, endX - startX);
            }
            
            const arrowAngle1 = angle + Math.PI / 8;
            const arrowAngle2 = angle - Math.PI / 8;
            
            const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
            const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
            const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
            const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
            
            const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
            arrow.setAttribute('d', arrowPath);
            arrow.setAttribute('fill', '#aaa');
            arrow.setAttribute('stroke', '#aaa');
            arrow.setAttribute('stroke-width', '1');
            
            // 创建连接线标签
            const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            linkLabel.setAttribute('x', midX);
            linkLabel.setAttribute('y', midY + 4);
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '14');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('font-weight', '500');
            linkLabel.setAttribute('pointer-events', 'all');
            linkLabel.setAttribute('cursor', 'pointer');
            linkLabel.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            linkLabel.setAttribute('data-link-label', 'true');
            linkLabel.textContent = link.label || '双击编辑';

            // 连线标签双击编辑
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
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
            const nodeDimensions = window.calculateNodeDimensions(nodeLabel, 100, 50, 20); // 缩小节点尺寸和内边距
            
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
            text.setAttribute('font-size', node.fontSize || '14'); // 优先使用保存的字体大小，缩小字体
            
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
        
        // 检测并解决连接线标签重叠问题
        resolveLinkLabelOverlaps();
        
        console.log('drawGraph 函数执行完成');
    }

// 检测并解决连接线标签重叠问题（包括与节点的重叠）
function resolveLinkLabelOverlaps() {
    const svg = document.querySelector('.concept-graph');
    if (!svg) return;
    
    // 获取所有连接线标签
    const labels = Array.from(svg.querySelectorAll('[data-link-label="true"]'));
    if (labels.length === 0) return;
    
    // 获取所有节点（用于检测标签与节点的重叠）
    const nodes = Array.from(svg.querySelectorAll('[data-node-id]'));
    
    console.log('开始检测连接线标签重叠，标签数量:', labels.length, ', 节点数量:', nodes.length);
    
    const adjustmentStep = 25; // 增大每次调整的距离，更快速避开重叠
    const maxIterations = 8; // 增加迭代次数，确保充分调整
    let totalOverlapCount = 0;
    let totalNodeOverlapCount = 0;
    
    // 迭代检测和调整，直到没有重叠或达到最大迭代次数
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // 计算每个标签的边界框
        const labelBounds = labels.map(label => {
            const bbox = label.getBBox();
            const x = parseFloat(label.getAttribute('x'));
            const y = parseFloat(label.getAttribute('y'));
            return {
                element: label,
                x: x,
                y: y,
                left: bbox.x,
                right: bbox.x + bbox.width,
                top: bbox.y,
                bottom: bbox.y + bbox.height,
                width: bbox.width,
                height: bbox.height
            };
        });
        
        // 检测并调整重叠
        let overlapCount = 0;
        
        for (let i = 0; i < labelBounds.length; i++) {
            for (let j = i + 1; j < labelBounds.length; j++) {
                const label1 = labelBounds[i];
                const label2 = labelBounds[j];
                
                // 检查是否重叠（增加一些容差）
                const padding = 8;
                const overlapping = !(
                    label1.right + padding < label2.left ||
                    label1.left - padding > label2.right ||
                    label1.bottom + padding < label2.top ||
                    label1.top - padding > label2.bottom
                );
                
                if (overlapping) {
                    overlapCount++;
                    
                    if (iteration === 0) {
                        console.log(`检测到标签重叠: "${label1.element.textContent}" 和 "${label2.element.textContent}"`);
                    }
                    
                    // 计算重叠区域的中心
                    const overlapCenterX = (Math.max(label1.left, label2.left) + Math.min(label1.right, label2.right)) / 2;
                    const overlapCenterY = (Math.max(label1.top, label2.top) + Math.min(label1.bottom, label2.bottom)) / 2;
                    
                    // 计算各自标签中心到重叠中心的方向
                    const dx1 = label1.x - overlapCenterX;
                    const dy1 = label1.y - overlapCenterY;
                    
                    // 根据方向调整位置（向外推）
                    if (Math.abs(dx1) > Math.abs(dy1)) {
                        // 水平方向调整
                        if (dx1 > 0) {
                            label1.element.setAttribute('x', label1.x + adjustmentStep);
                        } else {
                            label1.element.setAttribute('x', label1.x - adjustmentStep);
                        }
                    } else {
                        // 垂直方向调整
                        if (dy1 > 0) {
                            label1.element.setAttribute('y', label1.y + adjustmentStep);
                        } else {
                            label1.element.setAttribute('y', label1.y - adjustmentStep);
                        }
                    }
                }
            }
        }
        
        // 检测标签与节点的重叠
        let nodeOverlapCount = 0;
        const nodeBounds = nodes.map(node => {
            const rect = node.querySelector('rect');
            if (!rect) return null;
            const bbox = rect.getBBox();
            const transform = node.getAttribute('transform');
            let x = 0, y = 0;
            if (transform) {
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                if (match) {
                    x = parseFloat(match[1]);
                    y = parseFloat(match[2]);
                }
            }
            return {
                element: node,
                left: x + bbox.x,
                right: x + bbox.x + bbox.width,
                top: y + bbox.y,
                bottom: y + bbox.y + bbox.height,
                centerX: x,
                centerY: y
            };
        }).filter(b => b !== null);
        
        for (let i = 0; i < labelBounds.length; i++) {
            const label = labelBounds[i];
            
            for (let j = 0; j < nodeBounds.length; j++) {
                const node = nodeBounds[j];
                
                // 检查标签是否与节点重叠（增加容差）
                const padding = 10;
                const overlapping = !(
                    label.right + padding < node.left ||
                    label.left - padding > node.right ||
                    label.bottom + padding < node.top ||
                    label.top - padding > node.bottom
                );
                
                if (overlapping) {
                    nodeOverlapCount++;
                    
                    if (iteration === 0) {
                        console.log(`检测到标签与节点重叠: "${label.element.textContent}"`);
                    }
                    
                    // 计算从节点中心到标签中心的方向
                    const dx = label.x - node.centerX;
                    const dy = label.y - node.centerY;
                    
                    // 向外推开标签
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // 水平方向推开
                        if (dx > 0) {
                            label.element.setAttribute('x', label.x + adjustmentStep);
                        } else {
                            label.element.setAttribute('x', label.x - adjustmentStep);
                        }
                    } else {
                        // 垂直方向推开
                        if (dy > 0) {
                            label.element.setAttribute('y', label.y + adjustmentStep);
                        } else {
                            label.element.setAttribute('y', label.y - adjustmentStep);
                        }
                    }
                }
            }
        }
        
        totalOverlapCount += overlapCount;
        totalNodeOverlapCount += nodeOverlapCount;
        
        if (overlapCount === 0 && nodeOverlapCount === 0) {
            console.log(`✓ 第${iteration + 1}次迭代后没有重叠，标签调整完成`);
            break;
        } else {
            console.log(`第${iteration + 1}次迭代：标签间重叠${overlapCount}处，标签-节点重叠${nodeOverlapCount}处，已调整`);
        }
        
        if (iteration === maxIterations - 1 && (overlapCount > 0 || nodeOverlapCount > 0)) {
            console.warn(`⚠️ 达到最大迭代次数(${maxIterations})，仍有${overlapCount}处标签重叠，${nodeOverlapCount}处标签-节点重叠`);
        }
    }
    
    if (totalOverlapCount > 0 || totalNodeOverlapCount > 0) {
        console.log(`✓ 共处理 ${totalOverlapCount} 处标签重叠，${totalNodeOverlapCount} 处标签-节点重叠`);
    } else {
        console.log('✓ 未检测到任何重叠');
    }
}

// updateConnectedLinks
function updateConnectedLinks(nodeId) {
        const svg = document.querySelector('.concept-graph');
        if (!svg) return;

        // 找到所有与该节点相关的连线
        const relatedLinks = currentGraphData.links.filter(link => 
            link.source === nodeId || link.target === nodeId
        );

        // 更新这些连线的位置，并检测重合
        relatedLinks.forEach(link => {
            const linkGroup = svg.querySelector(`g[data-link-id="${link.id}"]`);
            if (linkGroup) {
                // 检测连接线是否与其他节点重合
                const overlapCheck = hasLinkNodeOverlap(link, currentGraphData.nodes);
                
                // 检查连接线类型是否需要改变
                const currentLine = linkGroup.querySelector('path:nth-child(1)');
                const currentPath = currentLine ? currentLine.getAttribute('d') : '';
                const isCurrentlyPolyline = currentPath.includes('L') && currentPath.split('L').length > 2;
                const shouldBePolyline = overlapCheck.hasOverlap;
                
                if (shouldBePolyline !== isCurrentlyPolyline) {
                    // 连接线类型需要改变，重新绘制
                    redrawSingleLink(link);
                } else {
                    // 连接线类型不变，只更新位置
                    updateLinkPosition(linkGroup, link);
                }
            }
        });
        
        // 更新全局变量
        window.currentGraphData = currentGraphData;
    }

// redrawSingleLink
function redrawSingleLink(link) {
        const svg = document.querySelector('.concept-graph');
        if (!svg) return;

        const linkId = link.id || `link-${link.source}-${link.target}`;
        
        // 移除现有的连接线
        const existingLink = svg.querySelector(`g[data-link-id="${linkId}"]`);
        if (existingLink) {
            existingLink.remove();
        }

        // 重新绘制连接线
        const sourceNode = currentGraphData.nodes.find(n => n.id === link.source);
        const targetNode = currentGraphData.nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return;
        
        // 计算折线路径
        const pathData = calculatePolylinePath(link, currentGraphData.nodes);
        if (!pathData) return;
        
        // 创建带箭头的连接线
        const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        lineGroup.setAttribute('data-link-id', linkId);
        
        // 获取路径点
        const waypoints = pathData.waypoints;
        const startX = waypoints[0].x;
        const startY = waypoints[0].y;
        const endX = waypoints[waypoints.length - 1].x;
        const endY = waypoints[waypoints.length - 1].y;

        // 计算连接线中点（用于标签位置）
        let midX, midY;
        if (waypoints.length === 3) {
            // 两段折线：使用中间点作为标签位置
            midX = waypoints[1].x;
            midY = waypoints[1].y;
        } else {
            // 直线：使用起点和终点的中点
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
        }
        
        // 计算箭头位置
        const arrowLength = 8;
        let arrowX, arrowY;
        if (waypoints.length > 2) {
            // 折线：箭头位置基于最后一段线段
            const lastSegmentStart = waypoints[waypoints.length - 2];
            const lastSegmentEnd = waypoints[waypoints.length - 1];
            const segmentLength = Math.sqrt(
                Math.pow(lastSegmentEnd.x - lastSegmentStart.x, 2) + 
                Math.pow(lastSegmentEnd.y - lastSegmentStart.y, 2)
            );
            const arrowOffset = 8 / segmentLength;
            arrowX = lastSegmentEnd.x - (lastSegmentEnd.x - lastSegmentStart.x) * arrowOffset;
            arrowY = lastSegmentEnd.y - (lastSegmentEnd.y - lastSegmentStart.y) * arrowOffset;
        } else {
            // 直线：使用原来的计算方式
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const arrowOffset = 8 / lineLength;
            arrowX = endX - (endX - startX) * arrowOffset;
            arrowY = endY - (endY - startY) * arrowOffset;
        }
        
        // 创建连接线路径
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', pathData.path);
        line.setAttribute('stroke', '#aaa');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');
        
        // 对于折线，在拐点处断开用于放置文字
        if (pathData.isPolyline && waypoints.length === 3) {
            // 两段折线：在拐点处断开
            const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
            const textGap = Math.max(30, textWidth * 0.6);
            
            // 计算两段线的长度
            const firstSegmentLength = Math.sqrt(
                Math.pow(waypoints[1].x - waypoints[0].x, 2) + 
                Math.pow(waypoints[1].y - waypoints[0].y, 2)
            );
            const secondSegmentLength = Math.sqrt(
                Math.pow(waypoints[2].x - waypoints[1].x, 2) + 
                Math.pow(waypoints[2].y - waypoints[1].y, 2)
            );
            
            // 在拐点处对称断开
            const halfGap = textGap / 2;
            const firstSegmentVisible = Math.max(0, firstSegmentLength - halfGap);
            const secondSegmentVisible = Math.max(0, secondSegmentLength - halfGap);
            
            line.setAttribute('stroke-dasharray', `${firstSegmentVisible} ${textGap} ${secondSegmentVisible}`);
        } else if (!pathData.isPolyline) {
            // 直线：使用原来的断开效果
            const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
            const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
            const textGap = Math.max(20, textWidth * 0.8);
            const gapStart = (totalLength - textGap) / 2;
            const gapEnd = gapStart + textGap;
            line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
        }
        
        // 创建箭头
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        let angle;
        if (waypoints.length > 2) {
            const lastSegmentStart = waypoints[waypoints.length - 2];
            const lastSegmentEnd = waypoints[waypoints.length - 1];
            angle = Math.atan2(lastSegmentEnd.y - lastSegmentStart.y, lastSegmentEnd.x - lastSegmentStart.x);
        } else {
            angle = Math.atan2(endY - startY, endX - startX);
        }

        const arrowAngle1 = angle + Math.PI / 8;
        const arrowAngle2 = angle - Math.PI / 8;

        const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
        const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
        const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
        const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);

        const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
        arrow.setAttribute('d', arrowPath);
        arrow.setAttribute('fill', '#aaa');
        
        // 创建标签
        const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        linkLabel.setAttribute('x', midX);
        linkLabel.setAttribute('y', midY + 4);
        linkLabel.setAttribute('text-anchor', 'middle');
        linkLabel.setAttribute('font-size', '16');
        linkLabel.setAttribute('fill', '#666');
        linkLabel.setAttribute('pointer-events', 'none');
        linkLabel.textContent = link.label || '双击编辑';
        
        // 组装元素
        lineGroup.appendChild(line);
        lineGroup.appendChild(arrow);
        lineGroup.appendChild(linkLabel);
        
        // 添加到SVG
        svg.appendChild(lineGroup);
    }

// updateLinkPosition
function updateLinkPosition(linkGroup, link) {
        const sourceNode = currentGraphData.nodes.find(n => n.id === link.source);
        const targetNode = currentGraphData.nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return;

        // 获取连接线、箭头和标签元素
        const line = linkGroup.querySelector('path:nth-child(1)'); // 连接线
        const arrow = linkGroup.querySelector('path:nth-child(2)'); // 箭头
        const linkLabel = linkGroup.querySelector('text'); // 标签
        
        if (!line || !arrow || !linkLabel) return;

        // 重新计算折线路径
        const pathData = calculatePolylinePath(link, currentGraphData.nodes);
        if (!pathData) return;

        // 获取路径点
        const waypoints = pathData.waypoints;
        const startX = waypoints[0].x;
        const startY = waypoints[0].y;
        const endX = waypoints[waypoints.length - 1].x;
        const endY = waypoints[waypoints.length - 1].y;

        // 计算连接线中点（用于标签位置）
        // 对于折线，使用中间点作为标签位置
        let midX, midY;
        if (waypoints.length === 3) {
            // 两段折线：使用中间点作为标签位置
            midX = waypoints[1].x;
            midY = waypoints[1].y;
        } else {
            // 直线：使用起点和终点的中点
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
        }

        // 计算箭头位置
        const arrowLength = 8;
        const arrowWidth = 6;
        
        let arrowX, arrowY;
        if (waypoints.length > 2) {
            // 折线：箭头位置基于最后一段线段
            const lastSegmentStart = waypoints[waypoints.length - 2];
            const lastSegmentEnd = waypoints[waypoints.length - 1];
            const segmentLength = Math.sqrt(
                Math.pow(lastSegmentEnd.x - lastSegmentStart.x, 2) + 
                Math.pow(lastSegmentEnd.y - lastSegmentStart.y, 2)
            );
            const arrowOffset = 8 / segmentLength;
            arrowX = lastSegmentEnd.x - (lastSegmentEnd.x - lastSegmentStart.x) * arrowOffset;
            arrowY = lastSegmentEnd.y - (lastSegmentEnd.y - lastSegmentStart.y) * arrowOffset;
        } else {
            // 直线：使用原来的计算方式
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const arrowOffset = 8 / lineLength;
            arrowX = endX - (endX - startX) * arrowOffset;
            arrowY = endY - (endY - startY) * arrowOffset;
        }

        // 更新连接线路径
        line.setAttribute('d', pathData.path);
        line.setAttribute('stroke-linejoin', 'round'); // 让折线转角更圆润

        // 对于折线，在拐点处断开用于放置文字
        if (pathData.isPolyline && waypoints.length === 3) {
            // 两段折线：在拐点处断开
            const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
            const textGap = Math.max(30, textWidth * 0.6); // 调整断开间隙大小
            
            // 计算两段线的长度
            const firstSegmentLength = Math.sqrt(
                Math.pow(waypoints[1].x - waypoints[0].x, 2) + 
                Math.pow(waypoints[1].y - waypoints[0].y, 2)
            );
            const secondSegmentLength = Math.sqrt(
                Math.pow(waypoints[2].x - waypoints[1].x, 2) + 
                Math.pow(waypoints[2].y - waypoints[1].y, 2)
            );
            
            // 在拐点处对称断开
            const halfGap = textGap / 2;
            const firstSegmentVisible = Math.max(0, firstSegmentLength - halfGap);
            const secondSegmentVisible = Math.max(0, secondSegmentLength - halfGap);
            
            // 设置断开模式：第一段可见长度 + 断开间隙 + 第二段可见长度
            line.setAttribute('stroke-dasharray', `${firstSegmentVisible} ${textGap} ${secondSegmentVisible}`);
        } else if (!pathData.isPolyline) {
            // 直线：使用原来的断开效果
            const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
            const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
            const textGap = Math.max(20, textWidth * 0.8);
            const gapStart = (totalLength - textGap) / 2;
            const gapEnd = gapStart + textGap;
            line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
        }

        // 更新标签位置
        linkLabel.setAttribute('x', midX);
        linkLabel.setAttribute('y', midY + 4);

        // 更新箭头位置
        let angle;
        if (waypoints.length > 2) {
            const lastSegmentStart = waypoints[waypoints.length - 2];
            const lastSegmentEnd = waypoints[waypoints.length - 1];
            angle = Math.atan2(lastSegmentEnd.y - lastSegmentStart.y, lastSegmentEnd.x - lastSegmentStart.x);
        } else {
            angle = Math.atan2(endY - startY, endX - startX);
        }

        const arrowAngle1 = angle + Math.PI / 8;
        const arrowAngle2 = angle - Math.PI / 8;

        const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
        const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
        const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
        const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);

        const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
        arrow.setAttribute('d', arrowPath);
    }

// redrawAllLinks
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
            
            // 计算折线路径
            const pathData = calculatePolylinePath(link, currentGraphData.nodes);
            if (!pathData) return;
            
            // 创建带箭头的连接线
            const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            lineGroup.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            
            // 获取路径点
            const waypoints = pathData.waypoints;
            const startX = waypoints[0].x;
            const startY = waypoints[0].y;
            const endX = waypoints[waypoints.length - 1].x;
            const endY = waypoints[waypoints.length - 1].y;
            
            // 计算连接线中点（用于标签位置）
            // 对于折线，使用中间点作为标签位置
            let midX, midY;
            if (waypoints.length === 3) {
                // 两段折线：使用中间点作为标签位置
                midX = waypoints[1].x;
                midY = waypoints[1].y;
            } else {
                // 直线：使用起点和终点的中点
                midX = (startX + endX) / 2;
                midY = (startY + endY) / 2;
            }
            
            // 计算箭头位置
            const arrowLength = 8;
            const arrowWidth = 6;
            
            let arrowX, arrowY;
            if (waypoints.length > 2) {
                // 折线：箭头位置基于最后一段线段
                const lastSegmentStart = waypoints[waypoints.length - 2];
                const lastSegmentEnd = waypoints[waypoints.length - 1];
                const segmentLength = Math.sqrt(
                    Math.pow(lastSegmentEnd.x - lastSegmentStart.x, 2) + 
                    Math.pow(lastSegmentEnd.y - lastSegmentStart.y, 2)
                );
                const arrowOffset = 8 / segmentLength;
                arrowX = lastSegmentEnd.x - (lastSegmentEnd.x - lastSegmentStart.x) * arrowOffset;
                arrowY = lastSegmentEnd.y - (lastSegmentEnd.y - lastSegmentStart.y) * arrowOffset;
            } else {
                // 直线：使用原来的计算方式
                const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const arrowOffset = 8 / lineLength;
                arrowX = endX - (endX - startX) * arrowOffset;
                arrowY = endY - (endY - startY) * arrowOffset;
            }
            
            // 创建连接线路径
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', pathData.path);
            line.setAttribute('stroke', '#aaa');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('stroke-linejoin', 'round'); // 让折线转角更圆润
            
            // 对于折线，在中间点周围断开用于放置文字
            if (pathData.isPolyline && waypoints.length === 3) {
                // 两段折线：在拐点处断开
                const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
                const textGap = Math.max(30, textWidth * 0.6); // 调整断开间隙大小
                
                // 计算两段线的长度
                const firstSegmentLength = Math.sqrt(
                    Math.pow(waypoints[1].x - waypoints[0].x, 2) + 
                    Math.pow(waypoints[1].y - waypoints[0].y, 2)
                );
                const secondSegmentLength = Math.sqrt(
                    Math.pow(waypoints[2].x - waypoints[1].x, 2) + 
                    Math.pow(waypoints[2].y - waypoints[1].y, 2)
                );
                
                // 在拐点处对称断开
                const halfGap = textGap / 2;
                const firstSegmentVisible = Math.max(0, firstSegmentLength - halfGap);
                const secondSegmentVisible = Math.max(0, secondSegmentLength - halfGap);
                
                // 设置断开模式：第一段可见长度 + 断开间隙 + 第二段可见长度
                line.setAttribute('stroke-dasharray', `${firstSegmentVisible} ${textGap} ${secondSegmentVisible}`);
            } else if (!pathData.isPolyline) {
                // 直线：使用原来的断开效果
                const textWidth = Math.max(80, (link.label || '双击编辑').length * 12);
                const totalLength = Math.sqrt(Math.pow(arrowX - startX, 2) + Math.pow(arrowY - startY, 2));
                const textGap = Math.max(20, textWidth * 0.8);
                const gapStart = (totalLength - textGap) / 2;
                const gapEnd = gapStart + textGap;
                line.setAttribute('stroke-dasharray', `${gapStart} ${textGap} ${totalLength - gapEnd}`);
            }
            
            // 创建箭头
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 计算箭头方向（基于最后一段线段）
            let angle;
            if (waypoints.length > 2) {
                const lastSegmentStart = waypoints[waypoints.length - 2];
                const lastSegmentEnd = waypoints[waypoints.length - 1];
                angle = Math.atan2(lastSegmentEnd.y - lastSegmentStart.y, lastSegmentEnd.x - lastSegmentStart.x);
            } else {
                angle = Math.atan2(endY - startY, endX - startX);
            }
            
            const arrowAngle1 = angle + Math.PI / 8;
            const arrowAngle2 = angle - Math.PI / 8;
            
            const arrowPoint1X = arrowX - arrowLength * Math.cos(arrowAngle1);
            const arrowPoint1Y = arrowY - arrowLength * Math.sin(arrowAngle1);
            const arrowPoint2X = arrowX - arrowLength * Math.cos(arrowAngle2);
            const arrowPoint2Y = arrowY - arrowLength * Math.sin(arrowAngle2);
            
            const arrowPath = `M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;
            arrow.setAttribute('d', arrowPath);
            arrow.setAttribute('fill', '#aaa');
            arrow.setAttribute('stroke', '#aaa');
            arrow.setAttribute('stroke-width', '1');
            
            // 创建连接线标签
            const linkLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            linkLabel.setAttribute('x', midX);
            linkLabel.setAttribute('y', midY + 4);
            linkLabel.setAttribute('text-anchor', 'middle');
            linkLabel.setAttribute('font-size', '14');
            linkLabel.setAttribute('fill', '#333');
            linkLabel.setAttribute('font-weight', '500');
            linkLabel.setAttribute('pointer-events', 'all');
            linkLabel.setAttribute('cursor', 'pointer');
            linkLabel.setAttribute('data-link-id', link.id || `link-${link.source}-${link.target}`);
            linkLabel.setAttribute('data-link-label', 'true');
            linkLabel.textContent = link.label || '双击编辑';

            // 连线标签双击编辑
            linkLabel.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                editLinkLabel(link.id || `link-${link.source}-${link.target}`);
            });
            
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



//=============================================================================
// UI交互和状态管理函数
//=============================================================================


// showLoadingAnimation
function showLoadingAnimation() {
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            // 隐藏默认文字
            const defaultText = svg.querySelector('text');
            if (defaultText) {
                defaultText.style.display = 'none';
            }
            
            // 创建SVG加载动画元素
            const loadingGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            loadingGroup.setAttribute('id', 'loading-animation');
            
            // 创建背景矩形
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', '250');
            bgRect.setAttribute('y', '330');
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
            circle.setAttribute('cy', '355');
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
            text.setAttribute('y', '355');
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
        }
    }

// showContentLoadingState
function showContentLoadingState(type, data) {
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
    }

// 辅助函数：HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// updateGenerationInfo
function updateGenerationInfo(type, data, conceptData, aiResponse, aiDescription) {
        const aiIntroText = document.getElementById('aiIntroText');
        if (!aiIntroText) return;
        
        const nodes = conceptData.nodes || [];
        const links = conceptData.links || [];
        const nodeCount = nodes.length;
        const linkCount = links.length;
        
        // 保存原有的介绍文本内容
        const existingText = aiIntroText.querySelector('.streaming-text');
        let introTextContent = '';
        if (existingText) {
            introTextContent = existingText.textContent || existingText.innerHTML;
        }
        
        let html = '<div class="ai-content-display">';
        
        // 如果有介绍文本，先显示介绍文本
        if (introTextContent && introTextContent.trim().length > 0) {
            html += `<div class="ai-section intro-section">`;
            html += `<div class="ai-label">📝 AI生成的介绍文本：</div>`;
            html += `<div class="intro-content" style="padding: 10px; line-height: 1.8; color: #333; font-size: 14px; background: #f8f9fa; border-radius: 4px; margin-top: 8px;">${escapeHtml(introTextContent)}</div>`;
            html += `</div>`;
        }
        
        // 显示概念节点列表
        if (nodes.length > 0) {
            html += `<div class="ai-section">`;
            html += `<div class="ai-label">📦 概念节点（${nodeCount}个）：</div>`;
            html += `<div class="nodes-list">`;
            nodes.forEach((node, index) => {
                const nodeType = node.type === 'main' ? '🔷' : '🔹';
                const nodeLabel = escapeHtml(node.label || '');
                const nodeDesc = node.description ? escapeHtml(node.description) : '';
                html += `<div class="node-item">`;
                html += `<span class="node-icon">${nodeType}</span>`;
                html += `<span class="node-label">${nodeLabel}</span>`;
                if (nodeDesc) {
                    html += `<span class="node-desc"> - ${nodeDesc}</span>`;
                }
                html += `</div>`;
            });
            html += `</div>`;
            html += `</div>`;
        }
        
        // 显示关系连接列表
        if (links.length > 0) {
            html += `<div class="ai-section">`;
            html += `<div class="ai-label">🔗 关系连接（${linkCount}个）：</div>`;
            html += `<div class="links-list">`;
            links.forEach((link, index) => {
                // 查找源节点和目标节点
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                const sourceLabel = sourceNode ? escapeHtml(sourceNode.label) : link.source;
                const targetLabel = targetNode ? escapeHtml(targetNode.label) : link.target;
                const linkLabel = escapeHtml(link.label || '关联');
                
                html += `<div class="link-item">`;
                html += `<span class="link-source">${sourceLabel}</span>`;
                html += `<span class="link-arrow">→</span>`;
                html += `<span class="link-label">${linkLabel}</span>`;
                html += `<span class="link-arrow">→</span>`;
                html += `<span class="link-target">${targetLabel}</span>`;
                html += `</div>`;
            });
            html += `</div>`;
            html += `</div>`;
        }
        
        html += '</div>';
        
        aiIntroText.innerHTML = html;
        aiIntroText.className = 'intro-text';
    }

// updateErrorState
function updateErrorState(type, errorMessage) {
        if (type === 'keyword') {
            const aiIntroText = document.getElementById('aiIntroText');
            if (aiIntroText) {
                aiIntroText.innerHTML = `<div class="keyword-mode-display error">
                    <h5>概念图生成失败</h5>
                    <p>${errorMessage}</p>
                    <p class="retry-hint">建议：稍等片刻后重试，或尝试更简单的焦点问题</p>
                </div>`;
            }
        }
    }

// hideLoadingState
function hideLoadingState() {
        const svg = document.querySelector('.concept-graph');
        if (svg) {
            // 移除上方加载动画
            const loadingGroup = svg.querySelector('#loading-animation');
            if (loadingGroup) {
                loadingGroup.remove();
                console.log('上方加载动画已移除');
            }
        }
    }

// ensureCanvasVisible
function ensureCanvasVisible() {
        console.log('ensureCanvasVisible 被调用');
        
        if (window.graphPlaceholder) {
            window.graphPlaceholder.style.display = 'none';
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
        
        if (window.editToolbar) {
            window.editToolbar.style.display = 'grid';
            console.log('编辑工具栏已显示');
        } else {
            console.error('editToolbar 元素未找到');
        }
    }

// ensureGraphInitialized
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

// updateHistoryButtons
function updateHistoryButtons() {
        console.log('updateHistoryButtons 被调用');
        
        if (window.undoBtn) {
            window.undoBtn.disabled = currentHistoryIndex <= 0;
            console.log('撤销按钮状态:', window.undoBtn.disabled);
        } else {
            console.error('undoBtn 元素未找到');
        }
        
        if (window.redoBtn) {
            window.redoBtn.disabled = currentHistoryIndex >= operationHistory.length - 1;
            console.log('重做按钮状态:', window.redoBtn.disabled);
        } else {
            console.error('redoBtn 元素未找到');
        }
    }

// updateStatusBar
function updateStatusBar(data) {
        console.log('updateStatusBar 被调用，数据:', data);
        
        if (window.nodeCountSpan) {
            window.nodeCountSpan.textContent = `节点: ${data.nodes.length}`;
            console.log('节点数量已更新:', data.nodes.length);
        } else {
            console.error('nodeCountSpan 元素未找到');
        }
        
        if (window.linkCountSpan) {
            window.linkCountSpan.textContent = `连线: ${data.links.length}`;
            console.log('连线数量已更新:', data.links.length);
        } else {
            console.error('linkCountSpan 元素未找到');
        }
    }

// showLoadingState
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

// displayFocusQuestion
function displayFocusQuestion() {
        const svg = document.querySelector('.concept-graph');
        if (!svg || !window.focusQuestion) return;
        
        // 移除已存在的焦点问题框
        const existingFocusQuestion = svg.querySelector('#focus-question');
        if (existingFocusQuestion) {
            existingFocusQuestion.remove();
        }
        
        // 获取SVG的实际尺寸和viewBox
        const svgRect = svg.getBoundingClientRect();
        const svgWidth = svgRect.width || 800;
        const svgHeight = svgRect.height || 700;
        
        // 获取当前viewBox信息
        const viewBox = svg.getAttribute('viewBox');
        let viewBoxX = 0;
        let viewBoxY = 0;
        let viewBoxWidth = svgWidth;
        let viewBoxHeight = svgHeight;
        
        if (viewBox) {
            const viewBoxParts = viewBox.split(' ');
            if (viewBoxParts.length === 4) {
                viewBoxX = parseFloat(viewBoxParts[0]);
                viewBoxY = parseFloat(viewBoxParts[1]);
                viewBoxWidth = parseFloat(viewBoxParts[2]);
                viewBoxHeight = parseFloat(viewBoxParts[3]);
            }
        }
        
        // 分别设置左右和上下边距 - 与assignCoordinates函数中保持一致
        const horizontalMargin = 20; // 左右边距：最小化，与sugiyama-layout.js保持一致
        const topMargin = 40; // 顶部间距，让焦点问题框靠近第一层节点
        
        // 计算焦点问题框的尺寸和位置（考虑viewBox的偏移）
        const focusBoxWidth = Math.max(400, viewBoxWidth - 2 * horizontalMargin); // 确保最小宽度
        const focusBoxHeight = 60; // 增加高度
        const focusBoxX = viewBoxX + (viewBoxWidth - focusBoxWidth) / 2; // 水平居中，考虑viewBox偏移
        const focusBoxY = viewBoxY + topMargin;
        
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
    focusText.setAttribute('x', viewBoxX + viewBoxWidth / 2); // 水平居中，考虑viewBox偏移
    focusText.setAttribute('y', focusBoxY + focusBoxHeight / 2); // 垂直居中
    focusText.setAttribute('text-anchor', 'middle');
    focusText.setAttribute('dominant-baseline', 'middle');
    focusText.setAttribute('font-size', '28');
    focusText.setAttribute('font-weight', '600');
    focusText.setAttribute('fill', '#2c3e50');
    
    // 检测文字宽度并自动调整以适应文本框
    const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tempText.setAttribute('font-size', '28');
    tempText.setAttribute('font-weight', '600');
    tempText.textContent = window.focusQuestion;
    focusGroup.appendChild(tempText);
    
    const textBBox = tempText.getBBox();
    const textWidth = textBBox.width;
    const maxTextWidth = focusBoxWidth - 40; // 留出左右20px的内边距
    
    let finalFontSize = 28;
    if (textWidth > maxTextWidth) {
        // 文字宽度超出，需要缩小字体
        finalFontSize = Math.max(14, Math.floor(28 * maxTextWidth / textWidth));
        focusText.setAttribute('font-size', finalFontSize);
        console.log(`焦点问题文字过长，字体大小从28px调整为${finalFontSize}px`);
    }
    
    focusText.textContent = window.focusQuestion;
    focusGroup.removeChild(tempText);
        
        // 将元素添加到组中
        focusGroup.appendChild(bgRect);
        focusGroup.appendChild(focusText);
        
        // 添加拖拽功能
        makeFocusQuestionDraggable(focusGroup, bgRect, focusText, focusBoxWidth, focusBoxHeight);
        
        // 将焦点问题组添加到SVG的最前面
        svg.insertBefore(focusGroup, svg.firstChild);
        
        console.log('焦点问题已显示:', window.focusQuestion, '位置:', { 
            x: focusBoxX, y: focusBoxY, width: focusBoxWidth, 
            viewBoxWidth, viewBoxHeight, svgWidth, svgHeight 
        });
    }

// 使焦点问题框可拖拽
function makeFocusQuestionDraggable(focusGroup, bgRect, focusText, width, height) {
    let isDragging = false;
    let startX, startY;
    let currentX, currentY;
    
    // 设置初始位置
    currentX = parseFloat(bgRect.getAttribute('x'));
    currentY = parseFloat(bgRect.getAttribute('y'));
    
    // 设置样式，显示可拖拽
    focusGroup.style.cursor = 'move';
    
    // 鼠标按下事件
    focusGroup.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        
        // 获取SVG坐标
        const svg = focusGroup.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        // 记录起始位置
        startX = svgP.x - currentX;
        startY = svgP.y - currentY;
        
        // 改变样式
        focusGroup.style.cursor = 'grabbing';
        bgRect.setAttribute('fill-opacity', '1.0');
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // 获取SVG坐标
        const svg = focusGroup.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        // 计算新位置
        currentX = svgP.x - startX;
        currentY = svgP.y - startY;
        
        // 更新位置
        bgRect.setAttribute('x', currentX);
        bgRect.setAttribute('y', currentY);
        
        // 更新文字位置（保持在矩形中心）
        focusText.setAttribute('x', currentX + width / 2);
        focusText.setAttribute('y', currentY + height / 2);
    });
    
    // 鼠标松开事件
    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            isDragging = false;
            focusGroup.style.cursor = 'move';
            bgRect.setAttribute('fill-opacity', '0.9');
        }
    });
    
    // 触摸事件支持（移动端）
    focusGroup.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        isDragging = true;
        
        const svg = focusGroup.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        startX = svgP.x - currentX;
        startY = svgP.y - currentY;
        
        bgRect.setAttribute('fill-opacity', '1.0');
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        const svg = focusGroup.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        currentX = svgP.x - startX;
        currentY = svgP.y - startY;
        
        bgRect.setAttribute('x', currentX);
        bgRect.setAttribute('y', currentY);
        focusText.setAttribute('x', currentX + width / 2);
        focusText.setAttribute('y', currentY + height / 2);
    });
    
    document.addEventListener('touchend', function(e) {
        if (isDragging) {
            isDragging = false;
            bgRect.setAttribute('fill-opacity', '0.9');
        }
    });
}

// showMessage
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

// updateNodeOperationButtons
function updateNodeOperationButtons() {
        console.log('updateNodeOperationButtons 被调用，selectedNodeId:', selectedNodeId);
        
        if (window.deleteNodeBtn) {
            window.deleteNodeBtn.disabled = !selectedNodeId;
            console.log('删除节点按钮状态:', window.deleteNodeBtn.disabled);
        } else {
            console.error('deleteNodeBtn 元素未找到');
        }
        
        if (window.editNodeBtn) {
            window.editNodeBtn.disabled = !selectedNodeId;
            console.log('编辑节点按钮状态:', window.editNodeBtn.disabled);
        } else {
            console.error('editNodeBtn 元素未找到');
        }
    }

