// 定义子弹类 Bullet 继承自 Sprite
class Bullet extends Phaser.Physics.Arcade.Sprite {
    /**
     * 创建子弹实例
     * @param {Phaser.Scene} scene - 场景引用
     * @param {number} x - 初始X坐标
     * @param {number} y - 初始Y坐标
     * @param {string} texture - 子弹纹理键名
     * @param {Object} options - 子弹配置参数
     * @param {number} options.speed - 移动速度
     * @param {number} options.damage - 伤害值
     * @param {number} options.lifespan - 生命周期(毫秒)，超时自动销毁
     * @param {number} options.angle - 移动角度(度)
     */
    constructor(scene, x, y,rotation, texture = "bullet", options = {}) {
        if(typeof rotation != 'number' ) throw "bullet must have rotation.";

        // 子弹的初始位置设置在tank的外部
        const dx = resource.window.CELL_SIZE *1.5 * Math.cos(rotation); 
        const dy = resource.window.CELL_SIZE *1.5 * Math.sin(rotation);
        x += dx; 
        y += dy;

        super(scene, x, y, texture);
        this.scene = scene;
        // 设置默认属性，rotaion与tank的当前方向一致。
        this.rotation = rotation; 
        //this.direction = direction;
        this.speed = options.speed || 500;
        this.damage = options.damage || 10;

        // 初始化显示效果
        this.initDisplay(); 

        // 初始化物理属性
        this.initPhysics();

        // 初始化消息时间订阅
        this.initEvents();
    }

    initDisplay() {
        
        // 初始化显示效果
 
        this.scene.add.existing(this);        // 添加到场景
        this.setOrigin(0.5,0.5);              // 设置锚点
        this.displayWidth = resource.window.CELL_SIZE/ 2;
        this.displayHeight = resource.window.CELL_SIZE/2;
    }
    
    /**
     * 初始化物理属性
     */
    initPhysics() {
        this.scene.bullets.add(this); // 这里一定要使用bullets组中添加物理属性。
        //this.scene.physics.add.existing(this);
        this.setCollideWorldBounds(true); // 与世界边界碰撞
        this.body.onWorldBounds = true; //这段代码十分关键，否则不会触发边界事件（on worldbounds）
        //this.body.checkWorldBounds = true; // 允许触发 worldbounds 事件
        this.setBounce(0, 0); // 无弹跳
        //this.setSize(resource.window.CELL_SIZE/ 2, resource.window.CELL_SIZE/ 2); // 设置碰撞体大小(根据实际纹理调整)
        //this.setOffset(4, 4); // 碰撞体偏移(根据实际纹理调整)
        updateSpeedByRotation(this, this.rotation, this.speed);
    }

    initEvents() {
        // 在 bullet 内部处理事件,撞到边界后自动销毁
        this.scene.worldBoundsManager.subscribe(this);
        this.on('worldbounds', (body) => {
            //console.log('bullet hit world bounds from within sprite!');
            //this.setTint(0xff0000);
            //console.log("bullet count: ",this.scene.worldBoundsManager.count());
            
            this.destroy();
            
        });
    }
    
    // /**
    //  * 子弹命中目标后的处理
    //  * @param {Phaser.GameObjects.GameObject} target - 被命中的目标
    //  */
    // onHit(target) {
    //     // 可以在这里添加命中效果(如粒子特效)
    //     this.scene.add.sprite(this.x, this.y, 'hitEffect')
    //         .setScale(0.5)
    //         .setDepth(5)
    //         .play('hitEffectAnim')
    //         .on('animationcomplete', (anim) => anim.target.destroy());
        
    //     // 触发命中事件，让场景处理伤害逻辑
    //     this.emit('hit', target, this.damage);
        
    //     // 销毁子弹
    //     this.destroy();
    // }
    
    /**
     * 销毁子弹时清理资源
     */
    destroy() {
        // 清除计时器
        // if (this.lifespanTimer) {
        //     this.lifespanTimer.remove();
        // }
        //console.log(this.scene);
        //if(this.scene && this.scene.worldBoundsManager ) this.scene.worldBoundsManager.unsubscribe(this); // 销毁之前必须先取消订阅事件
        //else console.warn("waring : bullet destroy scene is null");
        var scene = game.game.scene.keys["MainScene"];  // 使用this.scene直接访问可能获取不到。
        if(scene) scene.worldBoundsManager.unsubscribe(this);
        // 调用父类销毁方法
        super.destroy();
    }
    
    /**
     * 更新子弹状态(每帧调用)
     */
    update() {
        
        //可以添加子弹飞行中的动态效果
        //例如: 子弹旋转
        //this.angle += 5;
    }
}
