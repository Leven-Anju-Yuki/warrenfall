import { readImageMap } from './image-manifest-store.mjs';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const referenceRoot = path.join(path.dirname(root), 'clikergame_avec_image');
const excluded = new Set(['.git', 'node_modules', '.codex', '.agents', '.aws', '.cloudinary-local', 'secours-images']);
const oldReadmeBytes = 615007429;
const original = fs.readFileSync('readme.md', 'utf8');
const number = n => n.toLocaleString('fr-FR');
const weight = n => n >= 1048576 ? (n / 1048576).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Mio'
  : n >= 1024 ? (n / 1024).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Kio' : number(n) + ' octets';

/** Mesure les métadonnées des fichiers sans lire leurs images ni suivre les liens symboliques. */
function scan(folder, depth = 0) {
  const node = { name: path.basename(folder), directory: true, bytes: 0, children: [] };
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const item = entry.isDirectory() && depth === 0 && excluded.has(entry.name)
      ? { name: entry.name, directory: true, bytes: 0, children: [], unmeasured: true }
      : entry.isDirectory() ? scan(path.join(folder, entry.name), depth + 1)
      : { name: entry.name, directory: false, bytes: fs.statSync(path.join(folder, entry.name)).size };
    node.children.push(item); node.bytes += item.bytes;
  }
  node.children.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name, 'fr'));
  return node;
}
/** Applique le même périmètre aux deux copies pour que la comparaison soit cohérente. */
function projectTree(full) {
  const children = full.children.filter(x => !excluded.has(x.name) && !/^\.env(?:\.|$)/.test(x.name));
  return { ...full, children, bytes: children.reduce((n, x) => n + x.bytes, 0) };
}
// Conserve une copie du README avant régénération, hors du périmètre mesuré.
fs.mkdirSync('.cloudinary-local/backups', { recursive: true });
fs.writeFileSync('.cloudinary-local/backups/readme-before-sizes-' + Date.now() + '.md', original);
const currentFull = scan(root), referenceFull = scan(referenceRoot);
const current = projectTree(currentFull), reference = projectTree(referenceFull);
const readmeNode = current.children.find(x => x.name === 'readme.md');
const imageMap = readImageMap();
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date());

