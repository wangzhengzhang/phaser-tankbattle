// 导入 Phaser 核心类（如果使用模块系统）
// import Phaser from './phaser.min.js';

/**
 * 自定义玩家精灵类
 * 继承自 Phaser.Physics.Arcade.Sprite 以支持物理特性
 */
class Player extends Phaser.Physics.Arcade.Sprite {
    /**
     * 构造函数
     * @param {Phaser.Scene} scene - 所属场景
     * @param {number} x - 初始X坐标
     * @param {number} y - 初始Y坐标
     * @param {string} texture - 纹理键名
     * @param {object} options - 自定义配置
     */
    constructor(scene, x, y, texture = "tank", options = {}) {
        // 调用父类构造函数
        super(scene, x, y, texture);
        
        // 保存场景引用
        this.scene = scene;
        this.direction = 'up';
        
        // 配置参数（带默认值）
        this.speed = options.speed || 200;
        this.jumpForce = options.jumpForce || 350;
        this.health = options.health || 3;   // 默认可以死三次，三次之后游戏结束。
        this.isInvulnerable = false;

        this.camp = resource.camp.RED;

        this.displayWidth = resource.window.CELL_SIZE -4;
        this.displayHeight = resource.window.CELL_SIZE -4;
        this.setOrigin(0.5, 0.5);
        this.rotation = - Math.PI/ 2;

        this.shotCooldown = 500;
        this.lastShot = 0;
        // 初始化
        this.init();

        // // 获取frameTags数据
        // const frameTagsObj = this.scene.cache.json.get('tankTags')
        // const frameTags= frameTagsObj.meta.frameTags;
        
    
        // // 遍历frameTags，自动创建Phaser动画
        // frameTags.forEach(tag => {
        //     this.anims.create({
        //         key: tag.name,  // 动画名 = 标签名
        //         // 生成从from到to的帧索引数组
        //         frames: this.anims.generateFrameNumbers('tank', { 
        //             start: tag.from, 
        //             end: tag.to 
        //         }),
        //         frameRate: 10,
        //         // 根据Aseprite的direction设置循环方式
        //         repeat: tag.direction === 'loop' ? -1 : 0
        //     });
        // });
        
       
    }
    
    /**
     * 初始化精灵
     */
    init() {
        // 添加到场景和物理系统
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        // 设置物理属性
        this.setBounce(0.); // 反弹系数
        this.setCollideWorldBounds(true); // 与世界边界碰撞,防止出界
        
       // this.body.checkWorldBounds = true;
        //this.body.setGravityY(500); // 不需要重力
        updateSpeed(this, this.direction, 0); // 初始速度为 0 ，向上 (必须在添加物理系统之后才能执行这个代码)
        
        // 初始化动画
        // this.initAnimations();
        
        // 初始化输入监听
        this.initInput();

        // 创建尾迹粒子发射器
        this.trailEmitter = this.scene.add.particles('tail').createEmitter({
          // 初始设置，会在update中动态修改
          lifespan: 500,
          alpha: { start: 1, end: 0 },
          scale: { start: 0.5, end: 0.1 },
          blendMode: 'ADD',
          on: false // 初始不发射
        });
    }
    
    /**
     * 初始化动画
     */
    initAnimations() {

        // //  idle 动画（如果有多个帧）
        // this.scene.anims.create({
        //     key: 'idle',
        //     frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        //     frameRate: 10,
        //     repeat: -1
        // });
        
        // // 跑步动画
        // this.scene.anims.create({
        //     key: 'run',
        //     frames: this.scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
        //     frameRate: 15,
        //     repeat: -1
        // });
        
        // // 跳跃动画
        // this.scene.anims.create({
        //     key: 'jump',
        //     frames: [{ key: 'player', frame: 8 }],
        //     frameRate: 20
        // });
        
        // // 默认播放 idle 动画
        // this.play('idle');
    }
    
