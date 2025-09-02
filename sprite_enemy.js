// 定义电脑控制的敌方坦克，每个3-5秒随机发射一颗子弹，遇到碰撞之后自动转向

class EnemyTank extends Phaser.Physics.Arcade.Sprite {
    /**
     * 创建敌方坦克
     * @param {Phaser.Scene} scene - 场景引用
     * @param {number} x - 初始X坐标
     * @param {number} y - 初始Y坐标
     * @param {string} texture - 坦克纹理键名
     * @param {Object} options - 配置参数
     * @param {number} options.speed - 移动速度，默认100
     * @param {number} options.fireRateMin - 最小发射间隔(毫秒)，默认3000
     * @param {number} options.fireRateMax - 最大发射间隔(毫秒)，默认5000
     * @param {Bullet} options.bulletClass - 子弹类，用于创建子弹
     * @param {Phaser.Physics.Arcade.Group} options.bulletGroup - 子弹组
     * @param {string} options.explosionKey - 爆炸特效纹理键名
     */
    constructor(scene, x, y, texture = "enemytank", options = {}) {
        super(scene, x, y, texture);
        
        // 配置参数
        this.speed = options.speed || 100;
        this.fireRateMin = options.fireRateMin || 3000;
        this.fireRateMax = options.fireRateMax || 5000;
        this.bulletClass = options.bulletClass;
        this.bulletGroup = options.bulletGroup;
        this.explosionKey = options.explosionKey || 'explosion';
        
        // 初始化状态
        this.direction = "down"; // 初始方向
        this.isAlive = true; // 新增：标记坦克是否存活
        this.camp = resource.camp.BLUE;
        
        this.initDisplay();

        // 初始化物理属性
        this.initPhysics();
        
        // 开始自动发射子弹
        this.startFiring();
    }

    initDisplay()
    {
        // 添加到场景
        this.scene.add.existing(this);
        this.displayWidth = resource.window.CELL_SIZE - 4;
        this.displayHeight = resource.window.CELL_SIZE - 4;
        this.setOrigin(0.5, 0.5);
    }
    
    /**
     * 初始化物理属性
     */
    initPhysics() {
        this.scene.enemies.add(this); // 加入enemies物理组
        this.setCollideWorldBounds(true); // 与世界边界碰撞
        this.setBounce(0); // 碰撞后反弹
        // this.setSize(32, 32); // 碰撞体大小
        // this.setOffset(0, 0); // 碰撞体偏移
        //updateSpeed(this, this.direction, this.speed);
    }

    turnRight(){
        
    }
    
    /**
     * 开始自动发射子弹
     */
    startFiring() {
        this.scheduleNextShot();
    }
    
    /**
     * 安排下一次发射
     */
    scheduleNextShot() {
        // 只在存活状态下安排发射
        if (this.isAlive && this.scene && this.scene.scene.isActive()) {
            const delay = Phaser.Math.Between(this.fireRateMin, this.fireRateMax);
            this.shotTimer = this.scene.time.delayedCall(delay, () => {
                if(game.gameState == game.GAME_STATE_PLAYING)
                    this.fire();
                this.scheduleNextShot();
            });
        }
    }
    
    /**
     * 发射子弹
     */
    fire() {
        if (this.isAlive ) {
            this.scene.fireBullet(this);
        }
    }
    
    /**
     * 碰撞后转向
     */
    handleCollision() {
        if (!this.isAlive) return; // 已销毁则不处理
        
        // 随机调整一个新方向（±30到±150度之间）
        const angleChange = Phaser.Math.Between(30, 150) * (Phaser.Math.Between(0, 1) ? 1 : -1);
        this.direction = (this.direction + angleChange) % 360;
        
        // 设置新方向的速度
        this.setVelocityByAngle(this.direction, this.speed);
        this.angle = this.direction; // 坦克旋转到移动方向
    }
    
    /**
     * 被子弹击中处理
     */
    hitByBullet() {
        if (!this.isAlive) return; // 防止重复处理
        
        this.isAlive = false;
        
        // 停止移动
        this.setVelocity(0);
        
        // 显示爆炸效果
        this.createExplosion();
        
        // 触发销毁事件（供场景处理分数等逻辑）
        this.emit('destroyed', this);
        
        // 延迟销毁，让爆炸效果播放完成
        this.scene.time.delayedCall(300, () => {
            this.destroy();
        });
    }
    
    /**
     * 创建爆炸效果
     */
    createExplosion() {
        const explosion = this.scene.add.sprite(this.x, this.y, this.explosionKey);
        explosion.setScale(1.5);
        
        // 如果有爆炸动画，播放动画
        if (this.scene.anims.get('explode')) {
            explosion.play('explode');
            explosion.on('animationcomplete', () => explosion.destroy());
        } else {
            // 没有动画时简单闪烁后销毁
            this.scene.tweens.add({
                targets: explosion,
                alpha: 0,
                duration: 300,
                onComplete: () => explosion.destroy()
            });
        }
    }
    
    /**
     * 更新坦克状态
     */
    update() {
        if (!this.isAlive) return; // 已销毁则不更新
        if(this.pathExecutor)this.pathExecutor.update();
    }

    setPathExecutor(executor){
        this.pathExecutor = executor;
    }
    
    /**
     * 销毁坦克
     */
    destroy() {
        // 清除计时器
        if (this.shotTimer) {
            this.shotTimer.remove();
        }
        super.destroy();
    }

    // 坦克被击中摧毁，销毁了部分
    brokenByHit()
    {
        game.game.scene.keys["MainScene"].sounds.broken.play();
        this.destroy();
    }
}
