// 游戏全局单例对象，game对象状态的管理，网页元素与Phaser对象之间的交互，不同Scene之间的切换
class Game {
  constructor() {
    this.isShowDebugMode = false;
    // CONST VALUE
    // Game State
    this.GAME_STATE_OVER = 1; // 游戏结束
    this.GAME_STATE_PLAYING = 2; // 游戏进行
    this.GAME_STATE_PAUSED = 3; // 游戏暂停
    this.GAME_STATE_MENU = 4; // 游戏菜单选项,加载完成准备开始。
    this.GAME_STATE_LEVEL_COMPLETE = 5; // 游戏升级

    // 游戏配置
    this.GAME_WIDTH = resource.window.CELL_SIZE * resource.window.GRID_WIDTH;
    this.GAME_HEIGHT = resource.window.CELL_SIZE * resource.window.GRID_HEIGHT;

    // 游戏状态
    this.gameState = this.GAME_STATE_MENU; // MENU, PLAYING, PAUSED, GAME_OVER
    this.currentLevel = 1;
    this.maxLevel = 10;
    this.score = 0;
    this.lives = 3;
    this.enemiesDestroyed = 0;
    //this.enemiesPerLevel = 5;
    this.levelStartTime = 0;
    this.protectionTime = 60000; // 60秒保护时间

    const config = {
      type: Phaser.AUTO,
      width: this.GAME_WIDTH,
      height: this.GAME_HEIGHT,
      parent: "gameArea",
      backgroundColor: "#000000",
      render: {
        pixelArt: true,
        antialias: false,
      },
      fps: {
        target: 60,
        forceSetTimeOut: true,
      },
      scene: [LoaderScene, MainScene],
      physics: {
        default: "arcade",
        arcade: {
          debug: this.isShowDebugMode,
        },
      },
    };

    this.game = new Phaser.Game(config);
  }

  updateButtonStates() {
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const restartBtn = document.getElementById("restartBtn");

    switch (game.gameState) {
      case game.GAME_STATE_OVER:
        startBtn.disabled = false;
        startBtn.textContent = "开始";
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
      case game.GAME_STATE_PLAYING:
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        break;
      case game.GAME_STATE_PAUSED:
        startBtn.disabled = false;
        startBtn.textContent = "继续";
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
      case game.GAME_STATE_OVER:
        startBtn.disabled = false;
        startBtn.textContent = "开始";
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
      case game.GAME_STATE_MENU:
        startBtn.disabled = false;
        startBtn.textContent = "开始";
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
    }
  }

  // 通过当前关卡
  gameSuccess() {
    this.gameState = this.GAME_STATE_LEVEL_COMPLETE;
    this.showGameOver(
      "胜利，恭喜通过关卡 [" + this.currentLevel + "]，开始下一关！",
      true,
      "开始"
    );

    if (this.game.scene.keys["MainScene"].sounds.complete) {
      this.game.scene.keys["MainScene"].sounds.complete.play();
    }
  }

  // 通过所有关卡
  gameWin() {
    this.gameState = this.GAME_STATE_OVER;
    this.showGameOver("恭喜通关全部关卡！", true,"重新开始");

    if (this.game.scene.keys["MainScene"].sounds.complete) {
      this.game.scene.keys["MainScene"].sounds.complete.play();
    }
  }

  // 游戏失败，结束
  gameOver() {
    this.gameState = this.GAME_STATE_OVER;
    this.showGameOver("失败，游戏结束！", false);
  }

  showGameOver(title, isWin, buttonText) {
    document.getElementById("gameOverTitle").textContent = title;
    document.getElementById("finalScore").textContent = this.score;
    document.getElementById("gameOver").style.display = "block";
    if (buttonText)
      document.getElementsByClassName("restart-btn")[0].innerText = buttonText;

    this.updateButtonStates();
    this.updateUI();
  }

  updateUI() {
    document.getElementById("level").textContent = this.currentLevel;
    document.getElementById("lives").textContent = this.lives;
    if (this.game.scene)
      document.getElementById("enemies").textContent =
        this.game.scene.keys["MainScene"].enemies.countActive(true);
    document.getElementById("score").textContent = this.score;
  }

  updateTimeDisplay() {
    if (this.gameState === this.GAME_STATE_PLAYING) {
      const currentTime = Date.now();
      const timeElapsed = currentTime - this.levelStartTime;
      const timeRemaining = Math.max(0, this.protectionTime - timeElapsed);
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);

      const timeElement = document.getElementById("time");
      if (timeElement) {
        timeElement.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    }
  }
}

// 创建全局游戏实例
var game = new Game();

// 游戏控制函数
function startGame() {
  try {
    // if (!game) {
    //     game = new TankBattleGame();
    // }
    var scene = game.game.scene.keys["MainScene"];

    if (game.gameState === game.GAME_STATE_MENU) {
      console.log("starting game...");
      game.gameState = game.GAME_STATE_PLAYING;
      game.currentLevel = 1;
      scene.initGame();
    } else if (game.gameState === game.GAME_STATE_PAUSED) {
      console.log("restarting game...");
      game.gameState = game.GAME_STATE_PLAYING;
      scene.physics.resume();
      restoreAllInputs(); // 恢复所有输入
    } else if (game.gameState === game.GAME_STATE_LEVEL_COMPLETE) {
      console.log("start next level...");
      game.currentLevel++; // 开始下一关
      game.gameState = game.GAME_STATE_PLAYING;
      scene.initGame();
      hideGameOverWindow();
    } else if (game.gameState === game.GAME_STATE_OVER) {
      restartGame();
      return;
    }

    if (scene && scene.sounds.click) {
      scene.sounds.click.play();
    }
    scene.physics.resume(); // 恢复物理系统
    game.updateButtonStates();
  } catch (error) {
    console.error("start game error:", error);
  }
}

// 完全禁用键盘和鼠标输入
function disableAllInputs() {
  scene = game.game.scene.keys["MainScene"];
  // 禁用键盘
  scene.input.keyboard.enabled = false;

  // 禁用鼠标/触摸
  scene.input.mouse.enabled = false;
  //game.scene.input.touch.enabled = false;

  // 禁用所有交互元素（按钮、精灵等）
  scene.input.enabled = false;
}

// 恢复键盘和鼠标输入
function restoreAllInputs() {
  scene = game.game.scene.keys["MainScene"];
  // 恢复键盘
  scene.input.keyboard.enabled = true;

  // 恢复鼠标/触摸
  scene.input.mouse.enabled = true;
  //game.scene.input.touch.enabled = true;

  // 恢复所有交互元素
  scene.input.enabled = true;
}

function togglePause() {
  if (game && game.gameState === game.GAME_STATE_PLAYING) {
    game.gameState = game.GAME_STATE_PAUSED;
    game.game.scene.keys["MainScene"].physics.pause(); // 暂停物理系统
    disableAllInputs(); // 禁用所有输入
    if (game.sounds && game.sounds.click) {
      game.sounds.click.play();
    }
  }

  if (game) {
    game.updateButtonStates();
  }
}

function hideGameOverWindow() {
  document.getElementById("gameOver").style.display = "none";
  //console.log("hideGameOverWindow");
}

function restartGame() {
  if (game) {
    hideGameOverWindow();
    if (game.sounds && game.sounds.click) {
      game.sounds.click.play();
    }
    var scene = game.game.scene.keys["MainScene"];
    
    game.currentLevel = 1;
    scene.initGame();
    
    game.gameState = game.GAME_STATE_PLAYING;
    scene.physics.resume(); // 恢复物理系统
    game.updateButtonStates();
  }
}
