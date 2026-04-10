import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid';
import {
  getAdventures,
  saveAdventure,
  saveMemory,
  getPet,
} from '../db';
import type {
  Physics,
  GameBlock,
  BlockType,
  Enemy,
  EnemyType,
  Particle,
  PlayerState,
  Level,
  LevelResult,
  FailureRecord,
  LevelReward,
} from '../types/adventure';

// 关卡配置
const LEVELS: Level[] = [
  {
    id: 'level_1',
    name: '始之地',
    width: 200,
    height: 15,
    spawnX: 2.5,
    spawnY: 10,
    flagX: 180,
    background: 'day',
    difficulty: 1,
    blocks: generateLevelBlocks(1),
    enemies: generateEnemies(1, 5),
  },
  {
    id: 'level_2',
    name: '森林秘境',
    width: 250,
    height: 15,
    spawnX: 2.5,
    spawnY: 10,
    flagX: 230,
    background: 'cave',
    difficulty: 2,
    blocks: generateLevelBlocks(2),
    enemies: generateEnemies(2, 8),
  },
  {
    id: 'level_3',
    name: '火山地带',
    width: 300,
    height: 15,
    spawnX: 2.5,
    spawnY: 10,
    flagX: 280,
    background: 'night',
    difficulty: 3,
    blocks: generateLevelBlocks(3),
    enemies: generateEnemies(3, 12),
  },
];

// 生成关卡方块
function generateLevelBlocks(level: number): GameBlock[] {
  const blocks: GameBlock[] = [];
  const width = level === 1 ? 200 : level === 2 ? 250 : 300;

  // 地面（调整到 y=11，让玩家站在上面）
  // 地面块从 x=2 开始，与玩家初始位置对齐
  for (let x = 2; x < width; x++) {
    // 添加间隙（最大宽度减小到 4 个方块）
    if ((x >= 32 && x <= 35) || (x >= 72 && x <= 75) || (x >= 122 && x <= 125)) {
      continue;
    }
    blocks.push({ x, y: 11, type: 'ground' });
  }

  // 平台和障碍物
  const platforms = [
    { x: 10, y: 8, width: 3, type: 'brick' },
    { x: 15, y: 6, width: 2, type: 'question' },
    { x: 20, y: 8, width: 3, type: 'brick' },
    { x: 28, y: 8, width: 1, type: 'pipe' },
    { x: 45, y: 8, width: 3, type: 'brick' },
    { x: 50, y: 6, width: 1, type: 'question' },
    { x: 55, y: 8, width: 3, type: 'brick' },
    { x: 65, y: 8, width: 1, type: 'pipe' },
    { x: 90, y: 7, width: 4, type: 'brick' },
    { x: 95, y: 5, width: 1, type: 'question' },
    { x: 110, y: 8, width: 3, type: 'brick' },
    { x: 130, y: 7, width: 2, type: 'pipe' },
    { x: 145, y: 6, width: 3, type: 'brick' },
    { x: 150, y: 8, width: 1, type: 'question' },
    { x: 170, y: 8, width: 3, type: 'brick' },
    { x: 180, y: 7, width: 2, type: 'pipe' },
    { x: 200, y: 6, width: 4, type: 'brick' },
    { x: 210, y: 8, width: 1, type: 'question' },
  ];

  platforms.forEach(p => {
    for (let i = 0; i < p.width; i++) {
      blocks.push({ x: p.x + i, y: p.y, type: p.type as BlockType });
    }
  });

  // 隐藏方块
  const hiddenPlatforms = [
    { x: 18, y: 6, type: 'block' },
    { x: 48, y: 6, type: 'block' },
    { x: 148, y: 6, type: 'block' },
  ];

  hiddenPlatforms.forEach(p => {
    blocks.push({ x: p.x, y: p.y, type: p.type as BlockType });
  });

  // 管道
  const pipes = [
    { x: 28, y: 10, width: 2, height: 2 },
    { x: 65, y: 10, width: 2, height: 2 },
    { x: 130, y: 6, width: 2, height: 6 },
    { x: 180, y: 5, width: 2, height: 7 },
  ];

  pipes.forEach(p => {
    for (let py = p.y; py > p.y - p.height; py--) {
      for (let px = 0; px < p.width; px++) {
        blocks.push({ x: p.x + px, y: py, type: px === 0 || px === p.width - 1 ? 'pipe' : 'ground' });
      }
    }
  });

  // 旗帜杆
  blocks.push({ x: level === 1 ? 178 : level === 2 ? 228 : 278, y: 3, type: 'flag' });
  for (let y = 4; y < 12; y++) {
    blocks.push({ x: level === 1 ? 178 : level === 2 ? 228 : 278, y: y, type: 'block' });
  }

  return blocks;
}

