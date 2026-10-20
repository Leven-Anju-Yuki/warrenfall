import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/installer.js','utf8');
const code=source.slice(source.indexOf('  function visibility()'),source.indexOf('  async function install()'))+'visibility();';
for(const [remembered,standalone,label,hidden] of [[false,false,'Installer',false],[true,false,'Application',false],[true,true,'Installé',true]]){
 const button=()=>({hidden:false,lastElementChild:{},setAttribute(){}});
 const context={installationConfirmed:false,installationRemembered:remembered,matchMedia:()=>({matches:standalone}),navigator:{},localStorage:{setItem(){}},button:button(),savedButton:button(),gameButton:button(),navButton:button()};
 vm.runInNewContext(code,context);assert.equal(context.navButton.hidden,hidden);assert.equal(context.navButton.lastElementChild.textContent,label);
}
console.log('Installation : accès visible sans installation, ancien indicateur = Application, mode autonome sans proposition.');