    /**
     * 初始化输入控制
     */
    initInput() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        //this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // this.AKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
                  // 创建WASD键的映射
        this.wasdKeys = this.scene.input.keyboard.addKeys({
                w: Phaser.Input.Keyboard.KeyCodes.W,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                d: Phaser.Input.Keyboard.KeyCodes.D,
                space: Phaser.Input.Keyboard.KeyCodes.SPACE
            });
    }


    
    /**
     * 受伤处理
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        if (this.isInvulnerable) return;
        
        this.health -= damage;
        this.health = Math.max(0, this.health);
        
        // 无敌状态（1秒）
        this.isInvulnerable = true;
        this.setTint(0xff0000); // 变红提示
        
        this.scene.time.delayedCall(1000, () => {
            this.isInvulnerable = false;
            this.clearTint();
        });
        
        // 触发死亡事件
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * 死亡处理
     */
    die() {
        this.setVelocity(0);
        // this.play('die'); // 假设已有死亡动画
        // this.disableBody(true, true); // 禁用物理并隐藏
        
        // 触发自定义事件
        // this.emit('playerDied');
    }
    
    /**
     * 跳跃方法
     */
    jump() {
        if (this.body.touching.down) { // 只有在地面上才能跳
            this.setVelocityY(-this.jumpForce);
            this.play('jump', true);
        }
    }

    setPathExecutor(execotor)
    {
        this.pathExecutor = execotor;
    }

    playAnimation(key)
    {
        // 检查是否正在播放 "shoot" 动画
        if (this.anims.isPlaying ) {
            if(this.anims.currentAnim.key === key)
                return;
            else{
                this.anims.stop();
            }
        }
        this.play(key);
    }
    
    /**
     * 更新逻辑（每一帧调用）
     */
    update(time, delta) {
        // 玩家移动控制
        this.speed = 50;

        // 1. 执行路径规划，检测是否到达当前目标点附近
        if(this.pathExecutor) {
            this.pathExecutor.update();
            return;
        }
        

         
        // if (this.currentPathIndex < this.path.length - 1) {
        //     const target = this.path[this.currentPathIndex];
        //     const distance = Phaser.Math.Distance.Between(
        //         this.x, this.y,
        //         target.x, target.y
        //     );
        //     updateSpeedByTargetPoint(this, target, this. speed); // 根据下一个点的位置设置当前速度（主要是方向）

        //     // 当距离小于10像素时，认为到达目标点
        //     if (distance < 2) {
        //         this.moveToNextPoint(this.speed); // 继续移动到下一个点
        //     }
        //     return;
        // }

        // 2. 执行手动操控
        if (this.cursors.left.isDown || this.wasdKeys.a.isDown) {
            updateSpeed(this, 'left', this.speed);
            playAnimation(this, 'move');
        } else if (this.cursors.right.isDown || this.wasdKeys.d.isDown) {
            updateSpeed(this, 'right', this.speed);
            playAnimation(this,'move');
        } else if (this.cursors.up.isDown|| this.wasdKeys.w.isDown) {
            updateSpeed(this, 'up', this.speed);
            playAnimation(this,'move');
        } else if (this.cursors.down.isDown|| this.wasdKeys.s.isDown) {
            updateSpeed(this, 'down', this.speed);
            playAnimation(this,'move');
        }
        else  {// 停止,保持原来的方向
            updateSpeed(this,'',0);
        }
        updateMoveTail(this,this.trailEmitter);
        
        // 获取鼠标指针
        const pointer = this.scene.input.activePointer;
        if ( this.wasdKeys.space.isDown|| (pointer.isDown && pointer.leftButtonDown()) )  {   // 攻击，发射炮弹,空格键/鼠标左键
            if(time - this.lastShot > this.shotCooldown )
            {
                this.lastShot = time;
                this.scene.fireBullet(this);
                playAnimation(this,"shoot");

                // 监听射击动画播放完成事件
                this.once('animationcomplete-shoot', function() {
                    // 当射击动画结束后，自动播放移动动画
                    playAnimation(this,'move');
                }, this);

            }
        }

        
        


        // // 移动控制
        // if (this.cursors.left.isDown) {
        //     this.setVelocityX(-this.speed);
        //     this.flipX = true; // 翻转精灵
        //     if (this.body.touching.down) {
        //         this.play('run', true);
        //     }
        // } 
        // else if (this.cursors.right.isDown) {
        //     this.setVelocityX(this.speed);
        //     this.flipX = false; // 恢复精灵方向
        //     if (this.body.touching.down) {
        //         this.play('run', true);
        //     }
        // } 
        // else {
        //     // 停止移动
        //     this.setVelocityX(0);
        //     if (this.body.touching.down) {
        //         this.play('idle', true);
        //     }
        // }
        
        // // 跳跃控制
        // if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        //     this.jump();
        // }
    }

    // 坦克被击中摧毁
    brokenByHit()
    {
        game.game.scene.keys["MainScene"].sounds.broken.play();
        super.destroy();
    }

    // 发射子弹
    
}

// 导出类（如果使用模块系统）
// export default Player;


