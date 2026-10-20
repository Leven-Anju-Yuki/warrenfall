import { readImageMap, writeImageMap } from './image-manifest-store.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const watchMode = process.argv.includes('--watch');
const backupMode = process.argv.includes('--backup-local');
let running = false, pending = false, timer;
let beforeAssets = null;
const runStarted = new Date();
const runDetails = { startedAt: runStarted.toISOString(), steps: [], status: 'running' };
function saveRun() {
  fs.mkdirSync('.cloudinary-local', { recursive: true });
  const temp = '.cloudinary-local/nightly-report.json.tmp';
  fs.writeFileSync(temp, JSON.stringify(runDetails, null, 2));
  fs.renameSync(temp, '.cloudinary-local/nightly-report.json');
}

/** Exécute une étape et arrête la chaîne si elle échoue. Aucun secret n’est lu ici. */
function run(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { stdio: ['ignore','pipe','pipe'], windowsHide: true });
    let diagnostic = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
      const safe = chunk.toString().replace(/https?:\/\/\S+/g, '[URL masquée]').replace(/(?:key|token|secret|signature)=[^&\s]+/gi, '[secret masqué]');
      diagnostic = (diagnostic + safe).slice(-2000);
      process.stdout.write(safe);
    });
    child.on('error', reject);
    child.on('exit', code => {
      runDetails.steps.push({ file, args, exitCode: code, diagnostic: code === 0 ? null : diagnostic.trim(), at: new Date().toISOString() });
      code === 0 ? resolve() : reject(new Error(`Étape interrompue : ${file} (code ${code}) — ${diagnostic.trim().slice(-700) || "aucun diagnostic du processus"}`));
    });
  });
}

/** Regroupe les étapes de migration ; les transferts restent contrôlés par le quota gratuit. */
async function update() {
  if (running) { pending = true; return; }
  running = true;
  runDetails.startedAt = new Date().toISOString();
  runDetails.steps = [];
  runDetails.status = 'running';
  beforeAssets = null;
  delete runDetails.images;
  saveRun();
  try {
    await run('tools/cloudinary-sync.mjs', ['dry-run']);
    const inventory = JSON.parse(fs.readFileSync('.cloudinary-local/inventory.json', 'utf8'));
    let manifest = { assets: {} };
    try { manifest = JSON.parse(fs.readFileSync('.cloudinary-local/manifest.json', 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    beforeAssets = structuredClone(manifest.assets || {});
    // Historique des versions connues AVANT leur remplacement dans le manifeste.
    const ledgerFile = '.cloudinary-local/versions-connues.json';
    let ledger = { assets: {} };
    try { ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!ledger || typeof ledger.assets !== 'object' || Array.isArray(ledger.assets)) throw new Error('Historique des versions invalide.');
    for (const [local, record] of Object.entries(manifest.assets || {})) {
      if (record?.status === 'verified' && record?.public_id && record?.hash && record?.url) {
        ledger.assets[record.public_id] = { path: local, hash: record.hash, url: record.url, public_id: record.public_id, date: record.date };
      }
    }
    fs.mkdirSync('.cloudinary-local', { recursive: true });
    fs.writeFileSync(ledgerFile + '.tmp', JSON.stringify(ledger, null, 2));
    fs.renameSync(ledgerFile + '.tmp', ledgerFile);
    const changed = inventory.selected.some(x => x.sourceExists !== false && (manifest.assets[x.path]?.hash !== x.hash || manifest.assets[x.path]?.status !== 'verified'));
    const hasLocalImages = inventory.selected.some(x => x.sourceExists !== false);
    if (backupMode && !hasLocalImages && !changed) console.log('Aucune nouvelle image utilisée ; vérification et nettoyage poursuivis.');
    if (changed) {
      const hasPilot = ['png', 'gif', 'svg'].every(ext => Object.values(manifest.assets).some(x => x.path.endsWith('.' + ext) && x.status === 'verified'));
      if (!hasPilot) await run('tools/cloudinary-sync.mjs', ['pilot']);
      await run('tools/cloudinary-sync.mjs', ['sync']);
    } else {
      // Retire du manifeste public les références devenues inutiles, sans supprimer les ressources distantes.
      const map = Object.fromEntries(inventory.selected.map(x => [x.path, x.url || manifest.assets[x.path]?.url]));
      writeImageMap(map);
    }
    if (backupMode && hasLocalImages) {
      await run('tools/backup-transferred-images.mjs');
      await run('tools/cloudinary-sync.mjs', ['dry-run']);
    }
    await run('tools/cloudinary-activate.mjs');
    // Met à jour l'historique avec les nouveaux identifiants après synchronisation.
    const latestManifest = JSON.parse(fs.readFileSync('.cloudinary-local/manifest.json', 'utf8'));
    const latestLedger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
    for (const [local, record] of Object.entries(latestManifest.assets || {})) {
      if (record?.status === 'verified' && record.public_id?.startsWith('lapinous/') && record.hash && record.url)
        latestLedger.assets[record.public_id] = { path: local, hash: record.hash, url: record.url, public_id: record.public_id, date: record.date };
    }
    fs.writeFileSync(ledgerFile + '.tmp', JSON.stringify(latestLedger, null, 2));
    fs.renameSync(ledgerFile + '.tmp', ledgerFile);
    // La corbeille n'est traitée qu'après une synchronisation et une activation réussies.
    await run('tools/cloudinary-corbeille.mjs', ['appliquer']);
    console.log(changed ? 'Images synchronisées et raccordées.' : 'Images déjà synchronisées ; raccordement à jour.');
    runDetails.status = 'success';
  } catch (e) {
    runDetails.status = 'failed';
    runDetails.error = e.message;
    console.error(e.message);
    if (!watchMode) process.exitCode = 1;
  } finally {
    runDetails.finishedAt = new Date().toISOString();
    try {
      const inv = JSON.parse(fs.readFileSync('.cloudinary-local/inventory.json', 'utf8'));
      runDetails.inventory = inv;
      const after = JSON.parse(fs.readFileSync('.cloudinary-local/manifest.json', 'utf8')).assets || {};
      runDetails.images = {added:[],modified:[],unchanged:[],failed:[]};
      for (const item of (beforeAssets ? inv.selected : [])) {
        const latest=after[item.path], previous=beforeAssets[item.path];
        const kind=latest?.status!=='verified'||(item.hash&&latest.hash!==item.hash)?'failed':!previous?'added':previous.hash!==latest.hash?'modified':'unchanged';
        runDetails.images[kind].push({path:item.path,public_id:latest?.public_id||null});
      }
    } catch {}
    if (runDetails.steps.some(step => step.file === 'tools/cloudinary-corbeille.mjs')) {
      try { runDetails.corbeille = JSON.parse(fs.readFileSync('.cloudinary-local/corbeille-report.json', 'utf8')); } catch {}
    }
    saveRun();
    running = false;
    if (pending) { pending = false; schedule(); }
  }
}

/** Attend la fin d’une série de sauvegardes avant de relancer la synchronisation. */
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(update, 3000);
}

if (watchMode) {
  for (const folder of ['assets/img', 'assets/js']) fs.watch(folder, { recursive: true }, (_, file) => {
    if (folder === 'assets/js' && (!file || /image-manifest\.js$/.test(file))) return;
    schedule();
  });
  fs.watch('.', (_, file) => { if (['lapinous-content.json', 'lapinous-puzzles.json', 'lapinous-shop.json'].includes(file)) schedule(); });
  console.log('Synchronisation automatique active. Garder cette fenêtre ouverte ; Ctrl+C pour arrêter.');
}
await update();
