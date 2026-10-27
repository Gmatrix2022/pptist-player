import { PPTistElement, ShapeElement, TextElement, ImageElement, LineElement } from './types';

export class ElementRenderer {
  /**
   * Render an individual AST element to an absolute-positioned DOM node
   */
  public static renderElement(el: PPTistElement): HTMLElement | SVGElement | null {
    const t = el.type;
    const left = el.left || 0;
    const top = el.top || 0;
    const w = el.width || 0;
    const h = el.height || 0;
    const rot = el.rotate || 0;
    const op = el.opacity !== undefined ? el.opacity : 1;

    // Common style applier
    const applyCommonStyles = (dom: HTMLElement) => {
      dom.className = `ast-el ast-${t}`;
      dom.style.position = 'absolute';
      dom.style.boxSizing = 'border-box';
      dom.style.left = `${left}px`;
      dom.style.top = `${top}px`;
      dom.style.width = `${w}px`;
      dom.style.height = `${h}px`;
      dom.style.opacity = String(op);
      if (rot) dom.style.transform = `rotate(${rot}deg)`;
    };

    if (t === 'shape') {
      const shp = el as ShapeElement;
      const div = document.createElement('div');
      applyCommonStyles(div);
      div.style.pointerEvents = 'none';

      const vb = shp.viewBox || [w, h];
      let strokeAttr = '';
      const outline = shp.outline || shp.border;
      if (outline) {
        const sColor = outline.color || '#CBD5E1';
        const sWidth = outline.width || 1;
        const sDash = outline.style === 'dashed' ? 'stroke-dasharray="6 4"' : '';
        strokeAttr = `stroke="${sColor}" stroke-width="${sWidth}" ${sDash}`;
      }

      const path = shp.path || '';
      div.innerHTML = `
        <svg viewBox="0 0 ${vb[0]} ${vb[1]}" preserveAspectRatio="none" style="width:100%;height:100%;display:block;overflow:visible;">
          <path d="${path}" fill="${shp.fill || 'none'}" ${strokeAttr} />
        </svg>
      `;
      return div;
    }

    if (t === 'text') {
      const txt = el as TextElement;
      const div = document.createElement('div');
      applyCommonStyles(div);
      div.style.wordBreak = 'break-word';
      div.style.pointerEvents = 'auto';
      div.innerHTML = txt.content || '';
      return div;
    }

    if (t === 'image') {
      const img = el as ImageElement;
      const div = document.createElement('div');
      applyCommonStyles(div);
      div.style.pointerEvents = 'none';
      const fit = img.fixedRatio ? 'contain' : 'fill';
      div.innerHTML = `<img src="${img.src}" style="width:100%;height:100%;object-fit:${fit};display:block;" />`;
      return div;
    }

    if (t === 'line') {
      const line = el as LineElement;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ast-el ast-line');
      svg.style.position = 'absolute';
      svg.style.left = `${left}px`;
      svg.style.top = `${top}px`;
      svg.style.width = '1px';
      svg.style.height = '1px';
      svg.style.overflow = 'visible';
      svg.style.pointerEvents = 'none';
      if (rot) svg.style.transform = `rotate(${rot}deg)`;

      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('x1', String(line.start ? line.start[0] : 0));
      lineEl.setAttribute('y1', String(line.start ? line.start[1] : 0));
      lineEl.setAttribute('x2', String(line.end ? line.end[0] : w));
      lineEl.setAttribute('y2', String(line.end ? line.end[1] : 0));
      lineEl.setAttribute('stroke', line.color || '#CBD5E1');
      lineEl.setAttribute('stroke-width', String(line.width || 1));
      if (line.style === 'dashed') lineEl.setAttribute('stroke-dasharray', '6 4');

      svg.appendChild(lineEl);
      return svg;
    }

    return null;
  }
}
