import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = new Map();
const fetched = [];
const context = {
  URL,
  CustomEvent: class { constructor(type, options) { this.type=type; this.detail=options.detail; } },
  window: { dispatchEvent() {} },
  document: { readyState: 'loading', baseURI: 'https://example.test/game/index.html', body: {nodeType:0}, documentElement: {}, querySelector() {return null;}, getElementById() {return null;}, addEventListener() {} },
  localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
  fetch: async url => {
    fetched.push(String(url));
    const language = String(url).match(/\/(en|es|de|ja)\.json/)[1];
    return {ok:true,json:async()=>JSON.parse(fs.readFileSync(`assets/i18n/${language}.json`,'utf8'))};
  },
};
vm.runInNewContext(fs.readFileSync('assets/js/game-languages.js', 'utf8'), context);
const i18n = context.window.WarrenfallI18n;
assert.equal(fetched.length,0,'Opening the module must not load all languages');
assert.deepEqual(Object.keys(i18n.languages), ['fr', 'en', 'es', 'de', 'ja']);
for (const [locale, expected] of [['en', 'Garden'], ['es', 'Jardín'], ['de', 'Garten'], ['ja', '庭']]) {
  await i18n.loadLanguage(locale);
  assert.equal(i18n.translate('Jardin', locale), expected);
}
assert.equal(fetched.length,4);
await i18n.loadLanguage('en');
assert.equal(fetched.length,4,'A loaded language must be reused');
assert.equal(i18n.translate('← Mini-jeux', 'en'), '← Mini-games');
assert.equal(i18n.translate('  🥕 Cuisine  ', 'ja'), '  🥕 キッチン  ');
assert.equal(i18n.translate('PLATS PRÊTS', 'en'), 'Ready meals');
assert.equal(i18n.translate('Azur', 'en'), 'Azur');
assert.equal(i18n.translate('Texte encore non traduit', 'de'), 'Texte encore non traduit');
assert.equal(i18n.translate('Salon', 'unknown'), 'Salon');
// Couverture à partir des vrais objectifs et produits, pas d'une liste de
// traductions recopiée dans le test. Aucun état de joueur n'est chargé.
const achievementsContext = {};
vm.runInNewContext(fs.readFileSync('assets/js/achievements.js', 'utf8'), achievementsContext);
const achievements = achievementsContext.LapinousAchievements;
const game = {
  ownedSpecies: Array.from({length:30}, (_, index) => 'rabbit-' + index),
  progress: { rabbit: {currentLevel:100} }, carrots:0,
  records: {bossesDefeated:100, gamesWon:100, eggsOpened:100, memoryCompleted:100, puzzleCompleted:100, quizCompleted:100},
};
const phrases = new Set();
for (const row of achievements.list(game).today) { phrases.add(row.title); phrases.add(row.text); }
for (let step=0; step<5; step++) {
  for (const row of achievements.list(game).permanent) {
    phrases.add(row.title); if(row.text) phrases.add(row.text);
    achievements.claim(game,row.id);
  }
}
const shop=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8'));
for(const item of shop.items) { phrases.add(item.name); phrases.add(item.description); }
for(const locale of ['en','es','de','ja']) {
  for(const phrase of phrases) assert.notEqual(i18n.translate(phrase,locale),phrase,`${locale}: missing ${phrase}`);
  const reward=i18n.translate('🎁 Récupérer 137 🥕',locale);
  assert.notEqual(reward,'🎁 Récupérer 137 🥕');
  assert.ok(reward.includes('137') && reward.includes('🥕') && reward.startsWith('🎁'));
  const status=i18n.translate('En cours · Palier 2/4',locale);
  assert.ok(!status.includes('Palier') && status.includes('2/4'));
  assert.ok(i18n.translate('Bonjour, Azur $& !',locale).includes('Azur $&'));
  const data=JSON.parse(fs.readFileSync(`assets/i18n/${locale}.json`,'utf8'));
  for(const [source,target] of Object.entries(data.templates)) {
    const parameters=value=>[...value.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
    assert.deepEqual(parameters(target),parameters(source),`${locale}: lost parameter in ${source}`);
  }
}
assert.equal(i18n.translate('🧑‍🍳 Je vais chercher Menthe fraîche?', 'en'),'🧑‍🍳 I’ll fetch Fresh mint…');
assert.equal(i18n.translate('Bonjour, Azur !', 'fr'),'Bonjour, Azur !');
assert.equal(i18n.translate('Tes lapins (2/13) :','en'),'Your rabbits (2/13):');
assert.equal(i18n.translate('Azur · actif','ja'),'Azur · 選択中');
assert.equal(i18n.translate('🧑‍🍳 Je vais chercher Menthe fraîche?','fr'),'🧑‍🍳 Je vais chercher Menthe fraîche?');
assert.equal(i18n.setLanguage('unknown'), false);
assert.equal(storage.size, 0, 'Translation must not write game saves');
await i18n.setLanguage('ja');
assert.equal(storage.get('warrenfall.language'),'ja');
assert.equal(context.document.documentElement.lang,'ja');
await i18n.setLanguage('fr');
assert.equal(i18n.translate('Jardin'),'Jardin');
assert.deepEqual([...storage.keys()],['warrenfall.language']);
const first=i18n.setLanguage('en'), second=i18n.setLanguage('de');
assert.equal(await first,false);assert.equal(await second,true);
assert.equal(i18n.language,'de');
await assert.rejects(()=>i18n.loadLanguage('missing'));
assert.equal(i18n.language,'de');
console.log('Lazy language resources, cache, race, fallback and save isolation: OK');
