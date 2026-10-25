import crypto from 'node:crypto';

// Métadonnées de rapport uniquement, après confirmation du transfert et de l'URL.
export function uploadReceipt(entry, response, previous, history, at) {
  if (response.existing || response.public_id !== entry.public_id || !response.secure_url || !entry.hash) return null;
  const older = previous?.url || history?.some(row => row.path === entry.path);
  const kind = older ? 'modified' : history === null ? 'unclassified' : 'added';
  const id = crypto.createHash('sha256').update(JSON.stringify([entry.public_id, entry.hash, response.version ?? response.secure_url])).digest('hex');
  return {id, kind, path:entry.path, public_id:entry.public_id, hash:entry.hash, at, confirmed:true};
}
