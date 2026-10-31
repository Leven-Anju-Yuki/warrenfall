/* Langues de l'interface : on traduit l'affichage, jamais les données de partie.
 * Les catalogues de langues restent séparés pour ne charger que le choix du joueur.
 * Les nœuds d'origine sont mémorisés pour revenir au français sans recharger le jeu.
 */
(() => {
  'use strict';
  const languages = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', ja: '日本語' };
  // Les traductions sont des ressources, pas du code : une seule langue est chargee.
  const dictionaries = new Map();
  const templates = new Map();
  const loading = new Map();
  const normalize = text => text.normalize('NFC').replace(/\s+/g, ' ').trim();
  const localeBase = new URL('../i18n/', document.currentScript?.src || new URL('./assets/js/game-languages.js', document.baseURI));
  async function loadLanguage(locale) {
    if (!Object.hasOwn(languages, locale)) throw new Error('Langue inconnue');
    if (locale === 'fr' || dictionaries.has(locale)) return;
    if (!loading.has(locale)) {
      loading.set(locale, (async () => {
        const response = await fetch(new URL(locale + '.json?v=translations-180', localeBase));
        if (!response.ok) throw new Error('Langue indisponible');
        const data = await response.json();
        if (data.version !== 1 || data.language !== locale || !data.strings || typeof data.strings !== 'object' || Array.isArray(data.strings)) throw new Error('Catalogue de langue invalide');
        if (Object.values(data.strings).some(value => typeof value !== 'string')) throw new Error('Traduction invalide');
        // Les phrases variables ont des paramètres explicites : aucun remplacement
        // global de mots ne risque de modifier le nom d'un lapin ou une valeur du jeu.
        const patterns = Object.entries(data.templates || {}).map(([source, target]) => {
          if (typeof target !== 'string') throw new Error('Traduction invalide');
          const parameters = [...source.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
          if ([...target.matchAll(/\{(\w+)\}/g)].some(match => !parameters.includes(match[1]))) throw new Error('Paramètre de traduction inconnu');
          const chunks = normalize(source).split(/\{\w+\}/g).map(chunk => chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const pattern = chunks.map((chunk, index) => chunk + (index < parameters.length ? (/^(?:n|count|level|step|steps)$/.test(parameters[index]) ? '(\\d+)' : '(.+?)') : '')).join('');
          return { pattern: new RegExp('^' + pattern + '$', 'iu'), parameters, target };
        });
        dictionaries.set(locale, new Map(Object.entries(data.strings)));
        templates.set(locale, patterns);
      })().finally(() => loading.delete(locale)));
    }
    await loading.get(locale);
  }
  const key = 'warrenfall.language';
  let language = 'fr';
  let preferredLanguage = 'fr';
  let requestNumber = 0;
  try { const stored = localStorage.getItem(key); if (Object.hasOwn(languages, stored)) preferredLanguage = stored; } catch (_) {}
  const records = new WeakMap();
  const attributeRecords = new WeakMap();
  const excluded = 'script,style,textarea,input,[contenteditable], [data-no-translate], [translate="no"],#languageControl,#brandTitle,.adoption-name,.rabbit-name,.bunny-name';
  function translate(text, locale = language, depth = 0) {
    if (locale === 'fr' || !Object.hasOwn(languages, locale)) return text;
    const dictionary = dictionaries.get(locale);
    if (!dictionary) return text;
    const trimmed = normalize(text);
    const direct = dictionary.get(trimmed.toLocaleLowerCase('fr'));
    if (direct) return text.replace(text.trim(), direct);
    // Les flèches et émojis restent en place autour du libellé traduit.
    const match = trimmed.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    const row = match && dictionary.get(match[2].toLocaleLowerCase('fr'));
    if (row) return text.replace(text.trim(), match[1] + row + match[3]);
    // Le décor (émoji, coche) reste autour du texte, les nombres restent exacts.
    const candidates = [{value:trimmed, prefix:'', suffix:''}];
    if (match) candidates.push(
      {value:match[2] + match[3], prefix:match[1], suffix:''},
      {value:match[2], prefix:match[1], suffix:match[3]},
    );
    for (const {value, prefix, suffix} of candidates) {
      for (const entry of templates.get(locale) || []) {
        const found = entry.pattern.exec(value);
        if (!found) continue;
        const rendered = entry.target.replace(/\{(\w+)\}/g, (_, parameter) => {
          const captured = found[entry.parameters.indexOf(parameter) + 1];
          return parameter === 'item' && depth < 2 ? translate(captured, locale, depth + 1) : captured;
        });
        return text.replace(text.trim(), () => prefix + rendered + suffix);
      }
    }
    if (depth < 2 && trimmed.includes(' · ')) return text.replace(text.trim(), trimmed.split(' · ').map(part => translate(part, locale, depth + 1)).join(' · '));
    return text;
  }
  // Mémoriser séparément la source et son rendu évite de traduire une traduction.
  // Si le jeu remplace le texte (nouveau score, dialogue…), il devient la nouvelle source.
  function updateText(node) {
    if (!node.parentElement || node.parentElement.closest(excluded)) return;
    // Sans value explicite, le texte d'une option est aussi sa valeur métier : le préserver.
    if (node.parentElement.closest('option:not([value])')) return;
    const value = node.nodeValue;
    const previous = records.get(node);
    const source = previous && value === previous.rendered ? previous.source : value;
    const rendered = translate(source);
    records.set(node, { source, rendered });
    if (value !== rendered) node.nodeValue = rendered;
  }
  function updateAttributes(element) {
    if (element.closest(excluded)) return;
    let record = attributeRecords.get(element);
    if (!record) { record = {}; attributeRecords.set(element, record); }
    for (const name of ['title', 'aria-label', 'placeholder']) {
      if (!element.hasAttribute(name)) continue;
      const value = element.getAttribute(name), previous = record[name];
      const source = previous && value === previous.rendered ? previous.source : value;
      const rendered = translate(source);
      record[name] = { source, rendered };
      if (value !== rendered) element.setAttribute(name, rendered);
    }
  }
  // Seuls les nœuds de texte et les aides d'interface sont modifiés.
  // Les balises HTML, événements, classes CSS et valeurs des formulaires restent intacts.
  function scan(root) {
    if (root.nodeType === 3) { updateText(root); return; }
    if (root.nodeType !== 1 || root.closest(excluded)) return;
    updateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) { return node.nodeType === 1 && node.matches(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === 3) updateText(walker.currentNode);
      else updateAttributes(walker.currentNode);
    }
  }
  // Suspendre l'observateur pendant nos écritures empêche une boucle de retraduction.
  let observer;
  function applyLanguage(locale) {
    language = locale;
    try { localStorage.setItem(key, locale); } catch (_) {}
    document.documentElement.lang = locale;
    if (observer) observer.disconnect();
    scan(document.body);
    const trigger = document.getElementById('gameLanguage');
    if (trigger) {
      trigger.setAttribute('aria-label', translate('Langue') + ' : ' + languages[locale]);
      trigger.title = translate('Langue') + ' : ' + languages[locale];
      trigger.querySelector('img').src = flagURL(locale);
      for (const choice of document.getElementById('languageChoices').querySelectorAll('button')) {
        choice.setAttribute('aria-pressed', String(choice.dataset.language === locale));
      }
    }
    observe();
    window.dispatchEvent(new CustomEvent('warrenfall:language', { detail: { language: locale } }));
  }
  function setLanguage(locale) {
    if (!Object.hasOwn(languages, locale)) return false;
    const request = ++requestNumber;
    // Un changement rapide ne doit pas laisser une ancienne réponse réseau gagner.
    return loadLanguage(locale).then(() => {
      if (request !== requestNumber) return false;
      applyLanguage(locale);
      return true;
    });
  }
  function observe() {
    observer?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
  }
  // Les drapeaux SVG restent visibles même sur les PC sans émojis de drapeau.
  function flagURL(locale) { return new URL('../icons/flags/' + locale + '.svg', localeBase).href; }
  function flag(locale) {
    const image = document.createElement('img');
    image.src = flagURL(locale); image.alt = ''; image.width = 28; image.height = 20;
    return image;
  }
  function init() {
    const control = document.createElement('div');
    control.id = 'languageControl'; control.setAttribute('translate', 'no');
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.id = 'gameLanguage';
    trigger.setAttribute('aria-label', 'Langue : ' + languages.fr);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'languageChoices');
    trigger.append(flag('fr'));
    const choices = document.createElement('div');
    choices.id = 'languageChoices'; choices.hidden = true;
    choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Languages');
    for (const [value, name] of Object.entries(languages)) {
      const option = document.createElement('button');
      option.type = 'button'; option.dataset.language = value;
      option.lang = value; option.setAttribute('aria-pressed', String(value === language));
      const label = document.createElement('span'); label.textContent = name;
      option.append(flag(value), label);
      option.addEventListener('click', () => choose(value));
      choices.append(option);
    }
    control.append(trigger, choices); document.body.append(control);
    const status = document.createElement('span');
    status.id = 'languageStatus'; status.setAttribute('role', 'status');
    control.append(status);
    function close(returnFocus = false) {
      choices.hidden = true; trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    }
    trigger.addEventListener('click', () => {
      choices.hidden = !choices.hidden;
      trigger.setAttribute('aria-expanded', String(!choices.hidden));
    });
    document.addEventListener('click', event => { if (!control.contains(event.target)) close(); });
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') { close(true); event.preventDefault(); }
    });
    function choose(locale) {
      trigger.setAttribute('aria-busy', 'true'); status.textContent = '';
      return setLanguage(locale).then(applied => {
        if (applied) close(choices.contains(document.activeElement));
      }).catch(() => {
        status.textContent = 'Langue indisponible : r\u00e9essaie avec une connexion.';
      }).finally(() => trigger.removeAttribute('aria-busy'));
    }
    observer = new MutationObserver(mutations => {
      observer.disconnect();
      const roots = new Set();
      for (const mutation of mutations) {
        if (mutation.type === 'childList') mutation.addedNodes.forEach(node => roots.add(node));
        else roots.add(mutation.target);
      }
      roots.forEach(scan); observe();
    });
    choose(preferredLanguage);
  }
  window.WarrenfallI18n = Object.freeze({ translate, setLanguage, loadLanguage, languages: Object.freeze(languages), get language() { return language; } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
