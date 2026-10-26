import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/catalog.js';
import { films, cleanState, recordLaunch, togglePin, toggleFilm, filterApps, rowDestination } from '../src/tv-model.js';

test('TV storage tolerates missing, malformed and obsolete data',()=>{
 for(const raw of [null,undefined,'bad',42])assert.equal(cleanState(raw).pinned.length,7);
 const state=cleanState({pinned:['steam','steam','obsolete'],recent:['missing','youtube','youtube'],name:'   ',watchlist:['echoes','fake']});
 assert.deepEqual(state.pinned,['steam']);assert.deepEqual(state.recent,['youtube']);assert.deepEqual(state.watchlist,['echoes']);assert.equal(state.name,'客厅用户');
 assert.equal(cleanState({name:'abcdefghijklmnopq'}).name.length,16);
});
test('recent launches are unique, newest first and capped at eight',()=>{
 let state=cleanState();for(const a of apps)state=recordLaunch(state,a.id);
 assert.equal(state.recent.length,8);assert.equal(state.recent[0],apps.at(-1).id);
 state=recordLaunch(state,state.recent[5]);assert.equal(new Set(state.recent).size,8);
 assert.equal(recordLaunch(state,'nonexistent'),state);
});
test('home pins enforce the eight-app limit and support reversible removal',()=>{
 const original=cleanState(),added=togglePin(original,'twitch');assert.equal(added.pinned.length,8);
 assert.equal(togglePin(added,'vimeo'),added);assert.deepEqual(togglePin(added,'twitch').pinned,original.pinned);
 assert.equal(togglePin(original,'bad'),original);assert.equal(original.pinned.length,7);
});
test('watchlist saves and removes original content without duplicates',()=>{
 const initial=cleanState(),saved=toggleFilm(initial,films[0].id);assert.deepEqual(saved.watchlist,['echoes']);
 assert.deepEqual(toggleFilm(saved,'echoes').watchlist,[]);assert.equal(toggleFilm(saved,'unknown'),saved);
});
test('search and category filters compose over all thirty apps',()=>{
 assert.equal(filterApps().length,30);assert.deepEqual(filterApps('STEAM').map(a=>a.id),['steam']);
 assert.equal(filterApps('网易').length,1);assert.equal(filterApps('Steam','音乐').length,0);
 assert.ok(filterApps('','音乐').every(a=>a.group==='音乐'));assert.equal(filterApps('no such app').length,0);
});
test('TV remote vertical navigation preserves horizontal intent between uneven rows',()=>{
 const rows=[[{id:'header',x:100}],[{id:'left',x:50},{id:'right',x:300}],[{id:'a',x:40},{id:'b',x:160},{id:'c',x:310}]];
 assert.equal(rowDestination(rows,'right','ArrowDown'),'c');assert.equal(rowDestination(rows,'b','ArrowUp'),'left');
 assert.equal(rowDestination(rows,'left','ArrowLeft'),'right');assert.equal(rowDestination(rows,'right','ArrowRight'),'left');
 assert.equal(rowDestination(rows,'header','ArrowUp'),'header');assert.equal(rowDestination([],null,'ArrowDown'),null);
});
