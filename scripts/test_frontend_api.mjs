import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const catalog=JSON.parse(fs.readFileSync('backend/app/data/track_catalog.json','utf8'));
const source=fs.readFileSync('frontend/src/services/api.js','utf8')
  .replace('import.meta.env.VITE_API_BASE_URL', 'undefined')
  .replace(/import catalogFallback from .*;\r?\n/, '')
  .replace(/export /g, '');
const saved=new Map();
let reachable=false;
const sandbox={
  catalogFallback:catalog, console:{warn(){}}, Date, Math, JSON, Set, TypeError,
  crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789abc'},
  localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
  fetch:async()=>{
    if(!reachable) throw new TypeError('Offline test');
    return {ok:false,status:400,json:async()=>({message:'Invalid request'})};
  },
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const custom=await sandbox.addCustomTrack({title:'My Track',artist:'Test Artist',genre:'My Genre',
  duration_seconds:205,bpm:120,energy:.7,camelot_code:'8B',musical_key:'C Major'});
assert.ok((await sandbox.fetchCustomTracks()).some(track=>track.id===custom.id));
assert.ok((await sandbox.fetchGenres()).some(genre=>genre.name==='My Genre'));
const parameters={target_duration_minutes:180,selected_genres:['Ambient'],curve_type:'linear_ascent',
  crossfade_seconds:12,allow_repeats:true};
const playlist=await sandbox.generatePlaylist(parameters);
assert.ok(Math.abs(playlist.actual_duration_seconds-10800)<300);
assert.equal(playlist.transitions.length,playlist.tracks.length-1);
assert.ok(playlist.metrics.duration_accuracy_percent>95);
assert.equal(playlist.diagnostics.engine,'browser-greedy');
const history=await sandbox.fetchHistory();
assert.equal(history[0].playlist_id,playlist.playlist_id);
const loaded=await sandbox.fetchPlaylist(playlist.playlist_id);
assert.equal(loaded.tracks.length,playlist.tracks.length);
const filtered=await sandbox.generatePlaylist({
  target_duration_minutes:30,selected_genres:[],curve_type:'steady_flow',
  min_bpm:80,max_bpm:100,excluded_track_ids:[catalog[0].id],allow_repeats:false,
});
assert.ok(filtered.tracks.every(track=>track.bpm>=80&&track.bpm<=100&&track.id!==catalog[0].id));
for(const format of ['m3u','csv','json']){
  const exported=await sandbox.exportPlaylist({playlist:filtered,format});
  assert.ok(exported.content.length>0);
}
await sandbox.removeCustomTrack(custom.id);
assert.equal((await sandbox.fetchCustomTracks()).length,0);
reachable=true;
await assert.rejects(()=>sandbox.generatePlaylist(parameters),/Invalid request/);
console.log('Frontend offline custom tracks, generation, constraints, metrics, history, export and HTTP errors passed.');
