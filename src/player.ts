import { PPTistDeck, PPTistSlide, PlayerOptions } from './types';
import { ElementRenderer } from './renderer';

export class PPTistPlayer {
  private container: HTMLElement;
  private data: PPTistDeck;
  private stageWidth: number;
  private stageHeight: number;
  private slides: PPTistSlide[];
  private currentIndex: number = 0;
  private stageEl!: HTMLElement;
  private layers: HTMLElement[] = [];
  private renderedIndices: Set<number> = new Set();
  private options: PlayerOptions;

  constructor(options: PlayerOptions) {
    this.options = options;
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) throw new Error(`[PPTistPlayer] Container not found: ${options.container}`);
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    this.data = options.data;
    this.slides = this.data.slides || [];
    this.stageWidth = this.data.width || 1536;
    this.stageHeight = this.data.height || 864;
    this.currentIndex = options.initialSlide || 0;

    this.initDOM();
    if (options.autoFit !== false) this.setupAutoFit();
    if (options.keyboard !== false) this.setupKeyboard();
    this.showSlide(this.currentIndex);
  }

  private initDOM() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';

    this.stageEl = document.createElement('div');
    this.stageEl.className = 'pptist-stage';
    this.stageEl.style.position = 'relative';
    this.stageEl.style.width = `${this.stageWidth}px`;
    this.stageEl.style.height = `${this.stageHeight}px`;
    this.stageEl.style.transformOrigin = 'center center';
    this.stageEl.style.flexShrink = '0';
    this.stageEl.style.overflow = 'hidden';
    this.stageEl.style.background = '#FFFFFF';
    this.stageEl.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.45)';

    this.container.appendChild(this.stageEl);

    // Create empty layer placeholders for each slide
    this.layers = [];
    for (let i = 0; i < this.slides.length; i++) {
      const layer = document.createElement('div');
      layer.className = 'pptist-slide-layer';
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.width = `${this.stageWidth}px`;
      layer.style.height = `${this.stageHeight}px`;
      layer.style.display = 'none';
      layer.style.background = '#FFFFFF';
      this.stageEl.appendChild(layer);
      this.layers.push(layer);
    }
  }

  public fitStage() {
    const parentW = this.container.clientWidth || window.innerWidth;
    const parentH = this.container.clientHeight || window.innerHeight;
    const scale = Math.min(parentW / this.stageWidth, parentH / this.stageHeight);
    this.stageEl.style.transform = `scale(${scale})`;
  }

  private setupAutoFit() {
    window.addEventListener('resize', () => this.fitStage());
    this.fitStage();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        this.next();
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goTo(this.slides.length - 1);
      } else if (['f', 'F', 'F5'].includes(e.key)) {
        e.preventDefault();
        this.toggleFullScreen();
      }
    });
  }

  private renderSlideContent(index: number) {
    if (this.renderedIndices.has(index)) return;
    const slide = this.slides[index];
    const layer = this.layers[index];
    if (!slide || !layer) return;

    layer.innerHTML = '';
    if (slide.background?.color) layer.style.background = slide.background.color;
    if (slide.background?.image) {
      const bgImg = document.createElement('div');
      bgImg.style.position = 'absolute';
      bgImg.style.inset = '0';
      bgImg.innerHTML = `<img src="${slide.background.image}" style="width:100%;height:100%;object-fit:cover;" />`;
      layer.appendChild(bgImg);
    }

    for (const el of slide.elements || []) {
      const dom = ElementRenderer.renderElement(el);
      if (dom) layer.appendChild(dom);
    }

    this.renderedIndices.add(index);
  }

  public showSlide(index: number) {
    if (index < 0 || index >= this.slides.length) return;
    this.currentIndex = index;

    this.layers.forEach((layer, idx) => {
      if (idx === index) {
        layer.style.display = 'block';
        this.renderSlideContent(idx);
      } else {
        layer.style.display = 'none';
      }
    });

    // Pre-render adjacent slide
    if (index + 1 < this.slides.length) {
      this.renderSlideContent(index + 1);
    }

    if (this.options.onSlideChange) {
      this.options.onSlideChange(this.currentIndex, this.slides.length);
    }
  }

  public next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.showSlide(this.currentIndex + 1);
    }
  }

  public prev() {
    if (this.currentIndex > 0) {
      this.showSlide(this.currentIndex - 1);
    }
  }

  public goTo(index: number) {
    this.showSlide(index);
  }

  public toggleFullScreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  public destroy() {
    this.container.innerHTML = '';
  }
}
