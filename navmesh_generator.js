class AutoNavMeshGenerator {
    /**
     * 从瓦片地图生成导航网格（支持内部障碍物）
     * @param {Phaser.Tilemaps.Tilemap} map - Phaser瓦片地图对象
     * @param {string} layerName - 要分析的图层名称
     * @param {number} passableIndex - 可通行瓦片的index（默认为0）
     * @returns {object} 导航网格数据
     */
    static generateFromTilemap(map, layerName,layerIns, passableIndex = 0) {
        const layer = map.getLayer(layerName);
        if (!(layerIns instanceof Phaser.Tilemaps.TilemapLayer)) {
            console.error(`图层 ${layerName} 不是瓦片图层`);
            return null;
        }

        // 1. 创建网格数据矩阵（标记可通行区域和障碍物）
        const grid = this.createGridMatrix(layer,layerIns, passableIndex);
        
        // 2. 找到所有连通的可通行区域（包含内部障碍物处理）
        const regions = this.findConnectedRegions(grid);
        
        // 3. 为每个区域生成带孔洞的多边形（支持内部障碍物）
        const polygons = regions.map(region => 
            this.regionToPolygonWithHoles(region, grid, layer.tileWidth, layer.tileHeight)
        );

        return {
            version: 1,
            polygons: polygons.filter(p => p !== null)
        };
    }

    /**
     * 创建网格矩阵，标记可通行区域(1)和障碍物(0)
     */
    static createGridMatrix(layer,layerIns, passableIndex) {
        const { width, height } = layer;
        const grid = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const tile = layerIns.getTileAt(x, y);  // 空白区域中 tile 为 null
                //if(tile)
                // 标记可通行区域为1，障碍物为0
                row.push(tile == null? 1:0);
            }
            grid.push(row);
        }
        
        return grid;
    }

    /**
     * 查找所有连通区域（包含处理内部障碍物）
     */
    static findConnectedRegions(grid) {
        const regions = [];
        const visited = new Array(grid.length)
            .fill(0)
            .map(() => new Array(grid[0].length).fill(false));

        // 首先标记所有外部可通行区域
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === 1 && !visited[y][x]) {
                    const region = this.floodFill(grid, x, y, visited, 1);
                    regions.push({
                        main: region,
                        holes: this.findHolesInRegion(region, grid, visited)
                    });
                }
            }
        }
        
        return regions;
    }

    /**
     * 查找区域内部的障碍物（孔洞）
     */
    static findHolesInRegion(region, grid, mainVisited) {
        const holes = [];
        const tempVisited = JSON.parse(JSON.stringify(mainVisited)); // 复制已访问标记
        
        // 标记区域边界
        const regionSet = new Set(region.map(p => `${p.x},${p.y}`));
        
        // 查找被可通行区域完全包围的障碍物
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                // 障碍物且未被访问，且不在主区域内
                if (grid[y][x] === 0 && !tempVisited[y][x] && !regionSet.has(`${x},${y}`)) {
                    // 检查是否是被包围的孔洞（不接触地图边缘）
                    if (this.isHole(grid, x, y, tempVisited)) {
                        const hole = this.floodFill(grid, x, y, tempVisited, 0);
                        holes.push(hole);
                    }
                }
            }
        }
        
        return holes;
    }

    /**
     * 判断障碍物是否是被包围的孔洞（不接触地图边缘）
     */
    static isHole(grid, x, y, visited) {
        const queue = [{x, y}];
        const tempVisited = new Set([`${x},${y}`]);
        visited[y][x] = true;
        
        while (queue.length > 0) {
            const {x: cx, y: cy} = queue.shift();
            
            // 检查是否接触地图边缘（接触边缘的障碍物不是孔洞）
            if (cx === 0 || cy === 0 || cx === grid[0].length - 1 || cy === grid.length - 1) {
                return false;
            }
            
            // 四方向检查
            const directions = [[-1,0],[1,0],[0,-1],[0,1]];
            for (const [dx, dy] of directions) {
                const nx = cx + dx;
                const ny = cy + dy;
                const key = `${nx},${ny}`;
                
                if (grid[ny][nx] === 0 && !tempVisited.has(key)) {
                    tempVisited.add(key);
                    visited[ny][nx] = true;
                    queue.push({x: nx, y: ny});
                }
            }
        }
        
        return true;
    }

    /**
     * 泛洪填充算法
     */
    static floodFill(grid, startX, startY, visited, targetValue) {
        const region = [];
        const queue = [{x: startX, y: startY}];
        const width = grid[0].length;
        const height = grid.length;
        
        if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
            return region;
        }
        
        visited[startY][startX] = true;
        region.push({x: startX, y: startY});
        
        const directions = [[-1,0],[1,0],[0,-1],[0,1]];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && ny >= 0 && nx < width && ny < height && 
                    !visited[ny][nx] && grid[ny][nx] === targetValue) {
                    visited[ny][nx] = true;
                    queue.push({x: nx, y: ny});
                    region.push({x: nx, y: ny});
                }
            }
        }
        
        return region;
    }

    /**
     * 生成包含孔洞的多边形（支持内部障碍物）
     */
    static regionToPolygonWithHoles(region, grid, tileWidth, tileHeight) {
        // 1. 生成主区域的边界多边形
        const mainPolygon = this.traceBoundary(region.main, grid);
        if (!mainPolygon || mainPolygon.length < 3) {
            return null;
        }
        
        // 2. 生成每个孔洞的边界多边形（方向与主多边形相反）
        const holePolygons = region.holes.map(hole => this.traceBoundary(hole, grid, true)).filter(p => p && p.length >= 3);
        
        // 3. 转换为世界坐标
        const convertToWorld = (point) => ({
            x: point.x * tileWidth,
            y: point.y * tileHeight
        });
        
        return {
            vertices: mainPolygon.map(convertToWorld),
            holes: holePolygons.map(hole => hole.map(convertToWorld))
        };
    }

    /**
     * 边界追踪算法（生成精确的多边形边界）
     */
    static traceBoundary(region, grid, isHole = false) {
        if (region.length === 0) return null;
        
        // 将区域转换为集合便于查找
        const regionSet = new Set(region.map(p => `${p.x},${p.y}`));
        
        // 找到起始点（最左下方的点）
        const startPoint = region.reduce((min, p) => 
            (p.y < min.y || (p.y === min.y && p.x < min.x)) ? p : min, region[0]);
        
        let current = {x: startPoint.x, y: startPoint.y};
        let direction = 0; // 0:上, 1:右, 2:下, 3:左（顺时针方向）
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 方向向量
        const boundary = [];
        const startKey = `${current.x},${current.y}`;
        let steps = 0;
        const maxSteps = region.length * 4; // 防止无限循环
        
        do {
            boundary.push({...current});
            
            // 尝试按顺时针方向找到下一个边界点
            let found = false;
            for (let i = 0; i < 4; i++) {
                // 计算当前方向和偏移（根据是否为孔洞反转方向）
                const dirIndex = isHole ? 
                    (direction - i + 4) % 4 : 
                    (direction + i) % 4;
                const [dx, dy] = directions[dirIndex];
                
                const nx = current.x + dx;
                const ny = current.y + dy;
                const nextKey = `${nx},${ny}`;
                
                // 检查相邻点是否在区域内
                const isInRegion = regionSet.has(nextKey);
                
                if (isInRegion) {
                    // 找到下一个点，更新方向
                    current = {x: nx, y: ny};
                    direction = (dirIndex - 1 + 4) % 4; // 调整方向
                    found = true;
                    break;
                }
            }
            
            if (!found) break;
            steps++;
        } while (`${current.x},${current.y}` !== startKey && steps < maxSteps);
        
        // 确保多边形闭合且有足够的顶点
        if (boundary.length >= 3 && 
            `${boundary[0].x},${boundary[0].y}` === `${current.x},${current.y}`) {
            return boundary;
        }
        
        return null;
    }
}
    