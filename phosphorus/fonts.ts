/// <reference path="phosphorus.ts" />

interface FontFaceObserver {
  new(font: string): FontFaceObserver;
  load(text?: string, timeout?: number): Promise<void>;
}
declare var FontFaceObserver: FontFaceObserver;

/**
 * Font helpers
 */
namespace P.fonts {
  const fontFamilyCache: ObjectMap<string> = {};

  export const scratch3 = {
    'Marker': '/fonts/Knewave-Regular.woff',
    'Handwriting': '/fonts/Handlee-Regular.woff',
    'Pixel': '/fonts/Grand9K-Pixel.ttf',
    'Curly': '/fonts/Griffy-Regular.woff',
    'Serif': '/fonts/SourceSerifPro-Regular.woff',
    'Sans Serif': '/fonts/NotoSans-Regular.woff',
    'Scratch': '/fonts/Scratch.ttf',
  };

  /**
   * Asynchronously load and cache a font
   */
  function loadLocalFont(fontFamily: string, src: string): Promise<string> {
    if (fontFamilyCache[fontFamily]) {
      return Promise.resolve(fontFamilyCache[fontFamily]);
    }
    return new P.IO.BlobRequest(src, {local: true}).load()
      .then((blob) => P.IO.readers.toDataURL(blob))
      .then((url) => {
        fontFamilyCache[fontFamily] = url;
        return url;
      });
  }

  /**
   * Gets an already loaded and cached font
   */
  function getFont(fontFamily: string): string | null {
    if (!(fontFamily in fontFamilyCache)) {
      return null;
    }
    return fontFamilyCache[fontFamily];
  }

  export function loadFontSet(fonts: ObjectMap<string>): Promise<unknown> {
    const promises: Promise<unknown>[] = [];
    for (const family in fonts) {
      promises.push(P.utils.settled(loadLocalFont(family, fonts[family])));
    }
    return Promise.all(promises);
  }

  function getCSSFontFace(src: string, fontFamily: string) {
    return `@font-face { font-family: "${fontFamily}"; src: url("${src}"); }`;
  }

  /**
   * Add an inline <style> element to an SVG containing fonts loaded through loadFontSet
   */
  export function addFontRules(svg: SVGElement, fonts: string[]) {
    const cssRules: string[] = [];
    for (const fontName of fonts) {
      const font = getFont(fontName);
      if (!font) {
        continue;
      }
      cssRules.push(getCSSFontFace(font, font));
    }

    const doc = svg.ownerDocument!;
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.innerHTML = cssRules.join('\n');
    defs.appendChild(style);
    svg.appendChild(style);
  }

  /**
   * Load a CSS @font-face font.
   */
  export function loadWebFont(name: string): Promise<void> {
    const observer = new FontFaceObserver(name);
    return observer.load();
  }
}