/** Produit l’arborescence complète des fichiers du projet avec les poids cumulés des dossiers. */
function tree(node) {
  const lines = ['Warrenfall/ — ' + weight(node.bytes)];
  function visit(parent, prefix) {
    parent.children.forEach((child, i) => {
      const last = i === parent.children.length - 1;
      lines.push(prefix + (last ? '└── ' : '├── ') + child.name + (child.directory ? '/' : '') + ' — ' + weight(child.bytes));
      if (child.directory) visit(child, prefix + (last ? '    ' : '│   '));
    });
  }
  visit(node, ''); return lines.join('\n');
}
/** Compare les fichiers du projet ; les dossiers privés ne sont pas parcourus. */
function section() {
  const saving = reference.bytes - current.bytes;
  const previousSaving = oldReadmeBytes - current.bytes;
  const localRows = currentFull.children.filter(x => x.directory).map(x => `| \`${x.name}/\` | ${x.unmeasured ? 'Non mesuré' : weight(x.bytes)} | ${x.unmeasured ? '—' : number(x.bytes)} | ${excluded.has(x.name) ? 'Local privé, exclu et non parcouru' : 'Inclus dans le projet'} |`).join('\n');
  return `## 🗂️ Structure du projet

### Images hébergées sur Cloudinary

Les **${Object.keys(imageMap).length} images utilisées** sont hébergées sur Cloudinary, dans le cloud \`dgrszi9wf\`, sous \`lapinous/\`. Le jeu et le Dashboard utilisent les URL de \`assets/js/image-manifest.js\`, chargées par le résolveur commun. Les originaux transférés ont été retirés de \`assets/img/\` ; les dossiers restent disponibles grâce aux \`.gitkeep\`. Les futures créations et les images non transférées sont conservées.

La tâche Windows **« Lapinous - Images Cloudinary 20h »** conserve les transferts et la sauvegarde permanente des originaux dans \`C:/Users/flori/Desktop/clikergame_avec_image/assets/img/\`, avec la même arborescence. Le relais vérifie la copie exacte avant de retirer la source du dossier du jeu ; les anciennes versions restent dans \`.versions/\`. Aucune purge de cette sauvegarde n’est prévue. Les nouveaux fichiers locaux sont transférés lorsque le PC est disponible, avec rattrapage des exécutions manquées. GitHub Actions assure les bilans Discord, Trello et la corbeille Cloudinary vers **20 h, Europe/Paris**, même si le PC est fermé ou éteint. La suppression après sept jours concerne uniquement Cloudinary et reste conditionnée à une preuve de sauvegarde exacte.

Pour lancer le relais manuellement : double-cliquer sur \`Synchroniser les images.cmd\`, ou exécuter \`python -B tools/automation/local_bridge.py run\`. Les images doivent être référencées dans le jeu ou un catalogue JSON. Le contrôle du quota reste actif avant tout nouvel envoi. Windows et Actions partagent un verrou ; aucun bilan Windows indépendant n’est programmé.

### Comparaison avant / après

Mesure du **${date}**. Les tailles correspondent à la somme des octets des fichiers, sans mesurer l’espace alloué par Windows. Le périmètre comparable exclut \`.git\`, les dépendances, les configurations locales de l’agent, \`.env\`, \`.cloudinary-local\` et \`secours-images\`, dans les deux copies.

| Référence | Poids | Octets |
| --- | ---: | ---: |
| Ancien chiffre du README, avant migration | ${weight(oldReadmeBytes)} | ${number(oldReadmeBytes)} |
| Copie \`clikergame_avec_image/\`, mesurée sans modification | ${weight(reference.bytes)} | ${number(reference.bytes)} |
| Projet actuel, même périmètre | **${weight(current.bytes)}** | **${number(current.bytes)}** |

**Économie par rapport à la copie avec images : ${weight(saving)} (${number(saving)} octets), soit ${(100 * saving / reference.bytes).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %.** Par rapport au chiffre précédent du README : ${weight(previousSaving)} (${number(previousSaving)} octets).

### Poids de tous les dossiers à la racine

| Dossier | Poids cumulé | Octets | Périmètre |
| --- | ---: | ---: | --- |
${localRows}

Les fichiers de Git gardent encore l’historique des anciennes images. Les caches, journaux, états privés et secrets sont exclus et ne sont pas parcourus par ce calcul. Les chiffres ci-dessus décrivent le projet comparable ; ils ne prétendent pas mesurer l’occupation totale du disque.

### Arborescence et poids détaillés

Chaque fichier et chaque sous-dossier du périmètre comparable est indiqué ci-dessous. Les dossiers vides pèsent zéro octet hors métadonnées du système de fichiers. Les détails des caches, secrets et sauvegardes privées sont omis ; leurs dossiers figurent dans le tableau précédent.

\`\`\`text
${tree(current)}
\`\`\`

Poids total du projet : **${weight(current.bytes)}** (${number(current.bytes)} octets), calculé le ${date}.

Pour recalculer cette section : \`node tools/update-readme-sizes.mjs\`. Ce script mesure la sauvegarde permanente \`clikergame_avec_image\` en lecture seule et ne la modifie jamais.
`;
}

const target = /## [^\n]*Structure du projet\r?\n[\s\S]*?(?=\r?\n## )/;
if (!target.test(original)) throw new Error('Section Structure du projet introuvable.');
// Inclut la taille du README produit dans son propre total, jusqu’à stabilisation exacte.
let result;
for (let i = 0; i < 30; i++) {
  result = original.replace(target, section());
  const bytes = Buffer.byteLength(result, 'utf8');
  if (bytes === readmeNode.bytes) break;
  const delta = bytes - readmeNode.bytes;
  readmeNode.bytes = bytes; current.bytes += delta;
  const fullReadme = currentFull.children.find(x => x.name === 'readme.md'); fullReadme.bytes = bytes;
  if (i === 29) throw new Error('Poids du README non stabilisé.');
}
if (result !== original) {
  fs.writeFileSync('readme.md', result);
}
console.log(JSON.stringify({ currentBytes: current.bytes, referenceBytes: reference.bytes, savedBytes: reference.bytes - current.bytes, reductionPercent: Number((100 * (reference.bytes - current.bytes) / reference.bytes).toFixed(2)) }));
