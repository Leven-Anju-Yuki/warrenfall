import { preflight, remoteFetch, networkError } from './remote-network.mjs';
import { readImageMap, writeImageMap } from './image-manifest-store.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = process.cwd(), stateDir = path.join(root, '.cloudinary-local');
const mode = process.argv[2] || 'dry-run';
const imageRE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const stamp = () => new Date().toISOString();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

/** Liste les fichiers sans suivre les liens symboliques ni lire les images. */
async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else if (entry.isFile()) result.push(path.relative(root, file).replaceAll('\\', '/'));
  }
  return result;
}
/** Écrit atomiquement et sauvegarde la version précédente avant remplacement. */
async function save(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    const backup = path.join(stateDir, 'backups', path.relative(root, file));
    await fs.mkdir(path.dirname(backup), { recursive: true });
    await fs.copyFile(file, backup + '.' + Date.now());
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await fs.writeFile(file + '.tmp', JSON.stringify(value, null, 2) + '\n');
  await fs.rename(file + '.tmp', file);
}
/** Lit les secrets uniquement côté Node, sans les exposer dans les sorties. */
async function credentials() {
  const text = await fs.readFile(path.join(root, '.env'), 'utf8');
  const env = Object.fromEntries(text.split(/\r?\n/).filter(x => /^CLOUDINARY_\w+=/.test(x)).map(x => {
    const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
  if (env.CLOUDINARY_CLOUD_NAME !== 'dgrszi9wf' || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
    throw new Error('Renseigner CLOUDINARY_CLOUD_NAME=dgrszi9wf, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env.');
  return env;
}
/** Normalise un chemin local, y compris les anciennes arborescences prises en charge. */
function canonical(value, source = 'index.html') {
  try { value = decodeURIComponent(value); } catch {}
  value = value.split(/[?#]/)[0].replaceAll('\\', '/');
  if (!value.includes('assets/img/') && !value.startsWith('../img/')) return null;
  value = value.includes('assets/img/') ? value.slice(value.indexOf('assets/img/')) : path.posix.normalize(path.posix.join(path.posix.dirname(source), value));
  return value.replace('assets/img/species/', 'assets/img/lapins_jouables/sans_evenements/')
    .replace('assets/img/lapins_jouables/sans_evenements/species/', 'assets/img/lapins_jouables/sans_evenements/')
    .replace('assets/img/lapin_evenement/', 'assets/img/lapins_jouables/lapin_evenement/');
}
/** Inventorie les références statiques et exécute uniquement les règles de chemins des décors. */
async function inventory() {
  const files = (await walk(path.join(root, 'assets/img'))).filter(x => imageRE.test(x));
  let publicMap = {}, privateManifest = { assets: {} };
  try { publicMap = readImageMap(); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  try { privateManifest = JSON.parse(await fs.readFile(path.join(stateDir, 'manifest.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  // Les chemins déjà publiés restent reconnus lorsque leurs originaux ont été retirés.
  const allPaths = [...new Set([...files, ...Object.keys(publicMap), ...Object.keys(privateManifest.assets || {})])];
  const physicalFiles = new Set(files);
  const existing = new Map(allPaths.map(x => [x.toLowerCase(), x]));
  const reasons = new Map(), missing = new Map();
  const add = (value, source, reason) => {
    const normalized = canonical(value, source); if (!normalized || /\$\{|[<>]/.test(normalized)) return;
    const actual = existing.get(normalized.toLowerCase());
    if (actual && !actual.includes('futur création')) {
      if (!reasons.has(actual)) reasons.set(actual, new Set()); reasons.get(actual).add(reason);
    } else if (!actual) { if (!missing.has(normalized)) missing.set(normalized, new Set()); missing.get(normalized).add(source); }
  };
  const sources = ['index.html', 'dashboard.html', 'lapinous-content.json', 'lapinous-puzzles.json', 'lapinous-shop.json',
    ...(await walk(path.join(root, 'assets/js'))).filter(x => !/bootstrap|jquery|image-manifest/.test(x)),
    ...(await walk(path.join(root, 'assets/css'))).filter(x => !/bootstrap/.test(x))];
  let gameCode = '';
  for (const source of sources) {
    const text = await fs.readFile(path.join(root, source), 'utf8');
    if (source === 'assets/js/script.js') gameCode = text;
    for (const match of text.matchAll(/(?:\.\/|\.\.\/)?(?:assets\/img\/|img\/)[^"'`\n\r<>]*?\.(?:png|jpe?g|gif|webp|svg|avif)/gi))
      add(match[0], source, 'Référence : ' + source);
  }
  // Ces six raretés sont la liste exacte utilisée par EGG_IMAGES.
  for (const rarity of ['commun', 'rare', 'epique', 'legendaire', 'mythique', 'divin'])
    add(`assets/img/oeuf/${rarity}.png`, 'assets/js/script.js', 'Chemin dynamique EGG_IMAGES');
  const start = gameCode.indexOf('const BACKGROUND_FILES =');
  const end = gameCode.indexOf('function backgroundPath(', start);
  if (start < 0 || end < 0) throw new Error('Règles de décors introuvables : inventaire interrompu.');
  const context = vm.createContext({ adminTesting: false, adminTime: 'auto', adminSeason: 'auto' });
  vm.runInContext(gameCode.slice(start, end) + '\nthis.candidates=backgroundCandidates; this.zones=Object.keys(BACKGROUND_FILES);', context, { timeout: 10000 });
  for (const zone of context.zones) for (const hour of [0, 12]) for (const season of ['printemps', 'ete', 'automne', 'hiver'])
    for (const candidate of context.candidates(zone, ['halloween', 'noel', 'paques', 'nouvel_an_chinois'], hour, season)) {
      const normal = canonical(candidate);
      if (existing.has(normal?.toLowerCase())) add(candidate, 'assets/js/script.js', 'Décor dynamique : événements/saisons/jour/nuit');
    }
  const selected = [], excluded = [];
  for (const file of allPaths) {
    if (!physicalFiles.has(file)) {
      if (reasons.has(file)) {
        const record = privateManifest.assets[file];
        selected.push({ path: file, bytes: record?.bytes || 0, hash: record?.hash || null,
          public_id: record?.public_id || null, url: publicMap[file] || record?.url, sourceExists: false,
          reasons: [...reasons.get(file)] });
      }
      continue;
    }
    const bytes = (await fs.stat(path.join(root, file))).size;
    if (reasons.has(file)) {
      const hash = sha(await fs.readFile(path.join(root, file)));
      const ext = path.posix.extname(file), base = file.slice('assets/img/'.length, -ext.length);
      selected.push({ path: file, bytes, hash, public_id: 'lapinous/' + base + '__' + ext.slice(1) + '_' + hash.slice(0, 16), sourceExists: true, reasons: [...reasons.get(file)] });
    } else excluded.push({ path: file, bytes, reason: file.includes('futur création') ? 'Création future' : 'Aucune référence active ou dynamique identifiée' });
  }
  const result = { date: stamp(), selected, excluded, missing: [...missing].map(([file, refs]) => ({ path: file, sources: [...refs] })), totalBytes: selected.reduce((n, x) => n + x.bytes, 0) };
  await save(path.join(stateDir, 'inventory.json'), result); return result;
}
/** Appelle l’API avec authentification en en-tête et erreurs sans données sensibles. */
async function api(env, route, options = {}) {
  await preflight("api.cloudinary.com");
  const response = await remoteFetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${route}`, {
    ...options, signal: AbortSignal.timeout(120000), headers: { Authorization: 'Basic ' + Buffer.from(env.CLOUDINARY_API_KEY + ':' + env.CLOUDINARY_API_SECRET).toString('base64') },
  });
  const data = await response.json();
  if (!response.ok) {
    let detail=String(data.error?.message||'requête refusée');
    for(const value of [env.CLOUDINARY_API_KEY,env.CLOUDINARY_API_SECRET]) if(value) detail=detail.split(value).join('[secret masqué]');
    detail=detail.replace(/https?:\/\/\S+/g,'[URL masquée]').slice(0,500);
    const error=new Error(`Cloudinary HTTP ${response.status} : ${detail}`);
    error.status=response.status;
    throw error;
  }
  return data;
}
/** Contrôle le quota avant tout transfert ; seuls les comptes gratuits documentés sont autorisés. */
async function quota(env, bytes) {
  const usage = await api(env, 'usage');
  const report = { date: stamp(), plan: usage.plan, credits: usage.credits, storage: usage.storage, resources: usage.resources };
  await save(path.join(stateDir, 'quota.json'), report);
  const remaining = Number(usage.credits?.limit) - Number(usage.credits?.usage);
  // Une marge de 20 % couvre l’arrondi et les statistiques différées. Aucune transformation n’est créée.
  if (!/free/i.test(String(usage.plan)) || !Number.isFinite(remaining) || remaining < bytes / 1e9 * 1.2 + 1)
    throw new Error('Quota gratuit insuffisant ou non vérifiable : transfert suspendu, aucun achat automatique.');
  return report;
}
/** Vérifie une URL sans télécharger systématiquement son contenu. */
async function verify(url) {
  if (!url?.startsWith('https://res.cloudinary.com/dgrszi9wf/')) return false;
  const r = await remoteFetch(url, { method: 'HEAD', signal: AbortSignal.timeout(30000) }); return r.ok;
}
/** Transfère sans transformation ni écrasement ; reprend uniquement les versions manquantes. */
async function sync(inv, env, pilot) {
  const manifestFile = path.join(stateDir, 'manifest.json');
  let manifest = { assets: {} }; try { manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const chosen = pilot ? ['png', 'gif', 'svg'].map(ext => inv.selected.find(x => x.path.endsWith('.' + ext))).filter(Boolean) : inv.selected;
  if (!pilot && ['png', 'gif', 'svg'].some(ext => !Object.values(manifest.assets).some(x => x.path.endsWith('.' + ext) && x.status === 'verified')))
    throw new Error('Exécuter le pilote PNG/GIF/SVG avant le transfert complet.');
  await quota(env, chosen.filter(x => x.sourceExists !== false).reduce((n, x) => n + x.bytes, 0));
  let transferred = 0, reused = 0;
  const failedPaths = [];
  // Séquentiel : concurrence bornée à 1, manifestes cohérents et consommation prévisible.
  for (const entry of chosen) {
    const old = manifest.assets[entry.path];
    if (entry.sourceExists === false) {
      if (!await verify(entry.url)) throw new Error('Image distante indisponible, original absent : ' + entry.path);
      manifest.assets[entry.path] = { ...old, ...entry, status: 'verified', date: stamp() };
      reused++; continue;
    }
    if (old?.hash === entry.hash && old.status === 'verified' && await verify(old.url)) { reused++; continue; }
    let failure;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Limite image constatée pour ce compte : refus local, sans réduire l’original.
        if (entry.bytes > 10485760) {
          const error=new Error(`Image trop volumineuse : ${entry.bytes} octets, limite constatée 10485760. Original conservé ; préparer une version sans perte ou revoir le forfait.`);
          error.status=413;throw error;
        }
        const form = new FormData();
        form.append('file', new Blob([await fs.readFile(path.join(root, entry.path))]), path.posix.basename(entry.path));
        form.append('public_id', entry.public_id); form.append('overwrite', 'false');
        form.append('context', 'sha256=' + entry.hash);
        const data = await api(env, 'image/upload', { method: 'POST', body: form });
        if (data.existing) {
          const resource = await api(env, 'resources/image/upload/' + encodeURIComponent(entry.public_id) + '?context=true');
          if (resource.context?.custom?.sha256 !== entry.hash) throw new Error('Identifiant distant déjà occupé : vérification manuelle requise.');
        }
        if (!await verify(data.secure_url)) throw new Error('URL HTTPS non vérifiée.');
        manifest.assets[entry.path] = { ...entry, url: data.secure_url, status: 'verified', date: stamp() }; failure = null; break;
      } catch (e) { failure = e.message; if(e.status>=400 && e.status<500 && e.status!==429) break; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); }
    }
    if (failure) manifest.assets[entry.path] = { ...entry, status: 'failed', date: stamp(), error: failure };
    await save(manifestFile, manifest);
    transferred++;
    console.log(`${manifest.assets[entry.path].status}: ${entry.path}`);
    if (failure) failedPaths.push(entry.path);
  }
  if (failedPaths.length) throw new Error('Images refusées : '+failedPaths.join(', ')+' ; autres transferts conservés, activation et quarantaine suspendues.');
  // Enregistre chaque version vérifiée, y compris la version qui vient d'être transférée.
  // Ne supprime jamais l'historique : il sert à détecter les remplacements futurs.
  const ledgerFile = path.join(stateDir, 'versions-connues.json');
  let ledger = { assets: {} };
  try { ledger = JSON.parse(await fs.readFile(ledgerFile, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!ledger || typeof ledger.assets !== 'object' || Array.isArray(ledger.assets)) throw new Error('Historique des versions invalide.');
  for (const [local, record] of Object.entries(manifest.assets)) {
    if (record?.status === 'verified' && record.public_id?.startsWith('lapinous/') && record.hash && record.url) {
      ledger.assets[record.public_id] = { path: local, hash: record.hash, url: record.url, public_id: record.public_id, date: record.date };
    }
  }
  await save(ledgerFile, ledger);
  const publicMap = Object.fromEntries(inv.selected.filter(x => manifest.assets[x.path]?.hash === x.hash && manifest.assets[x.path]?.status === 'verified').map(x => [x.path, manifest.assets[x.path].url]));
  await save(manifestFile, manifest);
  writeImageMap(publicMap);
  await save(path.join(stateDir, 'last-run.json'), { date: stamp(), transferred, reused, failures: 0, selected: inv.selected.length, excluded: inv.excluded.length, bytes: inv.totalBytes });
  console.log(JSON.stringify({ transferred, reused, failures: 0 }));
  console.log(`URLs publiques vérifiées : ${Object.keys(publicMap).length}. Intégration navigateur requise avant activation.`);
}
/** Exécute un mode explicite ; le mode par défaut ne contacte jamais Cloudinary. */
async function main() {
  if (!['dry-run', 'quota', 'pilot', 'sync'].includes(mode)) throw new Error('Modes : dry-run, quota, pilot, sync.');
  if (mode === 'quota') { const q = await quota(await credentials(), 0); console.log(JSON.stringify(q, null, 2)); return; }
  const inv = await inventory();
  console.log(JSON.stringify({ selected: inv.selected.length, excluded: inv.excluded.length, missing: inv.missing.length, bytes: inv.totalBytes }));
  if (mode !== 'dry-run') await sync(inv, await credentials(), mode === 'pilot');
}
main().catch(e => { console.error(networkError(e) + " — " + String(e.message).replace(/https?:\/\/\S+/g, "[URL masquée]").slice(0,400)); process.exitCode = 1; });
