/**
 * Lapinous — quarantaine LOGIQUE Cloudinary (7 jours).
 * AUCUN déplacement, renommage, changement d'URL ou de public_id.
 * La suppression distante après 7 jours nécessite LAPINOUS_CLOUDINARY_DELETE_ENABLED=true
 * dans le .env ET toutes les vérifications de sécurité ci-dessous.
 * Simulation : aucune écriture de l'état de quarantaine et aucun appel Cloudinary.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { deletionSuspended } from './cloudinary-deletion-policy.mjs';

const root = process.cwd();
const dir = path.join(root, '.cloudinary-local');
const mode = process.argv[2] || 'simulation';
if (!['simulation', 'appliquer'].includes(mode)) throw Error('Modes : simulation ou appliquer.');
const now = Date.now();
const GRACE_MS = 7 * 24 * 3600_000;
const backupRoot = process.env.LAPINOUS_IMAGE_BACKUP_DIR || 'C:/Users/flori/Desktop/clikergame_avec_image';
const report = { date: new Date(now).toISOString(), mode, quarantine: [], restored: [], deleted: [], pending: [], blocked: [], errors: [] };
const read = async (name, fallback) => {
  try { return JSON.parse(await fs.readFile(path.join(dir, name), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
};
const atomic = async (name, value) => {
  const file = path.join(dir, name);
  await fs.writeFile(file + '.tmp', JSON.stringify(value, null, 2));
  await fs.rename(file + '.tmp', file);
};
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const safePath = p => typeof p === 'string' && /^assets\/img\/[\w\W]+/.test(p) && !p.split('/').includes('..') && !path.isAbsolute(p);
async function backedUp(item) {
  if (!safePath(item.path) || !/^[a-f0-9]{64}$/i.test(item.hash || '')) return false;
  const candidates = [path.join(backupRoot, item.path), path.join(backupRoot, '.versions', item.path, item.hash + path.extname(item.path))];
  for (const file of candidates) {
    try { if (hash(await fs.readFile(file)) === item.hash) return true; }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return false;
}
const inv = await read('inventory.json', null);
const manifest = await read('manifest.json', null);
const ledger = await read('versions-connues.json', null);
const queue = await read('quarantaine.json', { items: {} });
if (!inv || !manifest?.assets || !ledger?.assets || !queue?.items ||
    !Array.isArray(inv.selected) || !Array.isArray(inv.excluded) || !Array.isArray(inv.missing) ||
    inv.missing.length || !inv.selected.length || !Number.isFinite(Date.parse(inv.date)) ||
    now - Date.parse(inv.date) > 2 * 3600_000 || Date.parse(inv.date) > now + 60_000) {
  throw Error('Inventaire, historique ou manifeste incomplet / périmé : aucune suppression autorisée.');
}
const active = new Set();
for (const entry of inv.selected) {
  const record = manifest.assets[entry.path];
  if (!record || record.status !== 'verified' || !record.public_id?.startsWith('lapinous/') || !record.url ||
      (entry.hash && entry.hash !== record.hash)) throw Error('Image active non vérifiée : ' + entry.path);
  active.add(record.public_id);
}
// Défense supplémentaire : repérer les URL Cloudinary et public_id écrits en dur,
// même s'ils échappent au scanner principal. En cas de lecture impossible, arrêt.
const scanFiles = ['index.html', 'dashboard.html', 'lapinous-content.json', 'lapinous-puzzles.json', 'lapinous-shop.json'];
async function walk(folder, extensions) {
  try {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(full, extensions);
      else if (entry.isFile() && extensions.some(x => entry.name.endsWith(x)) && entry.name !== 'image-manifest.js') scanFiles.push(path.relative(root, full));
    }
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
await walk(path.join(root, 'assets/js'), ['.js', '.mjs']);
await walk(path.join(root, 'assets/css'), ['.css']);
const sources = [];
for (const file of scanFiles) {
  try { sources.push(await fs.readFile(path.join(root, file), 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
}
const sourceText = sources.join('\n');
const known = Object.entries(ledger.assets);
if (!known.length) throw Error('Historique vide : quarantaine suspendue.');

let env;
async function credentials() {
  if (env) return env;
  const data = await fs.readFile(path.join(root, '.env'), 'utf8');
  env = {};
  for (const line of data.split(/\r?\n/)) {
    const m = line.match(/^\s*(CLOUDINARY_[A-Z_]+|LAPINOUS_CLOUDINARY_DELETE_ENABLED)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}
async function api(method, id) {
  const cfg = await credentials();
  if (!cfg.CLOUDINARY_CLOUD_NAME || !cfg.CLOUDINARY_API_KEY || !cfg.CLOUDINARY_API_SECRET) throw Error('Configuration Cloudinary incomplète.');
  const endpoint = id.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.CLOUDINARY_CLOUD_NAME)}/resources/image/upload/${endpoint}`, {
    method, headers: { Authorization: 'Basic ' + Buffer.from(`${cfg.CLOUDINARY_API_KEY}:${cfg.CLOUDINARY_API_SECRET}`).toString('base64') },
    signal: AbortSignal.timeout(60000)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(`Cloudinary HTTP ${response.status} (${method})`);
  return json;
}
const deletionHold = await deletionSuspended(path.join(root,'tools/cloudinary-deletion-policy.json'));
report.deletionSuspended = deletionHold;
const deletionEnabled = !deletionHold && mode === 'appliquer' && process.env.LAPINOUS_CLOUDINARY_DELETE_DISABLED !== 'true' && (await credentials()).LAPINOUS_CLOUDINARY_DELETE_ENABLED === 'true';
const nextQueue = structuredClone(queue);
const nextLedger = structuredClone(ledger);
for (const [id, item] of known) {
  if (!id.startsWith('lapinous/') || id.startsWith('lapinous/corbeille/') || !safePath(item.path) || !item.hash || !item.url) continue;
  const existing = nextQueue.items[id];
  const referenced = active.has(id) || sourceText.includes(id) || sourceText.includes(item.url);
  if (referenced) {
    if (existing) {
      if (mode === 'appliquer') delete nextQueue.items[id];
      report.restored.push({ id, path: item.path, reason: 'Référence active retrouvée ; quarantaine annulée' });
    }
    continue;
  }
  if (!await backedUp(item)) {
    report.blocked.push({ id, path: item.path, reason: 'Version exacte absente de la sauvegarde permanente' });
    continue;
  }
  if (!existing) {
    if (mode === 'appliquer') nextQueue.items[id] = { ...item, since: new Date(now).toISOString(), type: 'logical' };
    report.quarantine.push({ id, path: item.path, since: new Date(now).toISOString(), daysRemaining: 7 });
    continue;
  }
  // Les anciennes quarantaines physiques (dossiers Cloudinary) ne sont pas automatiquement supprimées.
  if (existing.type !== 'logical' || !Number.isFinite(Date.parse(existing.since)) || Date.parse(existing.since) > now) {
    report.blocked.push({ id, path: item.path, reason: 'Ancienne quarantaine ou date invalide : vérification manuelle requise' });
    continue;
  }
  const remaining = GRACE_MS - (now - Date.parse(existing.since));
  if (remaining > 0) {
    report.pending.push({ id, path: item.path, since: existing.since, daysRemaining: Math.ceil(remaining / 86400_000) });
    continue;
  }
  if (!deletionEnabled) {
    report.blocked.push({ id, path: item.path, reason: deletionHold ? 'Suppression suspendue : sauvegarde exacte et autorisation humaine à vérifier.' : '7 jours écoulés : suppression distante désactivée (LAPINOUS_CLOUDINARY_DELETE_ENABLED)' });
    continue;
  }
  try {
    // Vérification Cloudinary immédiatement avant la suppression, sans changer le dossier.
    const remote = await api('GET', id);
    if (remote.public_id !== id || remote.secure_url !== item.url || remote.resource_type !== 'image' || remote.type !== 'upload') {
      throw Error('Identité / URL de la ressource distante non confirmée.');
    }
    const result = await api('DELETE', id);
    if (result.result !== 'ok') throw Error('Suppression non confirmée par Cloudinary.');
    delete nextQueue.items[id];
    delete nextLedger.assets[id];
    report.deleted.push({ id, path: item.path, since: existing.since });
    // Sauvegarder après CHAQUE suppression pour éviter de réutiliser un état périmé en cas de crash.
    await atomic('quarantaine.json', nextQueue);
    await atomic('versions-connues.json', nextLedger);
  } catch (e) {
    report.errors.push({ id, reason: e.message });
  }
}
for (const id of Object.keys(nextQueue.items)) {
  if (!nextLedger.assets[id]) report.blocked.push({ id, reason: 'Quarantaine sans historique : intervention nécessaire' });
}
await fs.mkdir(dir, { recursive: true });
if (mode === 'appliquer') {
  await atomic('quarantaine.json', nextQueue);
  await atomic('versions-connues.json', nextLedger);
}
await atomic('corbeille-report.json', report);
console.log(JSON.stringify({ quarantine: report.quarantine.length, restored: report.restored.length, deleted: report.deleted.length, pending: report.pending.length, blocked: report.blocked.length, errors: report.errors.length }));
if (report.errors.length) process.exitCode = 1;
