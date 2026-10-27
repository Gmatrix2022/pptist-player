#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
PPTist Player CLI - Ultra-lightweight HTML Presentation Packager
Usage:
  npx pptist-player <input.json> [options]

Options:
  -o, --output <file>    Output HTML file path (default: <input-basename>.html)
  -t, --title <title>    Presentation title
  -h, --help             Show help message

Example:
  npx pptist-player presentation.json -o index.html -t "My Course Deck"
`);
}

const args = process.argv.slice(2);
if (!args.length || args.includes('-h') || args.includes('--help')) {
  printUsage();
  process.exit(0);
}

let inputFile = null;
let outputFile = null;
let title = 'PPTist Presentation';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-o' || arg === '--output') {
    outputFile = args[++i];
  } else if (arg === '-t' || arg === '--title') {
    title = args[++i];
  } else if (!arg.startsWith('-') && !inputFile) {
    inputFile = arg;
  }
}

if (!inputFile) {
  console.error('Error: Please specify an input JSON file.');
  process.exit(1);
}

const resolvedInput = path.resolve(process.cwd(), inputFile);
if (!fs.existsSync(resolvedInput)) {
  console.error(`Error: File not found: ${resolvedInput}`);
  process.exit(1);
}

if (!outputFile) {
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  outputFile = `${baseName}.html`;
}
const resolvedOutput = path.resolve(process.cwd(), outputFile);

try {
  const rawData = fs.readFileSync(resolvedInput, 'utf8');
  const deck = JSON.parse(rawData);
  if (!title && deck.title) title = deck.title;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #viewport { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    #canvas-stage { position: relative; transform-origin: center center; box-shadow: 0 25px 60px rgba(0,0,0,0.45); background: #FFFFFF; overflow: hidden; flex-shrink: 0; }
    .slide-layer { position: absolute; inset: 0; display: none; background: #FFFFFF; }
    .slide-layer.active { display: block; }
    .ast-el { position: absolute; box-sizing: border-box; }
    .ast-text { word-break: break-word; pointer-events: auto; }
    .ast-text p { margin: 0; }
    .ast-shape { pointer-events: none; }
    .ast-shape svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .ast-image { pointer-events: none; }
    .ast-image img { width: 100%; height: 100%; display: block; }
    .ast-line { pointer-events: none; overflow: visible; }
    #presenter-bar { position: absolute; bottom: 24px; right: 32px; display: flex; align-items: center; gap: 12px; background: rgba(15,23,42,0.78); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.16); border-radius: 999px; padding: 6px 16px; color: #E2E8F0; font-size: 14px; font-family: Consolas, monospace; z-index: 1000; transition: opacity 0.35s ease; }
    #presenter-bar.idle { opacity: 0.12; }
    #presenter-bar:hover { opacity: 1 !important; }
    .ctrl-btn { background: none; border: none; color: #E2E8F0; font-size: 15px; cursor: pointer; padding: 4px 8px; border-radius: 6px; outline: none; }
    .ctrl-btn:hover { background: rgba(255,255,255,0.15); color: #FFFFFF; }
  </style>
  <script>window.__PPTIST_DATA__ = ${JSON.stringify(deck)};</script>
</head>
<body>
  <div id="viewport"><div id="canvas-stage"></div></div>
  <div id="presenter-bar">
    <button class="ctrl-btn" id="btn-prev">◀</button>
    <span id="page-indicator">01 / ${String(deck.slides.length).padStart(2, '0')}</span>
    <button class="ctrl-btn" id="btn-next">▶</button>
    <button class="ctrl-btn" id="btn-fs" style="margin-left:4px;">⛶</button>
  </div>
  <script>
    (function() {
      const DATA = window.__PPTIST_DATA__;
      const STAGE_W = DATA.width || 1536;
      const STAGE_H = DATA.height || 864;
      const slides = DATA.slides;
      let currentIndex = 0;
      const stage = document.getElementById('canvas-stage');
      stage.style.width = STAGE_W + 'px';
      stage.style.height = STAGE_H + 'px';
      const indicator = document.getElementById('page-indicator');
      const presenterBar = document.getElementById('presenter-bar');

      function fitStage() {
        const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
        stage.style.transform = 'scale(' + scale + ')';
      }
      window.addEventListener('resize', fitStage);
      fitStage();

      function renderSlide(slide, container) {
        container.innerHTML = '';
        if (slide.background?.color) container.style.background = slide.background.color;
        for (const el of slide.elements || []) {
          const t = el.type, left = el.left || 0, top = el.top || 0, w = el.width || 0, h = el.height || 0, rot = el.rotate || 0, op = el.opacity !== undefined ? el.opacity : 1;
          if (t === 'shape') {
            const div = document.createElement('div');
            div.className = 'ast-el ast-shape';
            div.style.left = left + 'px'; div.style.top = top + 'px'; div.style.width = w + 'px'; div.style.height = h + 'px'; div.style.opacity = op;
            if (rot) div.style.transform = 'rotate(' + rot + 'deg)';
            const vb = el.viewBox || [w, h];
            const outline = el.outline || el.border;
            let stroke = '';
            if (outline) stroke = 'stroke="' + (outline.color || '#CBD5E1') + '" stroke-width="' + (outline.width || 1) + '"';
            div.innerHTML = '<svg viewBox="0 0 ' + vb[0] + ' ' + vb[1] + '" preserveAspectRatio="none"><path d="' + (el.path || '') + '" fill="' + (el.fill || 'none') + '" ' + stroke + ' /></svg>';
            container.appendChild(div);
          } else if (t === 'text') {
            const div = document.createElement('div');
            div.className = 'ast-el ast-text';
            div.style.left = left + 'px'; div.style.top = top + 'px'; div.style.width = w + 'px'; div.style.height = h + 'px'; div.style.opacity = op;
            if (rot) div.style.transform = 'rotate(' + rot + 'deg)';
            div.innerHTML = el.content || '';
            container.appendChild(div);
          } else if (t === 'image') {
            const div = document.createElement('div');
            div.className = 'ast-el ast-image';
            div.style.left = left + 'px'; div.style.top = top + 'px'; div.style.width = w + 'px'; div.style.height = h + 'px'; div.style.opacity = op;
            if (rot) div.style.transform = 'rotate(' + rot + 'deg)';
            div.innerHTML = '<img src="' + el.src + '" style="width:100%;height:100%;object-fit:' + (el.fixedRatio ? 'contain' : 'fill') + ';" />';
            container.appendChild(div);
          } else if (t === 'line') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'ast-el ast-line');
            svg.style.left = left + 'px'; svg.style.top = top + 'px'; svg.style.width = '1px'; svg.style.height = '1px';
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', el.start ? el.start[0] : 0); line.setAttribute('y1', el.start ? el.start[1] : 0);
            line.setAttribute('x2', el.end ? el.end[0] : w); line.setAttribute('y2', el.end ? el.end[1] : 0);
            line.setAttribute('stroke', el.color || '#CBD5E1'); line.setAttribute('stroke-width', el.width || 1);
            svg.appendChild(line); container.appendChild(svg);
          }
        }
      }

      const layers = slides.map((s, idx) => {
        const l = document.createElement('div');
        l.className = 'slide-layer' + (idx === 0 ? ' active' : '');
        l.style.width = STAGE_W + 'px'; l.style.height = STAGE_H + 'px';
        stage.appendChild(l);
        return l;
      });

      const rendered = new Set();
      function show(idx) {
        if (idx < 0 || idx >= slides.length) return;
        currentIndex = idx;
        layers.forEach((l, i) => {
          if (i === idx) {
            l.classList.add('active');
            if (!rendered.has(i)) { renderSlide(slides[i], l); rendered.add(i); }
          } else { l.classList.remove('active'); }
        });
        if (idx + 1 < slides.length && !rendered.has(idx + 1)) {
          renderSlide(slides[idx + 1], layers[idx + 1]); rendered.add(idx + 1);
        }
        indicator.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      }
      show(0);

      window.addEventListener('keydown', (e) => {
        if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) show(currentIndex + 1);
        else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) show(currentIndex - 1);
        else if (['f', 'F', 'F5'].includes(e.key)) {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
          else document.exitFullscreen().catch(()=>{});
        }
      });
      document.getElementById('btn-next').onclick = () => show(currentIndex + 1);
      document.getElementById('btn-prev').onclick = () => show(currentIndex - 1);
      document.getElementById('btn-fs').onclick = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
        else document.exitFullscreen().catch(()=>{});
      };
      let timer = null;
      window.addEventListener('mousemove', () => {
        presenterBar.classList.remove('idle');
        clearTimeout(timer);
        timer = setTimeout(() => presenterBar.classList.add('idle'), 2500);
      });
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(resolvedOutput, html, 'utf8');
  const sizeMb = (fs.statSync(resolvedOutput).size / 1024 / 1024).toFixed(2);
  console.log(`[SUCCESS] Generated standalone offline presentation:`);
  console.log(`  File: ${resolvedOutput}`);
  console.log(`  Size: ${sizeMb} MB | Slides: ${deck.slides.length}`);
} catch (err) {
  console.error(`[ERROR] Failed to compile: ${err.message}`);
  process.exit(1);
}
