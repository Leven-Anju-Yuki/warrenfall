/* Résolution des images uniquement ; les catalogues gardent leurs chemins locaux éditables. */
(() => {
  'use strict';
  const map = window.LapinousImageManifest || {};
  const remoteOnly = new Set(window.LapinousRemoteOnlyImages || []);
  const backups = new Set(window.LapinousBackupImages || []);
  const localDevelopment = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  const reverse = new Map(Object.entries(map).map(([local, remote]) => [remote, local]));
  const failed = new Set();
  const sprites = new Map();
  const checkedBackgrounds = new Set();
  const observed = new WeakSet();
  const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const nativeHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  const nativeSetAttribute = Element.prototype.setAttribute;
  const nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;

  /** Retrouve la clé locale sans toucher aux chemins audio, aux données ni aux URL externes. */
  function key(value) {
    if (typeof value !== 'string') return null;
    if (reverse.has(value)) return reverse.get(value);
    try {
      const url = new URL(value, document.baseURI);
      if (url.origin !== location.origin) return null;
      const pathname = decodeURIComponent(url.pathname);
      const i = pathname.indexOf('/assets/img/');
      return i < 0 ? null : pathname.slice(i + 1);
    } catch { return null; }
  }
  /** Fournit l’URL originale Cloudinary ou conserve le fichier local en cas d’échec. */
  function url(value) {
    const local = key(value);
    if(local && sprites.has(local))return sprites.get(local);
    return local && map[local] && !failed.has(local) ? map[local] : local && failed.has(local) ? localSource(local) || value : value;
  }
  /** Les sauvegardes ignorées par Git sont utilisables seulement sur le poste local. */
  function localSource(local) {
    if (backups.has(local) && localDevelopment) return new URL('./secours-images/' + local, document.baseURI).href;
    return remoteOnly.has(local) ? null : new URL('./' + local, document.baseURI).href;
  }
  /** Résout les URL de fond sans modifier les tailles, positions ni découpes de puzzle. */
  function css(value) {
    return String(value).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_, quote, source) => {
      const resolved = url(source);
      if (reverse.has(resolved) && !checkedBackgrounds.has(resolved)) {
        checkedBackgrounds.add(resolved);
        queueMicrotask(() => {
          const probe = new Image(); probe.onerror = () => fallback(resolved);
          nativeSrc.set.call(probe, resolved);
        });
      }
      return `url("${resolved}")`;
    });
  }
  /** Résout les images générées par les templates avant leur insertion et leur chargement. */
  function markup(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(['"])(.*?)\2/gi, (_, prefix, quote, source) => prefix + quote + url(source) + quote)
      .replace(/(\bstyle\s*=\s*)(['"])(.*?)\2/gi, (_, prefix, quote, style) => prefix + quote + css(style).replaceAll(quote, quote === '"' ? '&quot;' : '&#39;') + quote);
  }
  /** Applique les mêmes règles aux préchargements et aux poses changées par JavaScript. */
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...nativeSrc, set(value) {
      if (!observed.has(this)) {
        observed.add(this);
        this.addEventListener('error', event => {
          const remote = this.getAttribute('src'), local = reverse.get(remote);
          if (local && fallback(remote)) {
            nativeSrc.set.call(this, localSource(local));
            event.stopImmediatePropagation();
          }
        }, true);
      }
      nativeSrc.set.call(this, url(value));
    },
  });
  Object.defineProperty(Element.prototype, 'innerHTML', {
    ...nativeHTML, set(value) { nativeHTML.set.call(this, markup(value)); },
  });
  Element.prototype.setAttribute = function (name, value) {
    return nativeSetAttribute.call(this, name, this instanceof HTMLImageElement && name.toLowerCase() === 'src' ? url(value) : name.toLowerCase() === 'style' ? css(value) : value);
  };
  CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
    return nativeSetProperty.call(this, name, /^(background|background-image)$/.test(name) ? css(value) : value, priority);
  };
  const background = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'backgroundImage');
  if (background?.set && background.configurable) Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundImage', {
    ...background, set(value) { background.set.call(this, css(value)); },
  });

  /** Parcourt uniquement les règles locales accessibles, sans lire de feuilles externes. */
  function rules(callback) {
    function visit(list) { for (const rule of list) { if (rule.style) callback(rule.style); if (rule.cssRules) visit(rule.cssRules); } }
    for (const sheet of document.styleSheets) { try { visit(sheet.cssRules); } catch {} }
  }
  /** Désactive une URL distante défaillante et rétablit toutes ses occurrences locales. */
  function fallback(remote) {
    const local = reverse.get(remote); if (!local || failed.has(local)) return false;
    // Les originaux supprimés à la demande de l’utilisateur ne sont pas essayés en secours.
    if (!localSource(local)) return false;
    failed.add(local);
    const localURL = localSource(local);
    for (const img of document.images) if (img.getAttribute('src') === remote) nativeSrc.set.call(img, localURL);
    const replace = style => {
      if (style.backgroundImage?.includes(remote)) nativeSetProperty.call(style, 'background-image', style.backgroundImage.replaceAll(remote, localURL), style.getPropertyPriority('background-image'));
    };
    document.querySelectorAll('[style]').forEach(el => replace(el.style)); rules(replace);
    return true;
  }
  /** Le repli local est essayé avant les gestionnaires de remplacement propres au jeu. */
  window.addEventListener('error', event => {
    const img = event.target;
    if (img instanceof HTMLImageElement && fallback(img.getAttribute('src'))) {
      event.stopImmediatePropagation();
    }
  }, true);
  /** Met à jour les images statiques et vérifie les fonds au premier usage seulement. */
  function initialize() {
    for (const img of document.images) { const source = img.getAttribute('src'); if (source) img.src = source; }
    rules(style => {
      if (!style.backgroundImage) return;
      const resolved = css(style.backgroundImage); nativeSetProperty.call(style, 'background-image', resolved, style.getPropertyPriority('background-image'));
    });
  }
  /** Découpe d'affichage en mémoire : aucun original ni catalogue sauvegardé n'est réécrit. */
  async function registerSheet(source,entries){
    const image=new Image();image.crossOrigin='anonymous';
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url(source);});
    const prepared=[];
    for(const [local,box] of entries){
      const [x,y,w,h]=box.map((n,i)=>Math.round(n*(i%2===0?image.naturalWidth:image.naturalHeight)));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);
      prepared.push([local,canvas.toDataURL('image/png')]);
    }
    for(const [local,data] of prepared)sprites.set(local,data);
    for(const img of document.images){const local=key(img.getAttribute('src'));if(sprites.has(local))nativeSrc.set.call(img,sprites.get(local));}
    return prepared.length;
  }
  window.LapinousImages = Object.freeze({ url, registerSheet, local: value => key(value) ? './' + key(value) : value, css });
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
