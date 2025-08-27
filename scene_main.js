// 坦克大战游戏主文件，游戏场景

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    console.log("construct main scene.");
  }

  init() {
    console.log("init main scene.");
    // show debug mode
    // this.index_of_player = 6; // TiledMap地图中的玩家位置索引
    // this.index_of_base = 5; // TiledMap地图中的基地索引

    // 音效
    this.sounds = {};
    // 输入控制
    this.cursors = null;
    this.spaceKey = null;

    // 游戏对象
    this.player = null;
    this.enemies = null; // 敌人组
    this.enemyBullets = null; // 敌人子弹组
    this.bullets = null; // 子弹组

    // this.walls = [];
    // this.base = null;
    // this.gameMap = [];
    this.enemySpawnPoints = []; // 敌人出生地
    this.playerSpawnX = 0; // 玩家出生地
    this.playerSpawnY = 0;
    this.baseX = 0;        // 基地位置
    this.baseY = 0;    
    this.enemiesPerLevel = 6; // 每个关增加的敌人数量
  }

  create() {
    // 保存场景引用
    //this.scene = this;

    // 直接初始化，不等待
    try {
      // 初始化音效（如果失败也没关系）
      try {
        if (this.sounds && this.sound.add) {
          this.sounds.shoot = this.sound.add("shoot");
          this.sounds.broken = this.sound.add("broken");
          this.sounds.click = this.sound.add("click");
          this.sounds.complete = this.sound.add("complete");
          this.sounds.score = this.sound.add("score");
        }
      } catch (soundError) {
        console.warn("init audio failed:", soundError);
        this.sounds.shoot = { play: () => {} };
        this.sounds.broken = { play: () => {} };
        this.sounds.click = { play: () => {} };
        this.sounds.complete = { play: () => {} };
        this.sounds.score = { play: () => {} };
      }

      // 载入aseprite动画
      this.anims.createFromAseprite('tank');
      const moveAnim = this.anims.get('move'); 
      moveAnim.repeat = -1; // 只有使用这种方式才能有效设置无限循环播放


      // 初始化输入
      if (this.input && this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.AKey = this.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes.A
        );
      }
      //this.sceneReady = true;

      // 3. 创建子弹组（管理子弹，自动回收）
      this.bullets = this.physics.add.group({
        //classType: Bullet,
        key: "bullet",
        //maxSize: 20, // 最大子弹数量（避免内存溢出）
        //runChildUpdate: true,
        visible: false, // 默认隐藏所有新创建的精灵
      });
      this.bullets.clear(true, true); // 清理一下，不知道为什么这里会默认会自动创建一个元素

      // 2. 创建敌人组（管理多个敌人）
      this.enemies = this.physics.add.group({
        // classType: Phaser.Physics.Arcade.Sprite,
        key: "enemytank",
        //repeat: 9, // 创建 10 个敌人
        //setXY: { x: 50, y: 100, stepX: 70 }, // 均匀分布
        runChildUpdate: true,
        setCollideWorldBounds: true,
        visible: false, // 默认隐藏所有新创建的精灵
      });
      this.enemies.clear(true, true);
      // 2. 创建敌人组子弹组（管理多）
      this.enemiesBullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        key: "bullet",
        //repeat: 9, // 创建 10 个敌人
        //setXY: { x: 50, y: 100, stepX: 70 }, // 均匀分布
        //runChildUpdate: true,
        visible: false, // 默认隐藏所有新创建的精灵
      });
      this.enemiesBullets.clear(true, true);

      // 初始化管理器
      this.worldBoundsManager = new WorldBoundsManager(this);
      this.bulletCollisionManager = new BulletCollisionManager(this);

      console.log("create main scene success.");
    } catch (error) {
      console.error("create scene main failed:", error);
      // 即使初始化失败，也标记为准备好，避免无限循环
      //this.sceneReady = true;
    }
  }

  // 关卡地图数据
  getLevelMap(level) {
    return this.createLevel1();


  }

  // 清理地图的方法
  clearMap() {
    if (!this.map) return;
    // 1. 销毁所有图层
    // var layers = this.map.layers;
    // if (layers && layers.length > 0) {
    //   layers.forEach((layer) => {
    //     if (layer && !layer.destroyed) {
    //       layer.destroy();
    //     }
    //   });
    // }
    // layers = []; // 清空数组

    this.playerBackgroundCollisionManager.destroy();
    this.bulletBackgroundCollisionManager.destroy();
    this.enemyTankBackgroundCollisionManager.destroy();


    if (this.layer_bg) {
      this.layer_bg.destroy();
      this.layer_bg = null;
    }

    // 2. 销毁地图对象
    //this.map.clear();
    this.map.destroy();
    this.map = null;
  }

  createLevel1() {
    // 简单的关卡 - 主要用于教学

    this.map = this.make.tilemap({ key: "map" });

    console.log("layers in map:", this.map.layers.map((layer) => layer.name)
    );

    const tileset1 = this.map.addTilesetImage("tileset_base", "base");
    const tileset2 = this.map.addTilesetImage(
      "tileset_enemyspawn",
      "enemyspawn"
    );
    const tileset3 = this.map.addTilesetImage(
      "tileset_playerspawn",
      "playerspawn"
    );
    const tileset4 = this.map.addTilesetImage("tileset_steelwall", "steelwall");
    const tileset5 = this.map.addTilesetImage("tileset_tree", "tree");
    const tileset6 = this.map.addTilesetImage("tileset_wall", "wall");
    const tileset7 = this.map.addTilesetImage("tileset_water", "water");

    this.layer_bg = this.map.createLayer(
      "layer__static_background",
      [
        tileset1,
        tileset2,
        tileset3,
        tileset4,
        tileset5,
        tileset5,
        tileset6,
        tileset7,
      ],
      0,
      0
    );
    if (this.layer_bg) console.log("create background layer success.");
    else {
      console.log("create background layer failed.");
      return;
    }


    // 获取 player 位置
    // 开启此层的调试模式
    // 手动绘制碰撞边界框
    this.layer_bg.forEachTile((tile) => {
      if (tile.index == resource.tileType.PLAYERSPAWN) {
        // 玩家出生地
        this.playerSpawnX = tile.x;
        this.playerSpawnY = tile.y;
      }
      else if (tile.index == resource.tileType.ENEMYSPAWN) {
        // 敌方坦克出生地
        this.enemySpawnPoints.push({ x: tile.x, y: tile.y });
      }
      else if(tile.index == resource.tileType.BASE) {
        this.baseX = tile.x;
        this.baseY = tile.y;
      }

      if (this.isShowDebugMode) {
        // 显示debug的线框
        if ([1, 2, 3, 4].includes(tile.index)) {
          const rect = new Phaser.Geom.Rectangle(
            tile.pixelX,
            tile.pixelY,
            this.map.tileWidth,
            this.map.tileHeight
          );
          this.add.graphics().lineStyle(2, 0xff0000, 1).strokeRectShape(rect);
        }
      }
    });

    var r = this.layer_bg.setCollision([resource.tileType.WATER, resource.tileType.WALL, resource.tileType.TREE, resource.tileType.STEELWALL,resource.tileType.BASE]);

    // 设置子弹组与背景的碰撞（钢墙，土墙，树，水）
    this.bulletBackgroundCollisionManager = new BulletBackgroundCollisionManager(this);

    // 设置敌方坦克背景的碰撞 （刚强，土墙，树，水）
    this.enemyTankBackgroundCollisionManager = new EnemyTankBackgroundCollisionManager(this);

    // 初始化路径规划算法A*
    if(!this.astar)this.astar = new AStarPathfinder(this.layer_bg.layer);

    return this.map;
  }

   // 让角色沿路径移动
    moveCharacterAlongPath(path) {
        this.tweens.chain({
            targets: this.player,
            tweens: path.map((point, index) => ({
                x: point.x,
                y: point.y,
                duration: 300,
                ease: 'Linear',
                // 最后一个点完成后停止
                onComplete: index === path.length - 1 ? () => {} : null
            }))
        });
    }


  initGame() {
    // 清理现有对象
    this.clearGameObjects();

    // 重置游戏状态
    game.score = 0;
    game.lives = 3;
    game.enemiesDestroyed = 0;
    game.levelStartTime = Date.now();

    // 创建地图
    this.createMap(game.currentLevel);

    // 创建玩家
    this.createPlayer();

    // 生成敌人
    this.spawnEnemies();

    // 更新UI
    game.updateUI();
  }

  // 清理组的核心方法
  clearGroup(group) {
    if (!group) return;

    // 销毁所有子对象
    group.children.iterate((child) => {
      if (child && child.active) {
        child.destroy(); // 销毁精灵及其物理体
      }
    });
    // 清空组（第一个true：销毁子对象，第二个true：从显示列表移除）
    group.clear(true, true);
  }

  clearGameObjects() {
    // 清理敌人
    this.clearGroup(this.enemies);
    //this.enemies = null;

    // 清理敌人的子弹
    this.clearGroup(this.enemiesBullets);
    //this.enemiesBullets = null;

    if (this.player) {
      this.player.destroy();
    }
    this.player = null;

    if(this.bulletPlayerCollisionManager) {
      this.bulletPlayerCollisionManager.destroy();
      this.bulletPlayerCollisionManager = null;
    }

    this.clearMap(); // 创建地图之前先清理之前的地图

    //this.map.clear();
  }

  createGrid() {
    // 网格配置
    const gridConfig = {
      cellWidth: resource.window.CELL_SIZE, // 单元格宽度
      cellHeight: resource.window.CELL_SIZE, // 单元格高度
      color: 0x303030, // 网格线颜色
      alpha: 0.5, // 网格线透明度
      thickness: 1, // 网格线粗细
    };

    // 创建 Graphics 对象用于绘制网格createGrid
    const grid = this.add.graphics();

    // 设置网格线样式
    grid.lineStyle(gridConfig.thickness, gridConfig.color, gridConfig.alpha);

    // 绘制垂直线
    for (let x = 0; x <= this.game.config.width; x += gridConfig.cellWidth) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, this.game.config.height);
      grid.closePath();
      grid.strokePath();
    }

    // 绘制水平线
    for (let y = 0; y <= this.game.config.height; y += gridConfig.cellHeight) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(this.game.config.width, y);
      grid.closePath();
      grid.strokePath();
    }

    // 可选：绘制原点标记(测试标记位置使用)
    // const originMarker = this.add.graphics();
    // originMarker.fillStyle(0xff0000, 1);
    // originMarker.fillCircle(100, 100, 5);
  }

  createMap(level) {
    // 获取当前关卡的地图数据
    this.getLevelMap(level);
    this.createGrid();
    //this.createNavMesh();
  }

  createPlayer() {
    if (this.playerSpawnX === 0 && this.playerSpawnY === 0) {
      // 如果没有定义出生点，使用默认位置
      this.playerSpawnX = Math.floor(this.GRID_WIDTH / 2);
      this.playerSpawnY = this.GRID_HEIGHT - 5;
    }
    // this.player = this.physics.add.sprite(, 'tank');

    this.player = new Player(
      this,
      (this.playerSpawnX + 0.5) * resource.window.CELL_SIZE,
      (this.playerSpawnY + 0.5) * resource.window.CELL_SIZE
    );
    this.playerBackgroundCollisionManager = new PlayerBackgroundCollisionManager(this);
    this.bulletPlayerCollisionManager = new BulletPlayerCollisionManager(this);

    // if(!this.astar)this.astar = new AStarPathfinder(this.layer_bg.layer);
    // var path = this.astar.findPath(this.playerSpawnX * resource.window.CELL_SIZE, this.playerSpawnY * resource.window.CELL_SIZE, ( 3)* resource.window.CELL_SIZE,( 3)* resource.window.CELL_SIZE);
      
    // //开始执行规划的路径
    // if(path)
    // { 
    //   var executor = new PathExecutor(this.player);
    //   executor.setPath(path);
    //   executor.start();
    //   this.player.setPathExecutor(executor);
    // }

    this.player.play('move');
}

  spawnEnemies() {
    //return;
    const enemyCount = this.enemiesPerLevel  * game.currentLevel;
    console.log("spawn enemies: " + enemyCount);

    for (let i = 0; i < enemyCount; i++) {
      setTimeout(() => {
        if (this.gameState === this.GAME_STATE_PLAYING) {
          this.createEnemy();
        }
      }, i * (2000 -  100*game.currentLevel)); // 每2秒生成一个敌人
    }
  }

  fireBullet(owner) {
    const bullet = new Bullet(this, owner.x, owner.y, owner.rotation); // direction,子弹方向与玩家的移动方向一致
    bullet.camp = owner.camp; // 子弹阵营与自己相同，后面处理碰撞时可以忽略己方发出的子弹。
    this.sounds.shoot.play();
  }

  createEnemy() {
    let x, y;

    //在三个位置中选择一个随机位置生成敌人
    if (this.enemySpawnPoints.length > 0) {
      // 使用预定义的出生点
      const spawnPoint =
        this.enemySpawnPoints[
          Math.floor(Math.random() * this.enemySpawnPoints.length)
        ];
      x = spawnPoint.x;
      y = spawnPoint.y;
    } else {
      // 在顶部随机位置生成敌人
      x = Math.floor(Math.random() * (resource.window.GRID_WIDTH - 4)) + 2;
      y = 2;
    }

    const enemy = new EnemyTank(
      this,
      (x + 0.5) * resource.window.CELL_SIZE,
      (y + 0.5)* resource.window.CELL_SIZE
    );

    // 规划自动行使的路径
    var path = this.astar.findPath(x * resource.window.CELL_SIZE, y * resource.window.CELL_SIZE, ( this.baseX)* resource.window.CELL_SIZE,( this.baseY - 4)* resource.window.CELL_SIZE);
      
    // 开始执行规划的路径
    if(path)
    { 
      var executor = new PathExecutor(enemy);
      executor.setPath(path);
      enemy.setPathExecutor(executor);
      executor.start();
    }
  }

  updateTankRotation(tank) {
    let rotation = 0;
    if (tank.direction) {
      switch (tank.direction) {
        case "up":
          rotation = 0;
          break;
        case "right":
          rotation = Math.PI / 2;
          break;
        case "down":
          rotation = Math.PI;
          break;
        case "left":
          rotation = -Math.PI / 2;
          break;
      }
      tank.sprite.rotation = rotation;
    }
  }

  update(time, delta) {
    // 如果游戏暂停，不执行任何更新逻辑
    if (game.gameState != game.GAME_STATE_PLAYING) return;

    if (!this.player) return;
    this.player.update(time, delta);

    //更新时间显示
    game.updateTimeDisplay();
    game.updateUI();
    this.checkLevelComplete();
  }


  changeEnemyDirection(enemy) {
    const directions = ["up", "down", "left", "right"];
    const currentIndex = directions.indexOf(enemy.direction);
    const newDirections = directions.filter((d, i) => i !== currentIndex);
    enemy.direction =
      newDirections[Math.floor(Math.random() * newDirections.length)];
    this.updateTankRotation(enemy);
  }

  respawnPlayer() {
    // 重置玩家位置到出生点
    this.player.x = this.playerSpawnX;
    this.player.y = this.playerSpawnY;
    this.player.direction = "up";
    this.player.sprite.x = this.player.x * resource.window.CELL_SIZE;
    this.player.sprite.y = this.player.y * resource.window.CELL_SIZE;
    // this.updateTankRotation(this.player);
    this.updateSpeed(this.player, "up", 0);
  }

  checkLevelComplete() {
    const currentTime = Date.now();
    const timeElapsed = currentTime - game.levelStartTime;

    // 胜利条件1：摧毁所有敌人
    if (this.enemies.getLength() === 0 && game.score > 0) {
      this.levelComplete();
      return;
    }

    // 胜利条件2：保护基地达到指定时间
    if (timeElapsed >= game.protectionTime) {
      this.levelComplete();
      return;
    }
  }

  levelComplete() {
    // 升级
    game.gameState = game.GAME_STATE_LEVEL_COMPLETE;
    this.physics.pause();
    // this.currentLevel++;
    if (this.sounds.complete) {
      this.sounds.complete.play();
    }

    console.log("current level complete: " + game.currentLevel);
    if (game.currentLevel >= game.maxLevel) {
      // 游戏全部通关
      game.gameState = game.GAME_STATE_OVER;// 游戏结束
      game.gameWin();
    } else {
      // 进入下一关

      game.gameSuccess();
    }
  }
}
