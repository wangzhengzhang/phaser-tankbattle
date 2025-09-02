// 1. 左上角为原点（0,0），向右X正方向，向下Y正方向
// 2. 精灵默认朝上（0度无需旋转）
// 3. 旋转方向：顺时针为正，逆时针为负
function updateSpeedByTargetPoint(sprite, targetPoint, speedValue) {
  // 计算精灵到目标点的方向向量
  const dx = targetPoint.x - sprite.x;
  const dy = targetPoint.y - sprite.y; // dy为正表示目标在下方

  // 计算两点之间的距离
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 如果距离过近（小于5像素），停止移动
  if (distance < 2) {
    sprite.setVelocity(0, 0);
    return;
  }

  // 归一化方向向量（获取单位向量）
  const normalizedX = dx / distance;
  const normalizedY = dy / distance;

  // 计算并设置速度分量
  const velocityX = normalizedX * speedValue;
  const velocityY = normalizedY * speedValue;
  //console.log("set vel: " , velocityX, velocityY);
  sprite.setVelocity(velocityX, velocityY);

  // 计算旋转角度（核心调整部分）
  // 1. 修正Y轴方向并计算基础角度
  let angle = Math.atan2(dy, dx);
  //angle += Math.PI / 2;

  // 设置图像的旋转角度
  sprite.rotation = angle; // rotation规则：向右为0度，顺时针为正。
}

function updateSpeedByRotation(sprite, rotation, speedValue) {
  var xSpeed = speedValue * Math.cos(rotation);
  var ySpeed = speedValue * Math.sin(rotation);
  sprite.setVelocityY(ySpeed);
  sprite.setVelocityX(xSpeed);
}

function updateSpeed(sprite, direction, speedvalue) {
  // 左上角为原点（0，0），向右为x轴正方向，向下为y轴正方向

  if (speedvalue == 0) {
    sprite.setVelocityX(0);
    sprite.setVelocityY(0);
    return;
  }

  sprite.direction = direction;
  switch (direction) {
    case "up":
      sprite.setVelocityY(-speedvalue);
      sprite.setVelocityX(0);
      break;
    case "right":
      sprite.setVelocityX(speedvalue);
      sprite.setVelocityY(0);
      break;
    case "down":
      sprite.setVelocityY(speedvalue);
      sprite.setVelocityX(0);
      break;
    case "left":
      sprite.setVelocityX(-speedvalue);
      sprite.setVelocityY(0);
      break;
  }

  updateRotation(sprite, direction);
}

function updateRotation(sprite, direction) {
  let rotation = 0;
  if (direction) {
    switch (direction) {
      case "up":
        rotation = -Math.PI / 2;
        break;
      case "right":
        rotation = 0;
        break;
      case "down":
        rotation = Math.PI / 2;
        break;
      case "left":
        rotation = Math.PI;
        break;
    }
    sprite.rotation = rotation; // 向右为0，顺时针为正
  }
}


