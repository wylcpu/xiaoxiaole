# match3-game — 消消乐

Vue 3 + TypeScript 消消乐游戏，1000关渐进难度，移动端优先。

## Commands

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | vue-tsc 类型检查 → vite 构建 |
| `npm run preview` | 预览构建产物 |

`npm run build` 必须通过（vue-tsc + vite 双步骤），且 `dist/` 已提交到仓库。

## Project Structure

```
src/
├── main.ts                    # 入口，挂载 App
├── App.vue                    # 路由：menu / playing / levelComplete / gameOver
├── style.css                  # 全局：深色渐变背景、fixed body 无滚动
├── types/game.ts              # Position, Gem, LevelConfig, GEM_COLORS
├── composables/
│   ├── useGameLogic.ts        # 核心：棋盘、匹配、重力、连击、洗牌
│   ├── useLevels.ts           # 1000关难度公式
│   └── useStorage.ts          # localStorage 持久化（key: "match3_progress"）
└── components/
    ├── GameView.vue           # 游戏容器，reactive(useGameLogic) 包装
    ├── GameBoard.vue          # 8×8 棋盘，绝对定位宝石，PointerEvent 手势
    ├── GemTile.vue            # 单颗宝石，8种渐变色 + `selected` prop
    ├── TopBar.vue             # 精简顶栏：返回 / 关号 / 分数进度 / 步数
    ├── LevelSelect.vue        # 选关：区域卡片 → 5列关卡网格
    └── GameModal.vue          # 过关/失败弹窗
```

## Architecture Facts

- **App.vue 路由**: `screen` ref 控制 3 种视图。`gameId` ref 递增作为 GameView 的 `:key` 触发挂载/卸载。
- **GameView 生命周期**: 挂载时调用 `game.initBoard()`，游戏逻辑完全自包含在 `useGameLogic` 中。用 `reactive(useGameLogic(config))` 包装使所有 ref 在模板中自动解包。
- **GameState 状态机**: `idle → swapping → removing → dropping → filling → idle`。`watch(game.gameState)` 在 `idle` 时检测胜负。
- **宝石渲染**: 绝对定位 + CSS transition 驱动动画。`top`/`left` 过渡同为 0.2s cubic-bezier。
- **动画时序**（`useGameLogic.ts` + `GameBoard.vue` CSS 需要匹配）:
  | 阶段 | JS delay | CSS duration |
  |------|----------|--------------|
  | 消除 | 280ms | 0.3s (gemMatched) |
  | 重力下落 | 220ms | 0.2s (transition) |
  | 填充 | 220ms | 0.25s (gemAppear) |
  | 交换反馈 | 160ms | 0.2s (transition) |
  连击时循环消除→重力→填充直到无匹配。
- **手势**: `onPointerDown`/`onPointerUp` 在 GameBoard，滑动距离 > 15px 触发方向交换，否则视为点击。滑动时通过 `nextTick` 连续发出两次 `select` event。
- **棋盘 CSS**: `--board-size: min(calc(100vw - 24px), calc(100dvh - 130px))` 响应式。
- **关卡**: `useLevels.ts` 公式驱动，无需数据文件。5→6→7→8 种宝石，步数递减，分数递增。
- **存储**: `localStorage.getItem('match3_progress')`，存储 `{ unlocked, stars, highScores }`。
- **构建产物**: `dist/` 已提交。`vite.config.ts` 中 `base: './'`（相对路径，可直接部署 GitHub Pages）。

## Key Conventions

- 不修改 `composables/` 和 `types/` 下文件时，只改样式/模板不影响游戏逻辑。
- 背景保持深色渐变（`#0f0c29 → #302b63 → #24243e`），`html` 底色设为 `#0f0c29` 防止白色透出。
- `body` 固定 `position: fixed; overflow: hidden` 锁定视口，全局无滚动。
- 使用 `env(safe-area-inset-*)` 适配刘海屏。
- 触控目标最小 44px。`dist/` 在 `.gitignore` 之外，每次都提交。
- 无测试文件，无 CI 配置。
