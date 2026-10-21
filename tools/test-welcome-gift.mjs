import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context={window:{}};vm.runInNewContext(fs.readFileSync('assets/js/welcome-gift.js','utf8'),context);
const gift=context.window.LapinousWelcomeGift,game={eggs:0};assert.equal(gift(game),true);assert.equal(game.eggs,1);assert.equal(gift(game),false);
const restored=JSON.parse(JSON.stringify(game));assert.equal(gift(restored),false);assert.equal(restored.eggs,1);
const old={eggs:0,welcomeEggGranted:true};assert.equal(gift(old),true);assert.equal(gift(old),false);assert.equal(old.eggs,1);
assert.equal(gift({eggs:0}),true);console.log('Cadeau : nouvelle partie, reprise JSON, ancien cadeau bloqué réparé une fois, aucun stockage navigateur requis.');