// 生成敌人
function generateEnemies(level: number, count: number): Enemy[] {
  const enemies: Enemy[] = [];
  const enemyTypes: EnemyType[] = ['goomba', 'turtle', 'plant'];

  for (let i = 0; i < count; i++) {
    const x = 40 + i * 35 + Math.floor(Math.random() * 20);
    enemies.push({
      id: generateUUID(),
      type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
      x,
      y: 10,
      vx: level === 1 ? 0.5 : level === 2 ? 0.8 : 1.0,
      vy: 0,
      hp: 1,
      maxHp: 1,
      patrolStart: x - 10,
      patrolEnd: x + 10,
      alive: true,
      level,
    });
  }

  return enemies;
}

export const useAdventureStore = defineStore('adventure', () => {
  // 游戏状态
  const currentLevel = ref<Level>(LEVELS[0]);
  const player = ref<PlayerState>({
    position: { x: 2.5, y: 10 }, // 玩家位置与地面块对齐（地面块从 x=2 开始）
    velocity: { x: 0, y: 0 },
    onGround: false, // 初始在空中，等待碰到地面
    facing: 'right',
    invincible: false,
    invincibleTime: 0,
    dead: false,
    win: false,
    coins: 0,
    lives: 3,
  });
  const enemies = ref<Enemy[]>([]);
  const particles = ref<Particle[]>([]);
  const cameraX = ref(0);
  const gameTime = ref(0);
  const score = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const blocks = computed(() => currentLevel.value?.blocks || []);

  // 敌人列表（确保返回数组）
  const enemiesList = computed(() => enemies.value || []);
  const particlesList = computed(() => particles.value || []);

  const gameStatus = computed(() => {
    if (player.value.dead) return 'dead';
    if (player.value.win) return 'win';
    if (player.value.invincible) return 'invincible';
    return 'playing';
  });

  // 输入状态
  const keys = ref<Record<string, boolean>>({});

  // 初始化关卡
  function initLevel(levelIndex: number): void {
    if (levelIndex >= LEVELS.length) {
      levelIndex = 0; // 循环回第一关
    }
    currentLevel.value = LEVELS[levelIndex];

    // 重置玩家状态
    player.value = {
      position: { x: currentLevel.value.spawnX, y: currentLevel.value.spawnY },
      velocity: { x: 0, y: 0 },
      onGround: false,
      facing: 'right',
      invincible: false,
      invincibleTime: 0,
      dead: false,
      win: false,
      coins: 0,
      lives: player.value.lives,
    };

    // 复制敌人（避免修改原始数据）
    enemies.value = JSON.parse(JSON.stringify(LEVELS[levelIndex].enemies)) as Enemy[];
    particles.value = [];
    cameraX.value = 0;
    gameTime.value = 0;
    score.value = 0;
  }

  // 键盘事件处理
  function handleKeyDown(key: string): void {
    keys.value[key] = true;

    // 跳跃（按住加速）
    if (key === 'ArrowUp' || key === ' ' || key === 'w') {
      if (player.value.onGround && !player.value.dead && !player.value.win) {
        player.value.velocity.y = -10;
        player.value.onGround = false;
      }
    }

    // 快速下落
    if (key === 'ArrowDown' || key === 's') {
      if (!player.value.onGround) {
        player.value.velocity.y += 0.5;
      }
    }
  }

  function handleKeyUp(key: string): void {
    keys.value[key] = false;
  }

  // 游戏更新循环
  function update(dt: number): void {
    if (player.value.dead || player.value.win) return;

    gameTime.value += dt;
    score.value += Math.floor(dt * 10);

    // 玩家输入 - 物理参数调整
    const speed = 0.4;          // 移动速度（增加跳跃宽度）
    const jumpForceY = -8;      // 跳跃力（增加跳跃高度）
    const gravity = 0.25;       // 重力（减小重力以增加跳跃时间）

    player.value.velocity.x = 0;

    const isLeft = keys.value['ArrowLeft'] || keys.value['a'] || keys.value['A'];
    const isRight = keys.value['ArrowRight'] || keys.value['d'] || keys.value['D'];
    const isUp = keys.value['ArrowUp'] || keys.value[' '] || keys.value['w'] || keys.value['W'];

    if (isLeft) {
      player.value.velocity.x = -speed;
      player.value.facing = 'left';
    }
    if (isRight) {
      player.value.velocity.x = speed;
      player.value.facing = 'right';
    }

    // 跳跃（限制为垂直跳跃）
    if (isUp && player.value.onGround) {
      player.value.velocity.y = jumpForceY;
      player.value.onGround = false;
    }

    // 玩家碰撞箱参数
    const playerWidth = 0.5;
    const playerHeight = 1.0;

    // === 水平移动与碰撞检测（预测性） ===
    let nextX = player.value.position.x + player.value.velocity.x;

    // 检查水平方向是否有障碍
    if (player.value.velocity.x !== 0) {
      for (const block of blocks.value) {
        if (block.type === 'air') continue;

        // 玩家与方块有垂直重叠才检测水平碰撞
        const yOverlap = player.value.position.y < block.y + 1 && player.value.position.y + playerHeight > block.y;
        if (yOverlap) {
          if (player.value.velocity.x > 0) {
            // 向右移动，检查是否会撞到方块左侧
            if (nextX + playerWidth > block.x && player.value.position.x + playerWidth <= block.x) {
              nextX = block.x - playerWidth;
              player.value.velocity.x = 0;
              break;
            }
          } else if (player.value.velocity.x < 0) {
            // 向左移动，检查是否会撞到方块右侧
            if (nextX < block.x + 1 && player.value.position.x >= block.x + 1) {
              nextX = block.x + 1;
              player.value.velocity.x = 0;
              break;
            }
          }
        }
      }
    }
    player.value.position.x = nextX;

    // === 垂直移动与碰撞检测 ===
    player.value.velocity.y += gravity;
    let nextY = player.value.position.y + player.value.velocity.y;
    player.value.onGround = false;

    // 检查垂直方向是否有地面
    if (player.value.velocity.y >= 0) {
      // 下落时检测地面
      for (const block of blocks.value) {
        if (block.type === 'air') continue;

        // 玩家与方块有水平重叠才检测垂直碰撞
        const xOverlap = player.value.position.x < block.x + 1 && player.value.position.x + playerWidth > block.x;
        if (xOverlap) {
          // 从上方落下碰到方块
          if (nextY + playerHeight >= block.y && player.value.position.y + playerHeight <= block.y + 0.5) {
            nextY = block.y - playerHeight;
            player.value.velocity.y = 0;
            player.value.onGround = true;
            break;
          }
        }
      }
    } else {
      // 向上移动，检测顶头
      for (const block of blocks.value) {
        if (block.type === 'air') continue;

        const xOverlap = player.value.position.x < block.x + 1 && player.value.position.x + playerWidth > block.x;
        if (xOverlap) {
          // 从下方撞击方块
          if (nextY <= block.y + 1 && player.value.position.y + playerHeight > block.y + 0.5) {
            nextY = block.y + 1;
            player.value.velocity.y = 0;
            break;
          }
        }
      }
    }
    player.value.position.y = nextY;

    // 边界检查
    if (player.value.position.x < 0) player.value.position.x = 0;
    // 跳跃高度约束 - 最高为玩家身高的 3 倍（玩家高度为 1，起始 y=10，最高 y=7）
    if (player.value.position.y < 7) {
      player.value.position.y = 7;
      player.value.velocity.y = 0;
    }
    // 掉落检测 - 重置而不是死亡
    if (player.value.position.y > currentLevel.value.height + 2) {
      player.value.position.y = currentLevel.value.spawnY;
      player.value.velocity.y = 0;
      player.value.position.x = currentLevel.value.spawnX;
      player.value.velocity.x = 0;
    }
    // 限制右边界
    if (player.value.position.x > currentLevel.value.width - 1) {
      player.value.position.x = currentLevel.value.width - 1;
    }

    // 敌人逻辑
    enemies.value.forEach(enemy => {
      if (!enemy.alive) return;

      // 简单巡逻逻辑
      if (enemy.x <= enemy.patrolStart) {
        enemy.vx = Math.abs(enemy.vx);
      } else if (enemy.x >= enemy.patrolEnd) {
        enemy.vx = -Math.abs(enemy.vx);
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      enemy.vy += gravity;

      // 简单地面碰撞
      const enemyGround = blocks.value.find(b => b.x === Math.floor(enemy.x) && b.y === Math.floor(enemy.y) && b.type !== 'air');
      if (enemyGround) {
        enemy.y = enemyGround.y - 1;
        enemy.vy = 0;
      }

      // 与玩家碰撞
      if (
        Math.abs(player.value.position.x - enemy.x) < 0.8 &&
        Math.abs(player.value.position.y - enemy.y) < 0.8
      ) {
        // 踩头
        if (player.value.velocity.y > 0 && player.value.position.y < enemy.y) {
          enemy.alive = false;
          player.value.velocity.y = -6;
          score.value += 200;
          createParticles(enemy.x, enemy.y, 'dust');
        } else if (!player.value.invincible) {
          takeDamage(1);
        }
      }
    });

    // 敌人掉落
    enemies.value = enemies.value.filter(e => e.y < currentLevel.value.height + 5);

    // 粒子更新
    particles.value.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.life -= dt;
    });
    particles.value = particles.value.filter(p => p.life > 0);

    // 旗杆检测（胜利）
    if (
      Math.abs(player.value.position.x - currentLevel.value.flagX) < 1 &&
      player.value.position.y >= 3
    ) {
      winLevel();
    }

    // 无敌时间减少
    if (player.value.invincible) {
      player.value.invincibleTime -= dt;
      if (player.value.invincibleTime <= 0) {
        player.value.invincible = false;
      }
    }

    // 相机跟随
    cameraX.value = player.value.position.x - 6;
    if (cameraX.value < 0) cameraX.value = 0;
    if (cameraX.value > currentLevel.value.width - 12) {
      cameraX.value = currentLevel.value.width - 12;
    }
  }

  // 碰撞检测
  function checkCollision(r1: { x: number; y: number; width: number; height: number }, r2: { x: number; y: number; width: number; height: number }): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y <= r2.y + r2.height &&
      r1.y + r1.height >= r2.y
    );
  }

  // 玩家受伤
  function takeDamage(amount: number): void {
    if (player.value.invincible) return;

    player.value.lives -= amount;
    player.value.invincible = true;
    player.value.invincibleTime = 3; // 3秒无敌时间
    player.value.velocity.y = -5;
    player.value.velocity.x = player.value.facing === 'right' ? -5 : 5;

    if (player.value.lives <= 0) {
      die('hit-by-enemy');
    }
  }

  // 玩家死亡
  function die(reason: string): void {
    player.value.dead = true;

    // 记录失败记忆
    const failure: FailureRecord = {
      id: generateUUID(),
      petId: 'default',
      levelId: currentLevel.value.id,
      location: { x: Math.floor(player.value.position.x), y: Math.floor(player.value.position.y) },
      reason,
      timestamp: new Date().toISOString(),
      experienceLearned: 10,
    };

    saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'failure' as const,
      title: '失败记录',
      content: `在 ${currentLevel.value.name} 第 ${failure.levelId} 关失败: ${reason}`,
      metadata: {
        levelId: failure.levelId,
        location: failure.location,
        reason: failure.reason,
        experienceLearned: failure.experienceLearned,
      },
      timestamp: failure.timestamp,
      usefulness: 5,
      tags: ['failure', 'learned'],
    }).catch(() => {});  // eslint-disable-line @typescript-eslint/no-empty-function
  }

  // 胜利关卡
  function winLevel(): void {
    player.value.win = true;
    score.value += Math.floor((100 - gameTime.value) * 10);

    // 记录成功
    score.value = Math.max(0, score.value);
  }

  // 创建粒子效果
  function createParticles(x: number, y: number, type: 'dust' | 'break' | 'coin'): void {
    for (let i = 0; i < 5; i++) {
      particles.value.push({
        id: generateUUID(),
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        life: 0.5,
        color: type === 'break' ? '#8d6e63' : type === 'coin' ? '#ffd700' : '#bdbdbd',
        type,
      });
    }
  }

  // 获取关卡奖励
  function getLevelReward(): LevelReward {
    return {
      experience: 50 + score.value / 10,
      coins: player.value.coins * 5,
      items: ['mushroom', 'flower'].filter(() => Math.random() > 0.5),
    };
  }

  // 重置游戏
  function resetGame(): void {
    player.value = {
      position: { x: 2.0, y: 10 },
      velocity: { x: 0, y: 0 },
      onGround: false,
      facing: 'right',
      invincible: false,
      invincibleTime: 0,
      dead: false,
      win: false,
      coins: 0,
      lives: 3,
    };
    enemies.value = [];
    particles.value = [];
    score.value = 0;
    gameTime.value = 0;
  }

  return {
    currentLevel,
    player,
    enemies: enemiesList,
    particles: particlesList,
    blocks,
    cameraX,
    gameTime,
    score,
    gameStatus,
    isLoading,
    error,
    keys,
    initLevel,
    handleKeyDown,
    handleKeyUp,
    update,
    winLevel,
    getLevelReward,
    resetGame,
  };
});
