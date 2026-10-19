import dns from 'node:dns/promises';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const transient = new Set(['ENOTFOUND','EAI_AGAIN','ECONNRESET','ECONNREFUSED','ETIMEDOUT','ENETUNREACH','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET','HTTP_429','HTTP_502','HTTP_503','HTTP_504']);
export function networkError(error) {
  const code = error?.cause?.code || error?.code || error?.name || 'UNKNOWN';
  const ssl = /CERT|SSL|TLS|SELF_SIGNED|ISSUER/.test(code);
  return `${ssl ? 'SSL/certificat' : transient.has(code) || /Timeout|Abort|fetch failed/i.test(error?.message || '') ? 'Réseau' : 'Script'} : ${code}`;
}
export async function retryRead(operation, {wait=sleep, attempts=3}={}) {
  for(let attempt=1;;attempt++) {
    try { return await operation(); }
    catch(error) {
      const code=error?.cause?.code || error?.code || error?.name;
      if(attempt>=attempts || !(transient.has(code) || ['TimeoutError','AbortError'].includes(code))) throw error;
      await wait(attempt===1?1000:3000);
    }
  }
}
export async function preflight(host, options={}) {
  await retryRead(()=> (options.lookup || dns.lookup)(host), options);
}
export async function remoteFetch(url, options={}, dependencies={}) {
  const method=(options.method || 'GET').toUpperCase();
  const operation=async()=>{
    const response=await (dependencies.fetch || fetch)(url,{...options,signal:["GET","HEAD"].includes(method)?AbortSignal.timeout(30000):(options.signal || AbortSignal.timeout(120000))});
    if([429,502,503,504].includes(response.status) && ['GET','HEAD'].includes(method)) {
      const error=new Error('Service temporairement indisponible'); error.code='HTTP_'+response.status;
      await response.body?.cancel(); throw error;
    }
    return response;
  };
  // Never replay an upload/deletion after an ambiguous network response.
  return ['GET','HEAD'].includes(method)?retryRead(operation,dependencies):operation();
}
