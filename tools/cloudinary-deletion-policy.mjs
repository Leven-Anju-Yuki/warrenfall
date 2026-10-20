import fs from 'node:fs/promises';
// Fail closed: absent, malformed or ambiguous policy never permits deletion.
export async function deletionSuspended(file) {
  try { return JSON.parse(await fs.readFile(file,'utf8')).suspended !== false; }
  catch { return true; }
}
