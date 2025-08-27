
const resource = {
    image:{
        // 游戏资源设置
        shoot :          'shoot',
        broken :         'broken',
        tank :           'tank',
        enemytank :      'enemytank',
        bullet :         'bullet',
        wall :           'wall',
        steelwall :      'steelwall',
        water :          'water',
        tree :           'tree',
        base :           'base', 
        playerspawn :    'playerspawn',
        enemyspawn :     'enemyspawn'
    },
    audio:{
        click :        'click',
        complete :     'complete',
        score :        'score',
    },
    window:{
        CELL_SIZE :   32,// 单元格大小
        GRID_WIDTH :  41,
        GRID_HEIGHT : 25,
    },
    tileType:{          //注意: 此处的ID必须与Tiled map中的index严格对应,在layer中空白的地方是 -1，但是在json中空白的地方是 0
        None: -1,       //空白区
        WATER:1,        //水（可能不需要碰撞）
        WALL:2,         //墙（通常需要碰撞）
        TREE:3,         //树（通常需要碰撞）
        STEELWALL:4,    //钢墙（已设置碰撞属性）
        BASE:5,         //基地（可能需要碰撞）
        PLAYERSPAWN:6,  //玩家出生点（无需碰撞）
        ENEMYSPAWN:7    //敌人出生点（无需碰撞）
    },
    camp:{               // 阵营
        RED:1,           // 红方（玩家）
        BLUE:2           // 蓝方 (敌人坦克）
    }
};
