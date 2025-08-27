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

function updateSpeedByRotation(sprite,rotation,speedValue){
   var xSpeed = speedValue * Math.cos(rotation);
   var ySpeed =speedValue * Math.sin(rotation);
   sprite.setVelocityY(ySpeed);
   sprite.setVelocityX(xSpeed);
}

function updateSpeed(sprite, direction, speedvalue) { // 左上角为原点（0，0），向右为x轴正方向，向下为y轴正方向

  if(speedvalue == 0)
  {
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

function updateRotation(sprite, direction)  
{
  let rotation = 0;
  if (direction) {
    switch (direction) {
      case "up":
        rotation = -Math.PI/2;
        break;
      case "right":
        rotation = 0;
        break;
      case "down":
        rotation = Math.PI/2;
        break;
      case "left":
        rotation = Math.PI;
        break;
    }
    sprite.rotation = rotation;  // 向右为0，顺时针为正
  }
}

// 边间碰撞事件管理器
class WorldBoundsManager {
    constructor(scene) {
        this.scene = scene;
        this.subscribers = new Set();
        
        // 监听全局 worldbounds 事件
        this.scene.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, this.handleWorldBounds, this);
    }

    destroy() {
        this.scene.physics.world.off(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, this.handleWorldBounds, this);
        this.subscribers.clear();
        this.subscribers = null;
    }
    
    handleWorldBounds(body) {
        this.subscribers.forEach(subscriber => {
            if (body.gameObject === subscriber) {
                subscriber.emit('worldbounds', body);
            }
        });
    }
    count(){
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
        this.scene.physics.world.off(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, this.handleWorldBounds, this);
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
      if(this.collider) 
        this.scene.physics.world.removeCollider(this.collider);
    }
    
    handleBulletEnemyCollision(bullet, enemy) {
      if(enemy  instanceof EnemyTank)
        game.score += 100;

      //console.log("handle bullet enemy collision");
      enemy.destroy(); // 敌人死亡
      bullet.destroy(); // 子弹销毁
    }
    handleBulletEnemyCollisionPre(bullet, enemy)
    {
      if(bullet.camp == enemy.camp) return false; // 处理己方的子弹,当遇到己方的子弹时，忽略
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
      if(this.collider) 
        this.scene.physics.world.removeCollider(this.collider);
    }
    
    handleBulletPlayerCollision( player, bullet) {
      
    }
    handleBulletPlayerCollisionPre(player, bullet)
    {
      if(bullet.camp == player.camp) return false; // 处理己方的子弹,当遇到己方的子弹时，忽略
      
      console.log("handleBulletPlayerCollision");
      bullet.destroy(); // 子弹销毁
      if(player  instanceof Player)
      {
        player.health -= 1;
        console.log("player health:", player.health);
        game.lives = player.health;

        if(player.health <= 0) {
          player.destroy(); // 玩家死亡 
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
      if(this.collider) 
        this.scene.physics.world.removeCollider(this.collider);
    }
    
    handleBulletBackgroundCollision(bullet, tile) {
      bullet.destroy();
      
      if(tile.index == resource.tileType.STEELWALL || tile.index == resource.tileType.TREE) return; // 子弹无法击毁钢铁墙和树林、
      if(tile.index == resource.tileType.BASE) {
        if(bullet.camp == resource.camp.BLUE)
        {  
          //console.log("handle bullet background collision");
          game.gameOver(); // 对方子弹击中基地，游戏失败，结束！
        }else{
          return;
        }
      }

      // 在碰撞之后消除tile
      var l = tile.layer_bg;
      // 子弹遇到其他类型的tile，消除tile
      this.scene.map.putTileAt(0, tile.x, tile.y, true, l)
    }
    handleBulletBackgroundCollisionPre(bullet, tile) {
      if(tile.index == resource.tileType.WATER) // 子弹可以穿过水域
        return false;
      return true;
    }
}

// 玩家与背景碰撞事件管理器
class PlayerBackgroundCollisionManager {
    constructor(scene) {
        this.scene = scene;
          // 5. 关键：设置子弹组与敌人组的碰撞检测（单次设置，高效处理所有敌人）
        this.collider =  this.scene.physics.add.collider(
            this.scene.player,
            this.scene.layer_bg, 
            null, // 碰撞回调
            this.handlePlayerBackgroundCollisionPre, 
            this
          );
    }

    destroy() {
      if(this.collider) 
        this.scene.physics.world.removeCollider(this.collider);
    }

    handlePlayerBackgroundCollisionPre(player, tile) {
      if(tile.index == resource.tileType.TREE) return false; // 玩家可以穿过树林
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
      if(this.collider) 
        this.scene.physics.world.removeCollider(this.collider);
    }

    handleEnemyTankBackgroundCollision(enemy, tile) {
      // 处理地方坦克和 背景墙，水域，土墙碰撞时自动转向
      if(tile.index == resource.tileType.STEELWALL || tile.index == resource.tileType.TREE || tile.index == resource.tileType.WATER || tile.index == resource.tileType.TREE) {
        enemy.turnRight();
      }
    }
    
    handleEnemyTankBackgroundCollisionPre(enemy, tile) {
      if(tile.index == resource.tileType.TREE)    // 地方可以穿过树林
        return false;

      return true;
    }
}