let messageText = null; // 提示文字对象
/**
 * 在屏幕中间显示提示文字，一段时间后自动消失
 * @param {string} text - 要显示的文字内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showTimedMessage(text, duration = 2000) {
  const scene = game.game.scene.keys["MainScene"];

  // 如果已有提示文字，先移除
  if (messageText) {
    messageText.destroy();
  }

  // 创建新的提示文字
  messageText = scene.add
    .text(
      game.GAME_WIDTH /2, // x坐标（屏幕中心）
      game.GAME_HEIGHT / 2, // y坐标（屏幕中心）
      text,
      {
        fontSize: "24px",
        fill: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: { x: 20, y: 10 },
        align: "center",
      }
    )
    .setOrigin(0.5); // 设置原点为中心，确保文字完全居中

  // 添加淡入效果
  messageText.alpha = 0;
  scene.tweens.add({
    targets: messageText,
    alpha: 1,
    duration: 300,
    ease: "Linear",
  });

  console.log("showTimedMessage",game.GAME_WIDTH,game.GAME_HEIGHT);

  // 定时消失（2秒后）
  scene.time.delayedCall(duration, () => {
    // 添加淡出效果后销毁
    if(messageText){
      scene.tweens.add({
        targets: messageText,
        alpha: 0,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          if (messageText) {
            messageText.destroy();
            messageText = null;
          }
        },
      });

    }
    
  });
}

function playAnimation(sprite, key) {
  // 检查是否正在播放 "key" 动画
  if (sprite.anims.isPlaying) {
    if (sprite.anims.currentAnim.key === key) return;
    else {
      sprite.anims.stop();
    }
  }
  sprite.play(key);
}

// 更新显示移动尾迹，在update函数中使用
function updateMoveTail(sprite, trailEmitter) {
  // 根据移动状态控制尾迹效果
  // 计算移动速度的大小（用于控制粒子数量）
  const moveSpeed = Math.sqrt(
    sprite.body.velocity.x * sprite.body.velocity.x +
      sprite.body.velocity.y * sprite.body.velocity.y
  );

  if (moveSpeed > 0) {
    var trailWidth = 10;
    // 设置尾迹粒子位置（在玩家后方）
    const trailOffset = 10; // 尾迹与玩家的距离
    const trailX = sprite.x - Math.cos(sprite.rotation) * trailOffset;
    const trailY = sprite.y - Math.sin(sprite.rotation) * trailOffset;

    // 4. 为每个粒子计算横截面上的随机位置
    // 先关闭自动发射，我们将手动控制每个粒子的位置
    trailEmitter.on = false;

    // 每次更新发射多个粒子，形成横截面分布
    const particleCount = 1; // 每次发射的粒子数量,根据游戏刷新频率，创建粒子
    for (let i = 0; i < particleCount; i++) {
      // 随机偏移量（在 -trailWidth/2 到 trailWidth/2 之间）
      const offset = (Math.random() - 0.5) * trailWidth;

      // 根据偏移量计算最终粒子位置
      let particleX, particleY;

      // 使用垂直方向计算偏移位置
      if (i % 2 === 0) {
        particleX = trailX + Math.sin(sprite.rotation) * offset;
        particleY = trailY + Math.cos(sprite.rotation) * offset;
      } else {
        particleX = trailX + Math.sin(sprite.rotation) * offset;
        particleY = trailY + Math.cos(sprite.rotation) * offset;
      }

      // 手动发射一个粒子
      trailEmitter.explode(1, particleX, particleY);
    }
  } else {
    // 停止移动时关闭粒子发射
    trailEmitter.on = false;
  }
}

//particleSystems = [];
// 在指定位置创建爆炸效果（使用粒子特性）
// 参数说明：
// key: 纹理元素的key
// x,y: 表示坐标位置
function createExplosionAt(key, x, y) {
  const scene = game.game.scene.keys["MainScene"];
  const explosionEmitter = scene.add.particles(key).createEmitter({
    x: x,
    y: y,
    speed: { min: -100, max: 100 },
    angle: { min: -180, max: 0 },
    scale: { start: 1, end: 0 },
    lifespan: 1000,
    quantity: 100,
    alpha: { start: 1, end: 0 },
    blendMode: "ADD",
    on: false,
  });

  //particleSystems.push(explosionEmitter);
  explosionEmitter.explode(); // 爆炸后自动清除
}

// 在指定位置显示爆炸效果（使用sprite动画）
function showExplosion(x, y) {
  //console.log("show explosion...");
  var scene = game.game.scene.keys["MainScene"];
  const explosion = scene.add.sprite(x, y, "explosion");
  explosion.setOrigin(0.5, 0.5);
  explosion.play("bullet_explosion"); // 子弹爆炸

  // 爆炸完成后移除爆炸精灵
  explosion.on("animationcomplete", () => {
    explosion.destroy();
  });
}

// 边间碰撞事件管理器
class WorldBoundsManager {
  constructor(scene) {
    this.scene = scene;
    this.subscribers = new Set();

    // 监听全局 worldbounds 事件
    this.scene.physics.world.on(
      Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
      this.handleWorldBounds,
      this
    );
  }

  destroy() {
    this.scene.physics.world.off(
      Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
      this.handleWorldBounds,
      this
    );
    this.subscribers.clear();
    this.subscribers = null;
  }

  handleWorldBounds(body) {
    this.subscribers.forEach((subscriber) => {
      if (body.gameObject === subscriber) {
        subscriber.emit("worldbounds", body);
      }
    });
  }
  count() {
    return this.subscribers.size;
  }

  subscribe(sprite) {
    this.subscribers.add(sprite);
    // 确保 sprite 有事件发射能力
    if (!sprite.emit) {
      Phaser.Events.EventEmitter.call(sprite);
      Object.assign(sprite, Phaser.Events.EventEmitter.prototype);
    }
  }

  unsubscribe(sprite) {
    this.subscribers.delete(sprite);
  }

  destroy() {
    this.scene.physics.world.off(
      Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
      this.handleWorldBounds,
      this
    );
    this.subscribers.clear();
  }
}

// // 在场景中使用
// create() {
//     // 初始化管理器
//     this.worldBoundsManager = new WorldBoundsManager(this);

//     // 创建 sprite
//     const player = this.physics.add.sprite(100, 100, 'player');
//     player.setCollideWorldBounds(true);
//     player.body.onWorldBounds = true;

//     // 订阅事件
//     this.worldBoundsManager.subscribe(player);

//     // 在 sprite 内部处理事件
//     player.on('worldbounds', (body) => {
//         this.time.delayedCall(1000, () => player.clearTint());
//     });
// }

// 子弹与敌人碰撞事件管理器
class BulletCollisionManager {
  constructor(scene) {
    this.scene = scene;
    // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
    this.collider = this.scene.physics.add.collider(
      this.scene.bullets,
      this.scene.enemies,
      this.handleBulletEnemyCollision, // 碰撞回调
      this.handleBulletEnemyCollisionPre,
      this
    );
  }

  destroy() {
    if (this.collider) this.scene.physics.world.removeCollider(this.collider);
  }

  handleBulletEnemyCollision(bullet, enemy) {
    if (enemy instanceof EnemyTank) game.score += 100;

    //console.log("handle bullet enemy collision");
    //showExplosion(enemy.x, enemy.y);
    createExplosionAt("enemytank", enemy.x, enemy.y);
    enemy.brokenByHit();      // 敌人死亡
    bullet.destroy();         // 子弹销毁
    showTimedMessage("消灭一个敌人！！");
  }
  handleBulletEnemyCollisionPre(bullet, enemy) {
    if (bullet.camp == enemy.camp) return false; // 处理己方的子弹,当遇到己方的子弹时，忽略
    return true;
  }
}

// 子弹与玩家碰撞事件管理器
class BulletPlayerCollisionManager {
  constructor(scene) {
    this.scene = scene;
    // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
    this.collider = this.scene.physics.add.collider(
      this.scene.player,
      this.scene.bullets,
      this.handleBulletPlayerCollision, // 碰撞回调
      this.handleBulletPlayerCollisionPre,
      this
    );
  }

  destroy() {
    if (this.collider) this.scene.physics.world.removeCollider(this.collider);
  }

  handleBulletPlayerCollision(player, bullet) {}
  handleBulletPlayerCollisionPre(player, bullet) {
    if (bullet.camp == player.camp) return false; // 处理己方的子弹,当遇到己方的子弹时，忽略
    showExplosion(player.x, player.y);

    bullet.destroy(); // 子弹销毁
    if (player instanceof Player) {
      player.health -= 1;
      console.log("player health:", player.health);
      game.lives = player.health;

      if (player.health <= 0) {
        showTimedMessage("玩家生命耗尽！");
        player.brokenByHit(); // 玩家死亡
        game.gameOver(); // 游戏结束
      }
    }

    return false;
  }
}

// 子弹与背景碰撞事件管理器
class BulletBackgroundCollisionManager {
  constructor(scene) {
    this.scene = scene;
    // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
    this.collider = this.scene.physics.add.collider(
      this.scene.bullets,
      this.scene.layer_bg,
      this.handleBulletBackgroundCollision, // 碰撞回调
      this.handleBulletBackgroundCollisionPre,
      this
    );
  }
  destroy() {
    if (this.collider) this.scene.physics.world.removeCollider(this.collider);
  }

  handleBulletBackgroundCollision(bullet, tile) {
    showExplosion(bullet.x, bullet.y);
    bullet.destroy();

    if (
      tile.index == resource.tileType.STEELWALL ||
      tile.index == resource.tileType.TREE
    )
      return; // 子弹无法击毁钢铁墙和树林、
    if (tile.index == resource.tileType.BASE) {
      if (bullet.camp == resource.camp.BLUE) {
        //console.log("handle bullet background collision");
        createExplosionAt("base", (tile.x+ 0.5) * resource.window.CELL_SIZE , (tile.y + 1.) * resource.window.CELL_SIZE);
        showTimedMessage("基地被摧毁！");
        game.game.scene.keys["MainScene"].sounds.broken.play();
        
        setTimeout(() => { // 等待剩下的动画完成。
          game.gameOver(); // 对方子弹击中基地，游戏失败，结束！
        },1000);
      } else {
        return;
      }
    }

    // 在碰撞之后消除tile
    var l = tile.layer_bg;
    // 子弹遇到其他类型的tile，消除tile
    this.scene.map.putTileAt(0, tile.x, tile.y, true, l);
  }
  handleBulletBackgroundCollisionPre(bullet, tile) {
    if (tile.index == resource.tileType.WATER)
      // 子弹可以穿过水域
      return false;
    return true;
  }
}

// 玩家与背景碰撞事件管理器
class PlayerBackgroundCollisionManager {
  constructor(scene) {
    this.scene = scene;
    // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
    this.collider = this.scene.physics.add.collider(
      this.scene.player,
      this.scene.layer_bg,
      null, // 碰撞回调
      this.handlePlayerBackgroundCollisionPre,
      this
    );
  }

  destroy() {
    if (this.collider) this.scene.physics.world.removeCollider(this.collider);
  }

  handlePlayerBackgroundCollisionPre(player, tile) {
    if (tile.index == resource.tileType.TREE) return false; // 玩家可以穿过树林
    return true;
  }
}

// 敌方坦克与背景碰撞事件管理器
class EnemyTankBackgroundCollisionManager {
  constructor(scene) {
    this.scene = scene;
    // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
    this.collider = this.scene.physics.add.collider(
      this.scene.enemies,
      this.scene.layer_bg,
      this.handleEnemyTankBackgroundCollision, // 碰撞回调
      this.handleEnemyTankBackgroundCollisionPre,
      this
    );
  }

  destroy() {
    if (this.collider) this.scene.physics.world.removeCollider(this.collider);
  }

  handleEnemyTankBackgroundCollision(enemy, tile) {
    // 处理地方坦克和 背景墙，水域，土墙碰撞时自动转向
    if (
      tile.index == resource.tileType.STEELWALL ||
      tile.index == resource.tileType.TREE ||
      tile.index == resource.tileType.WATER ||
      tile.index == resource.tileType.TREE
    ) {
      enemy.turnRight();
    }
  }

  handleEnemyTankBackgroundCollisionPre(enemy, tile) {
    if (tile.index == resource.tileType.TREE)
      // 地方可以穿过树林
      return false;

    return true;
  }
}

// 游戏时间计时器
class GameTimer {
  constructor(scene) {
    this.gameTime = 0;                 // 单位：毫秒，游戏时间(游戏暂停时间不包含在内)
    this.lastTimeUpdate = 0;           // 上一次更新游戏的时间
  }

  time()
  {
    return this.gameTime;
  }

  update() { // 在scene的 update 函数中调用这个
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastTimeUpdate);
      // 更新游戏时间
      this.gameTime += deltaTime;
      this.lastTimeUpdate = currentTime;
  }

  reset() // 计时器归零
  {
    const currentTime = Date.now();
    this.lastTimeUpdate = currentTime;
    this.gameTime = 0; 
  }

  resume() // 计时器resume,当调用game.resume 时，调用这个
  {
    this.lastTimeUpdate =Date.now();
  }
}
