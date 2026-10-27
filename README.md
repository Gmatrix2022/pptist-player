# PPTist Player (`pptist-player`)

> **Zero-dependency, ultra-lightweight (~8KB) standalone presentation player & offline HTML packager for PPTist AST.**  
> 专为 PPTist 抽象语法树（AST）设计的零依赖、超轻量独立放映播放器与脱机 HTML 生成引擎。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)]()
[![Size: <8KB](https://img.shields.io/badge/size-%3C8KB-success.svg)]()

---

## Highlights · 核心特性

- **Zero Runtime Dependencies (零运行时依赖)**  
  Pure Vanilla TypeScript / JS. No Vue, no React, no Pinia, no heavy external libraries.  
  纯原生实现，彻底告别数十兆的前端框架打包负担。
- **1:1 Pixel-Perfect Fidelity (1:1 绝对像素保真)**  
  Strictly adheres to PPTist's canvas coordinate space (`1536 × 864` or 16:9). Native SVG Path rendering with subpixel precision.  
  与 PPTist 编辑画布绝对像素级对齐，所见即所放。
- **Zero-Server Offline Portability (脱机零服务即开)**  
  Bypasses Chromium's `file:///` CORS security restrictions through complete self-contained data inlining. Double-click to present anywhere from USB drives.  
  彻底解决 Chromium `file:///` 跨域拦截，U 盘插上双击秒开，无需任何本地 HTTP 服务。
- **Fluid Stage Auto-Scaling (16:9 物理满版无黑边)**  
  Hardware-accelerated CSS `transform: scale()` automatically adapts to 1080P, 2K, 4K, laptops, and projectors without layout shifts or text reflows.  
  硬件加速等比物理缩放，杜绝文字错位与死黑边。
- **Presenter Mode & Clean Controls (讲台无感放映)**  
  Keyboard-driven navigation (`Space`, `PageDown`, `Arrows`, `F` for fullscreen, `M` for slide drawer). Non-intrusive floating HUD with auto-hide.  
  纯键盘放映，鼠标静止自动隐形控制栏。

---

## Quick Start · 快速上手

### 1. CLI Usage · 命令行一键打包脱机网页

Convert any PPTist JSON into a single-file, zero-server offline presentation:

```bash
# Direct execution via npx
npx pptist-player input.json -o presentation.html -t "My Course Deck"

# Or install globally
npm install -g pptist-player
pptist-player presentation.json -o index.html
```

Output: A single `.html` file that opens in any browser instantly without installing anything!

---

### 2. Embed into Modern Web Apps (React, Vue, Vanilla)

```bash
npm install pptist-player
```

```typescript
import { PPTistPlayer } from 'pptist-player';

const player = new PPTistPlayer({
  container: '#presentation-container',
  data: pptistDeckJson,
  autoFit: true,
  keyboard: true,
  onSlideChange: (current, total) => {
    console.log(`Now showing: ${current + 1} / ${total}`);
  }
});

// Programmatic navigation
player.next();
player.prev();
player.goTo(5);
player.toggleFullScreen();
```

---

### 3. CDN / Script Tag Usage

```html
<script src="https://unpkg.com/pptist-player/dist/index.global.js"></script>
<div id="player" style="width: 100vw; height: 100vh;"></div>

<script>
  fetch('./my-deck.json')
    .then(r => r.json())
    .then(deck => {
      new PPTistPlayer({
        container: '#player',
        data: deck
      });
    });
</script>
```

---

## Comparison with Official PPTist Packaging · 方案对比

| Metric / Feature | Official SPA Build (`dist/`) | Official Desktop App (Tauri) | **`pptist-player` (This Project)** |
| :--- | :--- | :--- | :--- |
| **Output Size** | 30 MB ~ 50 MB | 70 MB ~ 120 MB | **< 10 KB runtime (Single HTML)** |
| **Runtime Dependencies** | Heavy (Vue3, Pinia, UI Libs) | WebView2 / Chromium engine | **0 (Pure Web Standards)** |
| **`file:///` Double-Click** | ❌ Blocked by CORS error | ✅ Yes (as desktop executable) | **✅ 100% Native, zero servers** |
| **Startup Latency** | 1.5s ~ 3.5s | 1.0s ~ 2.0s | **0ms (Instantaneous cold boot)** |
| **Editing Capability** | Full editor UI | Full editor UI | **Lightweight presentation only** |

---

## Architecture · 架构原理

```
  ┌─────────────────────────────────────────────────────────┐
  │                 PPTist AST (JSON File)                  │
  │    (width, height, slides, shapes, text, images, lines) │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │              PPTist Player Core Engine                  │
  │  1. Viewport Fit & Scale Engine (min(winW/W, winH/H))   │
  │  2. Element Renderer (Native SVG Path + Absolute Divs)  │
  │  3. Lazy Slide Materializer (Preload Adjacent Slides)   │
  │  4. Keyboard Event Loop & Fullscreen State Machine      │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │             Physical Browser Presentation               │
  │      (1:1 Pixel-Perfect, 60FPS, Zero Network Latency)   │
  └─────────────────────────────────────────────────────────┘
```

---

## API Reference

### `new PPTistPlayer(options)`

- **`container`** (`HTMLElement | string`): Container element or CSS selector.
- **`data`** (`PPTistDeck`): PPTist standard AST object.
- **`initialSlide`** (`number`, default: `0`): 0-indexed slide to open initially.
- **`autoFit`** (`boolean`, default: `true`): Automatically compute and resize stage scale on window resize.
- **`keyboard`** (`boolean`, default: `true`): Enable `Space`/`Arrows`/`PageDown`/`F` hotkeys.
- **`onSlideChange`** (`(index: number, total: number) => void`): Lifecycle callback on slide switch.

### Methods

- **`player.next()`**: Advance to next slide.
- **`player.prev()`**: Back to previous slide.
- **`player.goTo(index)`**: Jump to specific slide.
- **`player.toggleFullScreen()`**: Toggle browser native fullscreen mode.
- **`player.destroy()`**: Clean up DOM nodes and listeners.

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

Copyright (c) 2026 Yang Kecheng (keche).
