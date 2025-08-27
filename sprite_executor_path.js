// 路径规划执行器

class PathExecutor{
    // 构造函数
    constructor(sprite) {
        this.sprite = sprite;
        this.isComplated = false;
    }

    setPath(path) {
        this.path = path;
    }

    /**
     * 开始沿路径移动
     * @param {number} speed - 移动速度
     */
    start() {
        this.currentPathIndex = 0; // 重置路径索引
        this.moveToNextPoint(this.sprite.speed); // 移动到第一个点
    }
    /**
     * 移动到下一个路径点
     * @param {number} speed - 移动速度
     */
    moveToNextPoint(speed) {
        // 检查是否到达最后一个点
        if (this.currentPathIndex >= this.path.length - 1) {
            this.sprite.setVelocity(0, 0); // 停止移动
            console.log('path excutor arrive to end point.');
            this.isComplated = true;
            return;
        }

        // 计算下一个目标点
        this.currentPathIndex++;
        const target = this.path[this.currentPathIndex];

        // 使用物理系统移动到目标点
        this.sprite.scene.physics.moveTo(
            this.sprite, 
            target.x, 
            target.y, 
            speed
        );

        // 显示当前目标点（调试用）
        //this.drawTargetMarker(target);
    }

    /**
     * 绘制目标点标记（调试）
     * @param {object} target - 目标点{x, y}
     */
    drawTargetMarker(target) {
        // 清除之前的标记
        if (this.targetMarker) {
            this.targetMarker.destroy();
        }
        this.targetMarker = this.sprite.scene.add.graphics();
        this.targetMarker.fillStyle(0xff0000, 0.5);
        this.targetMarker.beginPath();
        this.targetMarker.arc(target.x, target.y, 10, 0, Math.PI * 2);
        this.targetMarker.fillPath();
    }

    destroy()
    {
        this.sprite = null;
    }

    update(){
        // 1. 执行路径规划，检测是否到达当前目标点附近
        if (!this.isComplated) {
            const target = this.path[this.currentPathIndex];
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                target.x, target.y
            );
            updateSpeedByTargetPoint(this.sprite, target, this.sprite.speed); // 根据下一个点的位置设置当前速度（主要是方向）

            // 当距离小于10像素时，认为到达目标点
            if (distance < 2) {
                this.moveToNextPoint(this.speed); // 继续移动到下一个点
            }
            return;
        }

    }

}