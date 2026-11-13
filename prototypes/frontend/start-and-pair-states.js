// Deterministic documentation fixtures for H1 batch 1 (absence review, schedule, start). No API, storage or live clock.
(() => {
'use strict';
const groups={
  Entries:['absence-review','mark-absent-confirm','marked-absent','field-locked','entries-running'],
  Schedule:['schedule-blocked','schedule-empty','schedule-generating','schedule-draft','schedule-draft-odd','schedule-draft-teams','schedule-stale','schedule-published','withdraw-confirm','schedule-withdrawn','schedule-crossed','schedule-conflict','schedule-load-failed','schedule-running'],
  Configuration:['reopen-locked','start-blocked','start-blocked-rosters','start-ready','start-confirm','starting','started','start-conflict','start-crossed'],
};
const states=Object.values(groups).flat();
const query=new URLSearchParams(location.search);
const state=states.includes(query.get('state'))?query.get('state'):'absence-review';
const page=Object.keys(groups).find(key=>groups[key].includes(state));
document.body.dataset.state=state;
const zone='Europe/Madrid';
const is=(...keys)=>keys.includes(state);
const teams=is('schedule-draft-teams','start-blocked-rosters');
const running=is('entries-running','schedule-running','started','start-crossed');
const published=running||is('field-locked','reopen-locked','schedule-published','withdraw-confirm','schedule-crossed','start-ready','start-confirm','starting','start-conflict','start-blocked-rosters');
const title=teams?'Saturday Team League':'Saturday Open';
const icon=(type='info')=>`<svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',error:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/>',ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',down:'<path d="m7 10 5 5 5-5"/>',switch:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>'})[type]}</svg>`;
const button=(label,action='',cls='',attrs='')=>`<button type="button" class="${cls}" ${action?`data-action="${action}"`:''} ${attrs}>${label}</button>`;
const notice=(heading,text,tone='info',extra='')=>`<section class="fl-notice ${tone}" role="${tone==='danger'?'alert':'status'}">${icon(tone==='danger'?'error':'info')}<div><strong>${heading}</strong><p>${text}</p>${extra}</div></section>`;
const label=(text,tone='')=>`<span class="check-label ${tone}">${text}</span>`;

// Circle method: fix the first entrant, rotate the others; an odd field adds a rest slot.
function roundRobin(names){const list=[...names];if(list.length%2)list.push(null);const n=list.length,rounds=[];let rot=list.slice(1);for(let r=0;r<n-1;r++){const line=[list[0],...rot],matches=[];let rest=null;for(let i=0;i<n/2;i++){const a=line[i],b=line[n-1-i];if(a===null||b===null)rest=a??b;else matches.push([a,b]);}rounds.push({matches,rest});rot=[rot[rot.length-1],...rot.slice(0,-1)];}return rounds;}
const players=['Robin Vale','Sam Reed','Jamie Brook','Taylor Finch','Rowan Lake'];
const field=is('schedule-draft-odd','schedule-withdrawn')?players:teams?['River Falcons','Harbour Lights','Meadow Foxes','North Stars']:players.slice(0,4);

const lifecycle=()=>`<div class="labels" aria-label="Tournament lifecycle"><span>Published</span><span>Registration closed</span><span>${running?'Running':'Preparing'}</span></div>`;
function heading(prefix){return `<header class="fl-heading"><a class="back" href="?state=start-blocked">Back to configuration</a><div class="title"><h1>${prefix}${title}</h1>${lifecycle()}</div><nav class="sp-tabs" aria-label="Tournament"><a href="?state=start-blocked" ${page==='Configuration'?'aria-current="page"':''}>Configuration</a><a href="?state=absence-review" ${page==='Entries'?'aria-current="page"':''}>Entries</a><a href="?state=schedule-published" ${page==='Schedule'?'aria-current="page"':''}>Schedule</a></nav></header>`;}

// Entries page: absence review and the field lock.
function entries(){
  const lock=published?(running?'The competition has started.':'The schedule is published. Withdraw it to change the field.'):'';
  const pending=is('absence-review','mark-absent-confirm')?['Sam Reed','Rowan Lake']:is('marked-absent')?['Rowan Lake']:[];
  const rows=players.filter(n=>!(is('marked-absent','field-locked','entries-running')&&n==='Sam Reed')).filter(n=>!(is('field-locked','entries-running')&&n==='Rowan Lake')).map(n=>{const p=pending.includes(n);return `<li><div class="entry-copy"><div class="team-identity"><h3>${n}</h3>${label(p?'Check-in pending':'Checked in',p?'':'confirmed')}</div><p class="help">Admitted</p></div><div class="row-actions">${button(p?'Check in':'Undo check-in','explain','',lock?`disabled aria-describedby="lock-why"`:'')}${p?button('Mark absent','absent','',`aria-label="Mark absent: ${n}"`):button('Cancel entry','explain','',lock?'disabled aria-describedby="lock-why"':'')}</div></li>`;}).join('');
  const admitted=players.length-(is('marked-absent')?1:is('field-locked','entries-running')?2:0);
  const summary=`<section class="fl-summary" aria-labelledby="summary-heading"><div><h2 id="summary-heading">${admitted} of 5 individual entries</h2><p class="help" id="add-why">Automatic admission · registration closed, so no entry can be added</p><p class="help">Check-in mandatory · ${admitted-pending.length} of ${admitted} checked in</p>${lock?`<p class="help" id="lock-why">${lock}</p>`:''}</div>${button('Add player','explain','primary','disabled aria-describedby="add-why"')}</section>`;
  const review=pending.length?notice(`${pending.length===1?'1 entry is':`${pending.length} entries are`} pending check-in`,'Pending entries block the schedule. Check each in, or mark it absent: marking absent cancels the entry and cannot be undone.'):'';
  const cancelled=is('marked-absent','field-locked','entries-running')?`<details class="fl-history" open><summary>Cancelled · ${is('marked-absent')?1:2}</summary><ul><li><div class="team-identity"><strong>Sam Reed</strong>${label('Absent at start')}</div><p class="help">Marked absent 21 November 2026, 09:41 · ${zone} · Check-in never confirmed</p></li>${is('marked-absent')?'':`<li><div class="team-identity"><strong>Rowan Lake</strong>${label('Absent at start')}</div><p class="help">Marked absent 21 November 2026, 09:43 · ${zone}</p></li>`}</ul></details>`:'';
  return `<div class="column">${summary}${review}${lock?notice(running?'Running · entries are read-only':'Field locked',lock+(running?' Leaving now is a competitive withdrawal, handled from the round operations.':''),'info',running?'':`<div class="actions"><a class="button" href="?state=schedule-published">Open schedule</a></div>`):''}<section class="fl-group"><h2>Admitted · ${admitted}</h2><ul class="fl-rows">${rows}</ul></section>${cancelled}</div>`;
}

// Schedule page.
function rounds(list){return roundRobin(list).map((r,i)=>`<section class="fl-group sp-round"><h3>Round ${i+1}</h3><ul class="fl-rows">${r.matches.map(([a,b])=>`<li><span>${a}</span><span class="help">vs</span><span>${b}</span></li>`).join('')}</ul>${r.rest?`<p class="help">Rest: ${r.rest} · no points</p>`:''}</section>`).join('');}
function schedule(){
  if(is('schedule-load-failed'))return `<div class="column">${notice('The schedule could not be loaded','The request failed. Nothing changed.','danger',`<div class="actions">${button('Try again','explain')}</div>`)}</div>`;
  if(is('schedule-blocked'))return `<div class="column"><section class="fl-panel"><h2>Before generating</h2><ul class="sp-checks">${[['Registration closed',false,'Close registration on the configuration page.','?state=start-blocked'],['No entry pending check-in',false,'2 entries pending. Check them in or mark them absent.','?state=absence-review'],['At least two eligible entrants',true,'3 eligible.','']].map(([t,ok,h,href])=>`<li>${label(ok?'Met':'Not met',ok?'confirmed':'')}<div><strong>${t}</strong><p class="help">${h}${href?` <a href="${href}">Fix it</a>`:''}</p></div></li>`).join('')}</ul>${button('Generate draft','','primary','disabled aria-describedby="gen-why"')}<p class="help" id="gen-why">Registration is still open.</p></section></div>`;
  if(is('schedule-empty','schedule-generating')){const busy=is('schedule-generating');return `<div class="column"><section class="fl-panel"><h2>Generate a draft</h2><p class="help">Single round-robin · 4 eligible players · 3 rounds, 6 matches. Generating sends nothing and creates no result.</p><fieldset class="sp-seeding"><legend>Seeding</legend><label><input type="radio" name="seeding" ${busy?'checked disabled':''}> Admission order</label><label><input type="radio" name="seeding" ${busy?'disabled':''}> Draw (the seed is recorded)</label></fieldset>${busy?`<p class="help" role="status">Generating. Please wait; do not submit again.</p>`:''}${button(busy?'Generating…':'Generate draft','generate','primary',busy?'disabled':'')}</section></div>`;}
  const draftState=is('schedule-stale')?'Stale':running?'Published · revision 2':is('schedule-published','withdraw-confirm','schedule-crossed','schedule-conflict')?'Published · revision 1':'Draft';
  const seeding=is('schedule-draft-odd','schedule-withdrawn')?'Draw · seed 48213':'Admission order';
  const actions=running?'':draftState.startsWith('Published')?button('Withdraw','withdraw','',is('schedule-conflict')?'disabled':''):is('schedule-stale')?`${button('Regenerate','generate','primary')}${button('Publish','','','disabled aria-describedby="stale-why"')}`:`${button('Regenerate','generate')}${button('Publish','publish','primary')}`;
  const top=`<section class="fl-summary"><div><h2>${label(draftState,draftState.startsWith('Published')?'confirmed':'')} ${field.length} ${teams?'teams':'players'} · ${roundRobin(field).length} rounds · ${field.length*(field.length-1)/2} matches</h2><p class="help">Single round-robin · ${seeding}${draftState==='Draft'||draftState==='Stale'?' · generated 21 November 2026, 09:50':` · published by Alex Morgan, 21 November 2026, ${running?'10:02':'09:55'} · ${zone}`}</p>${teams?'<p class="help">Each team is one entrant; lineups are chosen per match.</p>':''}</div><div class="row-actions">${actions}</div></section>`;
  const extra=is('schedule-stale')?notice('The field changed after this draft','Sam Reed was marked absent. Regenerate before publishing.','info','<p class="help" id="stale-why">A stale draft cannot be published.</p>'):is('schedule-crossed')?notice('The field changed since publication','Sam Reed was cancelled just before the schedule locked the field. The published pairings still include Sam Reed. Withdraw, regenerate and publish again.','danger'):is('schedule-conflict')?notice('This schedule changed elsewhere','Nothing changed with this request. Reload the latest schedule before trying again.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`):is('schedule-withdrawn')?notice('Revision 1 withdrawn','Its pairings are back as the draft. Review and publish again.'):running?notice('Running','The competition started on revision 2. The schedule can no longer be withdrawn or regenerated.'):'';
  const history=is('schedule-withdrawn','schedule-running')?`<details class="fl-history" open><summary>Publication history</summary><ul><li><strong>Revision 1</strong><p class="help">Published 21 November 2026, 09:55 · withdrawn 21 November 2026, 09:58 by Alex Morgan · Reason: Late absence reported</p></li>${running?'<li><strong>Revision 2</strong><p class="help">Published 21 November 2026, 10:02 · current</p></li>':''}</ul></details>`:'';
  return `<div class="column">${top}${extra}${rounds(field)}${history}</div>`;
}

// Configuration page: Registration and Competition panels.
function conditions(){
  const blocked=is('start-blocked'),roster=is('start-blocked-rosters');
  const list=[['Registration closed',!blocked,'Close registration above.'],['No entry pending check-in',!blocked,blocked?'2 entries pending.':'Every admitted entry is checked in.','?state=absence-review'],['At least two eligible entrants',true,blocked?'3 eligible.':'4 eligible.'],['Schedule published and current',!blocked,blocked?'No schedule published.':'Revision 1, built from the current field.','?state=schedule-published']];
  if(teams)list.push(['Rosters within 3–5 players',!roster,roster?'Harbour Lights has 2 players (minimum 3).':'Every admitted team.','?state=start-blocked-rosters']);
  return `<ul class="sp-checks">${list.map(([t,ok,h,href])=>`<li>${label(ok?'Met':'Not met',ok?'confirmed':'')}<div><strong>${t}</strong><p class="help">${h}${!ok&&href?` <a href="${href}">Fix it</a>`:''}</p></div></li>`).join('')}</ul>${roster?'<p class="help">Warning, not a blocker: River Falcons and North Stars both have a member named “Alex Kim”.</p>':''}`;
}
function configuration(){
  const registration=`<section class="fl-panel registration"><h2>Registration</h2><p><strong>Registration closed</strong></p><p>Closed 20 November 2026, 18:00 · ${zone}</p>${running?'':button('Reopen registration','explain','',published?'disabled aria-describedby="reopen-why"':'')}${published&&!running?'<p class="help" id="reopen-why">The schedule is published. Withdraw it before reopening registration.</p>':''}</section>`;
  if(is('reopen-locked'))return `<div class="column">${registration}</div>`;
  const ready=!is('start-blocked','start-blocked-rosters');
  let body;
  if(running)body=`<p><strong>Running</strong></p><p>Started by Alex Morgan, 21 November 2026, 10:05 · ${zone}</p><p class="help">Fixed at start: 4 entrants, schedule revision 2, team rosters. No match has started.</p>${is('start-crossed')?notice('A roster changed during the start','Harbour Lights removed a member just before the start reached its roster. Its frozen roster has 2 players (minimum 3). Nothing was repaired; resolve it from the round operations.','danger'):''}`;
  else body=`${conditions()}${is('starting')?'<p class="help" role="status">Starting. Please wait; do not submit again.</p>':''}${is('start-conflict')?notice('This tournament changed elsewhere','Nothing changed with this request. Reload the latest readiness before starting.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`):''}<div class="actions">${button(is('starting')?'Starting…':'Start competition','start','primary',ready&&!is('starting','start-conflict')?'':'disabled aria-describedby="start-why"')}</div>${ready?'':`<p class="help" id="start-why">${is('start-blocked')?'Registration is still open.':'Harbour Lights’ roster is below the minimum.'}</p>`}`;
  return `<div class="column">${registration}<section class="fl-panel" aria-labelledby="competition-heading"><h2 id="competition-heading">Competition</h2>${body}</section></div>`;
}

function render(){
  const content=page==='Entries'?entries():page==='Schedule'?schedule():configuration();
  const prefix=page==='Entries'?'Entries · ':page==='Schedule'?'Schedule · ':'';
  document.querySelector('#surface').innerHTML=`<div class="fl-shell"><aside class="fl-rail"><a class="brand" href="access-states.html?state=one-organisation">HERALD<span>.</span></a><div class="fl-context"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">${icon('switch')}Switch organisation</a></div><nav class="fl-nav" aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="entries-states.html?state=list-with-entries" aria-current="page">Tournaments</a></nav></aside><main id="main" class="fl-page" tabindex="-1"><header class="fl-top"><span>Organiser workspace</span><div class="fl-account">${button('Alex Morgan'+icon('down'),'explain')}</div></header><div class="fl-content">${heading(prefix)}${content}</div></main></div>`;
  if(is('mark-absent-confirm'))confirmDialog('Mark Sam Reed absent?','Sam Reed’s entry will be cancelled with the cause “absent at start”. This cannot be undone; the freed slot admits nobody automatically.','Mark absent','marked-absent');
  if(is('withdraw-confirm'))confirmDialog('Withdraw revision 1?','The revision stays in the history and its pairings return as the draft. The field unlocks.','Withdraw','schedule-withdrawn',true);
  if(is('start-confirm'))confirmDialog('Start the competition?','Start fixes the 4 entrants, schedule revision 1 and the team rosters. It cannot be undone. No match starts by itself.','Start competition','started');
  if(is('marked-absent'))toast('Sam Reed marked absent.');
}
function toast(text){const t=document.createElement('section');t.className='check-toasts';t.setAttribute('aria-label','Notifications');t.innerHTML=`<div class="check-toast">${icon('ok')}<p role="status">${text}</p></div>`;document.body.append(t);}
function confirmDialog(heading,text,action,next,reason=false){const d=document.createElement('dialog');d.className='fl-modal';d.setAttribute('aria-labelledby','dialog-heading');d.innerHTML=`<h2 id="dialog-heading" tabindex="-1">${heading}</h2><p>${text}</p>${reason?'<div class="fl-field"><label for="reason">Reason (required)</label><textarea id="reason" maxlength="500" aria-describedby="reason-help"></textarea><p class="help" id="reason-help">Private to the organisation. At most 500 characters.</p></div>':''}<div class="actions"><a class="button primary" href="?state=${next}">${action}</a>${button('Keep as it is','close')}</div>`;document.body.append(d);d.showModal();d.querySelector('h2').focus();}
document.querySelector('#state-links').innerHTML=Object.entries(groups).map(([g,keys])=>`<strong>${g}</strong>${keys.map(key=>`<a href="?state=${key}" ${key===state?'aria-current="page"':''}>${key.replaceAll('-',' ')}</a>`).join('')}`).join('');
render();
document.addEventListener('click',e=>{const c=e.target.closest('[data-action]');if(!c||c.disabled)return;const a=c.dataset.action;
  if(a==='close'){document.querySelector('dialog')?.remove();return;}
  const go={absent:'mark-absent-confirm',withdraw:'withdraw-confirm',start:'start-confirm',generate:'schedule-draft',publish:'schedule-published'}[a];
  if(go){location.search=`?state=${go}`;return;}
  const m=document.createElement('p');m.className='help';m.setAttribute('role','status');m.textContent='This action belongs to an existing review surface. No request is sent.';c.parentElement.append(m);});
})();
