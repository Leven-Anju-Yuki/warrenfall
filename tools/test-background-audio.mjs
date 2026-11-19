import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const listeners={}, tracks=[];
class Audio {
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;tracks.push(this);}
  cloneNode(){return new Audio(this.src);}
  addEventListener(){}
  pause(){this.paused=true;}
  play(){this.paused=false;return Promise.resolve();}
}
const document={hidden:false,addEventListener:(name,callback)=>listeners[name]=callback};
const window={addEventListener:(name,callback)=>listeners[name]=callback};
const game={audio:{muted:false,ambience:true,sfx:true}};
const context=vm.createContext({Audio,document,window,game,Date,Promise,Set,Error,Number,Math,
  setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},ensureNewSystems(){},currentActiveEvents:()=>[]});
const source=fs.readFileSync('assets/js/script.js','utf8');
vm.runInContext(source.slice(source.indexOf('        const AUDIO_FILES ='),source.indexOf('        window.toggleLapinousAudio =')),context);
vm.runInContext("updateAmbience();playSfx('attack');playSfx('feed');",context);
await Promise.resolve();
assert.ok(tracks.some(a=>!a.paused));
document.hidden=true;listeners.visibilitychange();
assert.ok(tracks.every(a=>a.paused),'All music and cloned sound effects must stop');
vm.runInContext("updateAmbience();playSfx('victory');",context);
assert.ok(tracks.every(a=>a.paused),'Timers must not restart hidden audio');
document.hidden=false;listeners.visibilitychange();await Promise.resolve();
assert.ok(tracks.some(a=>!a.paused),'Ambience can resume on return');
listeners.pagehide();assert.ok(tracks.every(a=>a.paused));
vm.runInContext('updateAmbience()',context);assert.ok(tracks.every(a=>a.paused),'pagehide stays suspended even before document.hidden changes');
game.audio.muted=true;listeners.pageshow();assert.ok(tracks.every(a=>a.paused),'User mute setting is preserved');
assert.equal(game.audio.muted,true);
let closed=0;context.fakeContext={close(){closed++;return Promise.resolve();}};
vm.runInContext('seasonalAudioContext=fakeContext;',context);listeners.freeze();assert.equal(closed,1);
console.log('Background audio: effects, music, hidden timers, pagehide, return, mute and scheduled notes OK');
