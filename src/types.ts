/**
 * PPTist AST Type Definitions
 * Compatible with pipipi-gang/PPTist schema
 */

export interface ElementOutline {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface BaseElement {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
  opacity?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  path?: string;
  viewBox?: [number, number];
  fill?: string;
  outline?: ElementOutline;
  border?: ElementOutline;
  fixedRatio?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  defaultFontName?: string;
  defaultColor?: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  fixedRatio?: boolean;
  clip?: any;
}

export interface LineElement extends BaseElement {
  type: 'line';
  start: [number, number];
  end: [number, number];
  color?: string;
  style?: 'solid' | 'dashed';
}

export type PPTistElement = ShapeElement | TextElement | ImageElement | LineElement | (BaseElement & Record<string, any>);

export interface SlideBackground {
  type?: 'solid' | 'image' | 'gradient';
  color?: string;
  image?: string;
}

export interface PPTistSlide {
  id?: string;
  title?: string;
  background?: SlideBackground;
  elements: PPTistElement[];
  [key: string]: any;
}

export interface PPTistDeck {
  width?: number;
  height?: number;
  viewportRatio?: number;
  title?: string;
  slides: PPTistSlide[];
  [key: string]: any;
}

export interface PlayerOptions {
  container: HTMLElement | string;
  data: PPTistDeck;
  initialSlide?: number;
  autoFit?: boolean;
  keyboard?: boolean;
  showControls?: boolean;
  onSlideChange?: (index: number, total: number) => void;
}
