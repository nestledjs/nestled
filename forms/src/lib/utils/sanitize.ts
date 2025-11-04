import DOMPurify from 'dompurify';

let purify: typeof DOMPurify;

if (typeof window === 'undefined') {
  // SSR: use jsdom
   
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  purify = DOMPurify(window);
} else {
  // Browser: use the global window
  purify = DOMPurify;
}

export function stripHtml(html: string): string {
  return purify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
} 