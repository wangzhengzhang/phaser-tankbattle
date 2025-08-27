// 基于TiledMap 网格的 A* 算法实现路径规划算法

class AStarPathfinder {
    constructor(layer) {
        this.layer = layer;
        this.tileWidth = layer.tileWidth;
        this.tileHeight = layer.tileHeight;
    }

    // 世界坐标转网格坐标
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.tileWidth),
            y: Math.floor(y / this.tileHeight)
        };
    }

    // 网格坐标转世界坐标（中心位置）
    gridToWorld(x, y) {
        return {
            x: x * this.tileWidth + this.tileWidth / 2,
            y: y * this.tileHeight + this.tileHeight / 2
        };
    }

    // 检查瓦片是否可通行
    isPassable(x, y) {
        const tile = this.layer.data[y][x];
        // 瓦片存在且没有碰撞属性
        return (tile.index == resource.tileType.None || tile.index == resource.tileType.PLAYERSPAWN || tile.index == resource.tileType.ENEMYSPAWN)? 1:0;
    }

    // A* 核心算法
    // 输入：世界坐标，返回：世界坐标
    findPath(startX, startY, endX, endY) {
        // 转换为网格坐标
        const startGrid = this.worldToGrid(startX, startY);
        const endGrid = this.worldToGrid(endX, endY);

        // 起点或终点不可通行，返回null
        if (!this.isPassable(startGrid.x, startGrid.y) || !this.isPassable(endGrid.x, endGrid.y)) {
            return null;
        }

        // 开放列表（待检查的节点）和封闭列表（已检查的节点）
        const openList = new Set();
        const closedList = new Set();
        const startKey = `${startGrid.x},${startGrid.y}`;
        openList.add(startKey);

        // 存储节点信息：g代价（起点到当前）、h代价（当前到终点）、父节点
        const nodes = {
            [startKey]: {
                x: startGrid.x,
                y: startGrid.y,
                g: 0,
                h: this.heuristic(startGrid.x, startGrid.y, endGrid.x, endGrid.y),
                parent: null
            }
        };

        while (openList.size > 0) {
            // 从开放列表中找f代价最小的节点
            let currentKey = null;
            let currentF = Infinity;
            openList.forEach(key => {
                const node = nodes[key];
                const f = node.g + node.h;
                if (f < currentF) {
                    currentF = f;
                    currentKey = key;
                }
            });

            if (!currentKey) break;

            const current = nodes[currentKey];
            openList.delete(currentKey);
            closedList.add(currentKey);

            // 到达终点，回溯路径
            if (current.x === endGrid.x && current.y === endGrid.y) {
                return this.reconstructPath(current, nodes);
            }

            // 检查四个方向的邻居
            const neighbors = [
                { x: current.x - 1, y: current.y }, // 左
                { x: current.x + 1, y: current.y }, // 右
                { x: current.x, y: current.y - 1 }, // 上
                { x: current.x, y: current.y + 1 }  // 下
                // 可选：添加对角线移动 {x: current.x-1, y: current.y-1} 等
            ];

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                // 跳过封闭列表或不可通行的节点
                if (closedList.has(neighborKey) || !this.isPassable(neighbor.x, neighbor.y)) {
                    continue;
                }

                // 计算g代价（当前路径到邻居的代价）
                const tentativeG = current.g + 1; // 假设每步代价为1

                // 如果邻居不在开放列表，或新路径代价更低
                if (!openList.has(neighborKey) || tentativeG < (nodes[neighborKey]?.g || Infinity)) {
                    // 更新邻居节点信息
                    nodes[neighborKey] = {
                        x: neighbor.x,
                        y: neighbor.y,
                        g: tentativeG,
                        h: this.heuristic(neighbor.x, neighbor.y, endGrid.x, endGrid.y),
                        parent: currentKey
                    };
                    openList.add(neighborKey);
                }
            }
        }

        // 找不到路径
        return null;
    }

    // 启发函数（估算当前点到终点的代价，这里用曼哈顿距离）
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // 回溯重建路径
    reconstructPath(endNode, nodes) {
        const path = [];
        let currentKey = `${endNode.x},${endNode.y}`;

        while (currentKey) {
            const node = nodes[currentKey];
            path.push(this.gridToWorld(node.x, node.y)); // 转换为世界坐标
            currentKey = node.parent;
        }

        // 反转路径（从起点到终点）
        return path.reverse();
    }
}
    