// 加载场景 - 负责加载所有游戏资源（图片，声音，视屏），并显示加载的进度条。
class LoaderScene extends Phaser.Scene {
  constructor() {
    super("LoaderScene");
    console.log("construct loader scene.");
  }

  preload() {
    console.log("preload resources.");
    // 创建加载进度条
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const x = width / 2 - 320 / 2;
    const y = 270;
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 320 / 2, 270, 320, 50);

    const loadingText = this.make
      .text({
        x: width / 2,
        y: height / 2 - 50,
        text: "加载中...",
        style: {
          font: "20px monospace",
          fill: "#ffffff",
        },
      })
      .setOrigin(0.5, 0.5);

    const percentText = this.make
      .text({
        x: width / 2,
        y: height / 2 - 5,
        text: "0%",
        style: {
          font: "18px monospace",
          fill: "#ffffff",
        },
      })
      .setOrigin(0.5, 0.5);

    // 监听加载进度事件
    this.load.on("progress", (value) => {
      percentText.setText(parseInt(value * 100) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(x + 10, y + 10, 300 * value, 30);
    });

    // 加载完成后隐藏进度显示
    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      console.log("preload resources complete.");

      // 加载完成后切换到游戏场景
      this.scene.start("MainScene");
      game.updateButtonStates();
      game.gameReadyToStart();
    });

    // 加载游戏资源

    this.load.audio("shoot", "assets/sounds/laser_shot.mp3");
    this.load.audio("broken", "assets/sounds/broken.mp3");
    this.load.audio("click", "assets/sounds/click.mp3");
    this.load.audio("complete", "assets/sounds/complete.mp3");
    this.load.audio("score", "assets/sounds/score.mp3");

    this.load.aseprite('tank', 'assets/images/sprite-tank.png', 'assets/images/sprite-tank.json');
    this.load.aseprite('explosion', 'assets/images/sprite-explosion.png', 'assets/images/sprite-explosion.json'); // 爆炸特效

    this.load.image("enemytank", "assets/images/tank-enemy.png");
    this.load.image("bullet", "assets/images/bullet.png");
    this.load.image("wall", "assets/images/brickwall.png");
    this.load.image("steelwall", "assets/images/steelwall.png");
    this.load.image("water", "assets/images/water.png");
    this.load.image("tree", "assets/images/forest.png");
    this.load.image("base", "assets/images/base.png");
    this.load.image("playerspawn", "assets/images/playerspawn.png");
    this.load.image("enemyspawn", "assets/images/enemyspawn.png");
    this.load.image("tail", "assets/images/tail.png");

    //加载地图数据
    this.load.tilemapTiledJSON("map", "map/map.json");
  }

  create() {
    // 加载场景的create方法可以留空，因为加载完成后会立即切换场景
  }
}
