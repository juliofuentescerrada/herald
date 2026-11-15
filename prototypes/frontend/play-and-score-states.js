// Deterministic documentation fixtures for H1 batch 2 (lineups, results, outcomes, standings, operations). No API, storage or live clock.
(() => {
'use strict';
const groups={
  Schedule:['schedule-running-matches','schedule-results','schedule-exceptional','operations-running','operations-attention','round-completed','withdraw-confirm','withdrawn','disqualify-confirm','disqualified','all-departed','roster-running','sanction-confirm','player-sanctioned','player-withdrawn'],
  'Match (lineups)':['match-individual-scheduled','match-individual-in-play','lineup-empty','lineup-incomplete','lineup-ready','start-match-confirm','match-starting','match-team-in-play','lineup-conflict','match-load-failed','start-blocked-unavailable','too-few-eligible'],
  'Match (results)':['result-empty','result-chosen','result-saving','result-win','result-draw','result-team-not-started','result-team','result-conflict'],
  'Match (outcomes)':['outcome-concession','outcome-absence','outcome-no-contest-missing-reason','outcome-team-play-not-started','resolved-concession','resolved-double-absence','resolved-no-contest'],
  Standings:['standings-before-start','standings-empty','standings-provisional','standings-explained','standings-teams','standings-updating','standings-load-failed','standings-flags'],
};
const states=Object.values(groups).flat();
const query=new URLSearchParams(location.search);
const state=states.includes(query.get('state'))?query.get('state'):'schedule-running-matches';
const group=Object.keys(groups).find(key=>groups[key].includes(state));
const page=group.startsWith('Match')?'Match':group;
document.body.dataset.state=state;
const zone='Europe/Madrid';
const is=(...keys)=>keys.includes(state);
const teamStates=['schedule-exceptional','operations-attention','disqualify-confirm','disqualified','roster-running','sanction-confirm','player-sanctioned','player-withdrawn','lineup-empty','lineup-incomplete','lineup-ready','start-match-confirm','match-starting','match-team-in-play','lineup-conflict','start-blocked-unavailable','too-few-eligible','result-team-not-started','result-team','outcome-team-play-not-started','resolved-no-contest','standings-teams'];
const teams=is(...teamStates);
const running=!is('standings-before-start');
const title=teams?'Saturday Team League':'Saturday Open';
const icon=(type='info')=>`<svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',error:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/>',ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',down:'<path d="m7 10 5 5 5-5"/>',switch:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>'})[type]}</svg>`;
const button=(label,action='',cls='',attrs='')=>`<button type="button" class="${cls}" ${action?`data-action="${action}"`:''} ${attrs}>${label}</button>`;
const notice=(heading,text,tone='info',extra='')=>`<section class="fl-notice ${tone}" role="${tone==='danger'?'alert':'status'}">${icon(tone==='danger'?'error':'info')}<div><strong>${heading}</strong><p>${text}</p>${extra}</div></section>`;
// Status badge: tone in words, colour and icon, never colour alone.
const badge=(text,tone='neutral',id='')=>`<span class="sp-badge ${tone}" ${id?`id="${id}"`:''}><svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({success:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',danger:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',pending:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',neutral:'<circle cx="12" cy="12" r="9"/>'})[tone]}</svg>${text}</span>`;
const when=(time)=>`<span class="sp-when">22 November 2026, ${time} · ${zone}</span>`;

// Fixtures: four players (circle method), four teams of seven with five active.
const P=['Robin Vale','Sam Reed','Jamie Brook','Taylor Finch'];
const T=['River Falcons','Harbour Lights','Meadow Foxes','North Stars'];
const names=teams?T:P;
const pairs=[[[0,3],[1,2]],[[0,2],[3,1]],[[0,1],[2,3]]];
const departed=is('withdrawn','all-departed','standings-flags')?(is('all-departed')?[0,1,2,3]:[1]):is('disqualified')?[1]:[];
// Each match's fixture state: [badge, tone, sentence].
function outcome(r,m){
  const [a,b]=pairs[r][m],A=names[a],B=names[b];
  const scheduled=['Scheduled','neutral',''];
  if(is('schedule-running-matches','operations-attention','roster-running','sanction-confirm','player-sanctioned','player-withdrawn','disqualify-confirm'))return r===0&&m===0?['In play','pending','Started '+when('10:20')]:scheduled;
  if(departed.includes(a)||departed.includes(b)){
    if(r===0)return ['Resolved','success',m===0?`${A} won`:'Draw'];
    if(departed.includes(a)&&departed.includes(b))return ['Resolved','success','Double absence · 0 each · no play recorded'];
    const gone=departed.includes(a)?A:B;
    return ['Resolved','success',`${gone} absent (${is('disqualified')?'disqualified':'withdrew'}) · ${gone===A?B:A} wins · no play recorded`];
  }
  if(is('schedule-exceptional')){if(r===0)return m===0?['Resolved','success',`${B} conceded before play · ${A} wins · no play recorded`]:['Resolved','success','Double absence · 0 each · no play recorded'];if(r===1&&m===0)return ['Resolved','success','No contest: Venue closed · play recorded'];return scheduled;}
  if(r===0)return ['Resolved','success',m===0?`${A} won`:'Draw'];
  if(is('schedule-results','standings-provisional','standings-explained','standings-updating','withdraw-confirm'))return r===1&&m===0?['Resolved','success',`${A} won`]:r===1?['In play','pending','Started '+when('11:05')]:scheduled;
  if(is('round-completed','operations-running'))return r===1&&m===0?['Resolved','success',`${A} won`]:r===1?(is('round-completed')?['Resolved','success',`${B} won`]:['In play','pending','Started '+when('11:05')]):scheduled;
  return scheduled;
}
const roundState=r=>{const s=pairs[r].map((_,m)=>outcome(r,m)[0]);return s.every(x=>x==='Resolved')?['Completed','success']:s.some(x=>x!=='Scheduled')?['Running','pending']:['Not started','neutral'];};

const lifecycle=()=>`<div class="labels" aria-label="Tournament lifecycle"><span>Published</span><span>Registration closed</span><span>${running?'Running':'Preparing'}</span></div>`;
function heading(prefix,extra=''){return `<header class="fl-heading"><a class="back" href="?state=schedule-running-matches">Back to schedule</a><div class="title"><h1>${prefix}${title}</h1>${lifecycle()}${extra}</div><nav class="sp-tabs" aria-label="Tournament"><a href="start-and-pair-states.html?state=started">Configuration</a><a href="start-and-pair-states.html?state=entries-running">Entries</a><a href="?state=schedule-running-matches" ${page!=='Standings'?'aria-current="page"':''}>Schedule</a><a href="?state=standings-provisional" ${page==='Standings'?'aria-current="page"':''}>Standings</a></nav></header>`;}

// Schedule page: operations summary, rounds, entrants.
function schedule(){
  const all=pairs.flatMap((ms,r)=>ms.map((_,m)=>outcome(r,m)[0]));
  const count=k=>all.filter(x=>x===k).length;
  const attention=is('operations-attention','player-sanctioned')?`<h3>Needs attention</h3><ul class="fl-rows"><li><div><strong><a href="?state=start-blocked-unavailable">Round 2 · River Falcons vs Meadow Foxes</a></strong><p class="help">River Falcons’ lineup includes Casey Moss, who is sanctioned. Revise the lineup before starting.</p></div>${badge('Blocked','danger')}</li></ul>`:'';
  const summary=`<section class="fl-panel" aria-labelledby="ops-heading"><h2 id="ops-heading">Operations</h2><div class="ps-stats">${badge(`${count('Scheduled')} scheduled`,'neutral')}${badge(`${count('In play')} in play`,'pending')}${badge(`${count('Resolved')} of 6 resolved`,'success')}</div><ul class="ps-rounds">${pairs.map((_,r)=>{const [s,t]=roundState(r);return `<li><span>Round ${r+1}</span>${badge(s,t)}</li>`;}).join('')}</ul>${attention}${is('all-departed')?notice('No active entrant','Every remaining match was resolved by the withdrawals. The competition stays running until it is finalised; no active champion will be declared.'):''}</section>`;
  const roundsHtml=pairs.map((ms,r)=>`<section class="fl-group sp-round"><div class="sp-title"><h3>Round ${r+1}</h3>${badge(...roundState(r))}</div><ul class="fl-rows">${ms.map(([a,b],m)=>{const [s,t,o]=outcome(r,m);return `<li class="ps-match"><span class="home"><a href="?state=${teams?'lineup-empty':'result-empty'}">${names[a]}</a></span><span class="vs">vs</span><span>${names[b]}</span>${badge(s,t)}${o?`<p class="ps-outcome">${o}</p>`:''}</li>`;}).join('')}</ul></section>`).join('');
  const entrants=`<section class="fl-panel" aria-labelledby="entrants-heading"><h2 id="entrants-heading">Entrants</h2><ul class="fl-rows">${names.map((n,i)=>{const gone=departed.includes(i);const status=gone?(is('disqualified')?'Disqualified':'Withdrawn'):'Active';return `<li><div class="team-identity"><h3>${n}</h3>${badge(status,gone?'danger':'success')}</div>${gone?`<p class="help">${status} ${when('11:30')} · reason kept privately</p>`:`<div class="row-actions">${teams?button('Frozen roster','roster'):''}${button('Withdraw','withdraw','',`aria-label="Withdraw ${n}"`)}${button('Disqualify','disqualify','',`aria-label="Disqualify ${n}"`)}</div>`}</li>`;}).join('')}</ul></section>`;
  const history=`<details class="fl-history"><summary>Publication history</summary><ul><li><strong>Revision 1</strong><p class="help">Published ${when('09:55')} · current · the competition started on it</p></li></ul></details>`;
  return `<div class="column">${summary}${roundsHtml}${entrants}${history}</div>`;
}

// Match page.
const rosters={'River Falcons':['Alex Kim','Casey Moss','Drew Lane','Eli Hart','Frankie Cole','Gale Ross','Harper Quinn'],'North Stars':['Indy Shaw','Jordan Pike','Kai Burns','Lee Marsh','Morgan Hale','Noor Webb','Oakley Dunn'],'Harbour Lights':['Uma Reyes','Vic Lowe','Parker Stone','Quinn Avery','Reese Fox','Skyler Bell','Toni Grant']};
const roster=team=>rosters[team];
function lineupPanel(side,team,selected,locked){
  const players=roster(team);
  const sanctioned=is('start-blocked-unavailable')&&side==='first'?['Casey Moss']:[];
  const withdrawn=is('too-few-eligible')&&side==='first'?['Casey Moss','Drew Lane','Eli Hart']:[];
  const ok=selected===5;
  if(locked)return `<section class="fl-panel" aria-labelledby="${side}-lineup"><div class="sp-title"><h2 id="${side}-lineup">${team} · lineup</h2>${badge('Locked','success')}</div><p class="help">Locked at match start, ${when('10:20')} · lineup revision 2</p><ul class="ps-players">${players.slice(0,5).map(p=>`<li>${p}</li>`).join('')}</ul><p class="help ps-locked">Reserves: ${players.slice(5).join(', ')}</p></section>`;
  return `<section class="fl-panel" aria-labelledby="${side}-lineup"><div class="sp-title"><h2 id="${side}-lineup">${team} · lineup</h2>${badge(`${selected} of 5 selected`,ok?'success':'danger',`${side}-count`)}</div><p class="help">Choose 5 players from the frozen roster (revision 3, frozen ${when('10:05')}). Unselected players are reserves.</p><fieldset class="ps-choice"><legend>Players</legend><ul class="ps-players">${players.map((p,i)=>{const off=sanctioned.includes(p)||withdrawn.includes(p);return `<li><label><input type="checkbox" ${i<selected?'checked':''} ${withdrawn.includes(p)?'disabled':''} aria-describedby="${side}-count"> ${p}</label>${off?`<span class="help">${sanctioned.includes(p)?'Sanctioned':'Withdrawn'}</span>`:''}</li>`;}).join('')}</ul></fieldset><div class="actions">${button('Save lineup','save')}</div>${selected?`<details class="fl-history"><summary>Lineup history</summary><ul><li><strong>Revision ${selected===5?2:1}</strong><p class="help">Saved by Alex Morgan, ${when(selected===5?'10:12':'10:08')}</p></li></ul></details>`:''}</section>`;
}
function resultPanel(){
  const [A,B]=teams?['River Falcons','North Stars']:['Sam Reed','Jamie Brook'];
  const resolved={'result-win':`${A} won · played`,'result-draw':'Draw · played','result-team':`${A} won · played · appearances recorded for both locked lineups`,'resolved-concession':`${B} conceded before play · ${A} wins · no play recorded`,'resolved-double-absence':'Both were absent · double absence · 0 each · no play recorded','resolved-no-contest':'No contest · 0 each · play recorded · Reason: Venue closed'}[state];
  if(resolved)return `<section class="fl-panel" aria-labelledby="result-heading"><div class="sp-title"><h2 id="result-heading">Result</h2>${badge('Resolved','success')}</div><p><strong>${resolved}</strong></p><p class="help">Recorded by Alex Morgan, ${when('10:40')}. Corrections come later.</p></section>`;
  const causeFirst=group==='Match (outcomes)';
  const cause=is('outcome-concession','outcome-team-play-not-started')?'Concession':is('outcome-absence')?'Absence':is('outcome-no-contest-missing-reason')?'No contest':'';
  const radios=(legend,opts,checked,id)=>`<fieldset class="ps-choice"><legend>${legend}</legend>${opts.map(o=>`<label><input type="radio" name="${id}" ${o===checked?'checked':''} ${is('result-saving')?'disabled':''}> ${o}</label>`).join('')}</fieldset>`;
  let fields='';
  if(causeFirst){
    fields+=radios('What happened?',['Played','Concession','Absence','No contest'],cause,'cause');
    if(cause==='Concession')fields+=radios('Who conceded?',[A,B],B,'who')+radios('Did play take place?',['Yes','No'],is('outcome-team-play-not-started')?'Yes':'No','play');
    if(cause==='Absence')fields+=radios('Who was absent?',[A,B,'Both were absent'],'Both were absent','absent');
    if(cause==='No contest')fields+=`<div class="fl-field"><label for="reason">Reason (required)</label><textarea id="reason" maxlength="500" aria-describedby="reason-help reason-error" aria-invalid="true"></textarea><p class="help" id="reason-help">Private to the organisation. At most 500 characters.</p><p class="error" id="reason-error">Give a reason for the no contest.</p></div>`+radios('Did play take place?',['Yes','No'],'','play');
  }else fields+=radios('Outcome',[`${A} wins`,'Draw',`${B} wins`],is('result-chosen','result-saving','result-conflict')?`${A} wins`:'','outcome');
  const notStarted=is('result-team-not-started');
  const complete=is('result-chosen','outcome-concession','outcome-absence');
  const help=!teams&&is('result-empty','result-chosen')?'<p class="help">This match has not started: recording a played result also starts it.</p>':'';
  const blocker=notStarted?notice('Start the match first','A played team result needs both lineups locked, and they lock at match start.','info',`<div class="actions"><a class="button" href="?state=lineup-ready">Go to lineups</a></div>`):is('outcome-team-play-not-started')?notice('Start the match first','An administrative outcome cannot record play on a team match that has not started. Choose “No”, or start the match.','danger'):is('result-conflict')?notice('This match changed elsewhere','Nothing changed with this request. Reload the match before trying again; your choice is kept.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`):'';
  return `<section class="fl-panel" aria-labelledby="result-heading"><h2 id="result-heading">Result</h2>${help}${notStarted?'':fields}${blocker}${is('result-saving')?'<p class="help" role="status">Recording. Please wait; do not submit again.</p>':''}${notStarted?'':`<div class="actions">${button(is('result-saving')?'Recording…':'Record result','record','primary',complete?'':'disabled aria-describedby="result-why"')}</div>${complete?'':`<p class="help" id="result-why">${is('outcome-no-contest-missing-reason')?'A no contest needs a reason.':'Choose what happened first.'}</p>`}`}</section>`;
}
function match(){
  if(is('match-load-failed'))return `<div class="column">${notice('The match could not be loaded','The request failed. Nothing changed.','danger',`<div class="actions">${button('Try again','explain')}</div>`)}</div>`;
  const [A,B]=teams?['River Falcons','North Stars']:['Sam Reed','Jamie Brook'];
  const inPlay=is('match-individual-in-play','match-team-in-play','result-team','resolved-no-contest','outcome-team-play-not-started')&&!is('outcome-team-play-not-started');
  const resolved=is('result-win','result-draw','result-team','resolved-concession','resolved-double-absence','resolved-no-contest');
  const top=`<section class="fl-summary"><div><div class="sp-title"><h2>Round 1 · ${A} vs ${B}</h2>${badge(resolved?'Resolved':inPlay||is('match-starting')?(is('match-starting')?'Starting':'In play'):'Scheduled',resolved?'success':inPlay||is('match-starting')?'pending':'neutral')}</div><p class="help">${teams?'Direct team match · 5 active players per side':'Individual match'} · single round-robin</p></div>${!teams&&is('match-individual-scheduled')?`<div class="row-actions">${button('Start match','explain','primary')}</div>`:''}</section>`;
  if(!teams)return `<div class="column">${top}${is('match-individual-in-play')?notice('In play',`Started by Alex Morgan, ${when('10:20')}.`):''}${resultPanel()}</div>`;
  const lineups=is('lineup-empty')?[0,0]:is('lineup-incomplete')?[5,4]:[5,5];
  const locked=inPlay||resolved&&!is('resolved-concession','resolved-double-absence');
  const lineupGroup=group==='Match (lineups)';
  const startBlocker=is('lineup-empty')?'River Falcons and North Stars have no lineup.':is('lineup-incomplete')?'North Stars has 4 of 5 players.':is('start-blocked-unavailable')?'River Falcons’ lineup includes Casey Moss, who is sanctioned.':is('too-few-eligible')?'River Falcons has 4 eligible players; 5 are required.':'';
  const start=locked||resolved?'':`<section class="fl-panel"><h2>Start</h2><p class="help">Starting validates both lineups and locks them. No player is substituted.</p>${startBlocker?`<p class="help" id="start-why">${startBlocker}</p>`:''}${is('too-few-eligible')?notice('Too few eligible players','River Falcons cannot field 5 players: 3 are withdrawn. Record an absence or a concession when the owner decides; the team is not withdrawn automatically.','info',`<div class="actions"><a class="button" href="?state=outcome-absence">Record an outcome</a></div>`):''}${is('lineup-conflict')?notice('This lineup changed elsewhere','Nothing changed with this request. Reload the match; your selection is kept for copying.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`):''}${is('match-starting')?'<p class="help" role="status">Starting. Please wait; do not submit again.</p>':''}<div class="actions">${button(is('match-starting')?'Starting…':'Start match','startmatch','primary',startBlocker||is('match-starting','lineup-conflict')?`disabled ${startBlocker?'aria-describedby="start-why"':''}`:'')}</div></section>`;
  const panels=lineupGroup||locked?`${lineupPanel('first',A,lineups[0],locked)}${lineupPanel('second',B,lineups[1],locked)}`:'';
  return `<div class="column">${top}${panels}${start}${lineupGroup&&!locked?'':resultPanel()}</div>`;
}

// Standings page.
function standings(){
  if(is('standings-before-start'))return `<div class="column">${notice('Standings begin when the competition starts','Nothing is ranked before start.')}</div>`;
  if(is('standings-load-failed'))return `<div class="column">${notice('The standings could not be loaded','The request failed. Nothing changed.','danger',`<div class="actions">${button('Try again','explain')}</div>`)}</div>`;
  const rows=is('standings-empty')?names.map(n=>[n,0,0,0,0,0]):is('standings-flags')?[['Robin Vale',2,2,0,0,6],['Taylor Finch',2,1,0,1,3],['Jamie Brook',1,0,1,0,1],['Sam Reed',3,0,1,2,1]]:teams?[['River Falcons',2,2,0,0,6],['Harbour Lights',2,0,1,1,1],['Meadow Foxes',2,0,1,1,1],['North Stars',2,0,0,2,0]]:[['Robin Vale',2,2,0,0,6],['Jamie Brook',2,0,1,1,1],['Sam Reed',1,0,1,0,1],['Taylor Finch',1,0,0,1,0]];
  const resolvedCount=is('standings-empty')?0:is('standings-flags')?4:teams?4:3;
  let pos=0,prev=null;const ranked=rows.map((r,i)=>{if(r[5]!==prev){pos=i+1;prev=r[5];}return [pos,...r];});
  const shared=p=>ranked.filter(r=>r[0]===p).length>1;
  const explain=`<tr class="ps-explain"><td colspan="7"><ul><li>Round 1 · vs Jamie Brook · draw · played · 1 point</li><li>Round 2 · vs Taylor Finch · in play · counts nothing yet</li><li>Round 3 · vs Robin Vale · scheduled</li></ul><p class="help">Total: 1 point</p></td></tr>`;
  const table=`<table class="ps-table" aria-label="Standings"><thead><tr><th scope="col">Position</th><th scope="col">${teams?'Team':'Player'}</th><th scope="col" class="num wide">Resolved</th><th scope="col" class="num wide">Won</th><th scope="col" class="num wide">Drawn</th><th scope="col" class="num wide">Lost</th><th scope="col" class="pts">Points</th></tr></thead><tbody>${ranked.map(([p,n,res,w,d,l,pts])=>`<tr><td><span aria-label="Position ${p}${shared(p)?', shared':''}">${p}${shared(p)?'=':''}</span></td><td><button type="button" class="link" data-action="explain-row" aria-expanded="${is('standings-explained')&&n==='Sam Reed'}">${n}</button>${is('standings-flags')&&n==='Sam Reed'?' '+badge('Withdrawn','danger'):''}</td><td class="num wide">${res}</td><td class="num wide">${w}</td><td class="num wide">${d}</td><td class="num wide">${l}</td><td class="pts">${pts}</td></tr>${is('standings-explained')&&n==='Sam Reed'?explain:''}`).join('')}</tbody></table>`;
  return `<div class="column"><section class="fl-summary"><div><p><strong>Provisional · ${resolvedCount} of 6 matches resolved</strong></p><p class="help">Results revision ${resolvedCount+2} · 3 points a win, 1 a draw · equal points share a position, listed by name${is('standings-empty')?' · No match resolved yet':''}</p></div></section>${table}</div>`;
}

function render(){
  const prefix={Schedule:'Schedule · ',Match:'Match · ',Standings:'Standings · '}[page];
  const extra=is('standings-updating')?badge('Updating','pending'):page==='Standings'&&running?badge('Provisional','pending'):'';
  const content=page==='Schedule'?schedule():page==='Match'?match():standings();
  document.querySelector('#surface').innerHTML=`<div class="fl-shell"><aside class="fl-rail"><a class="brand" href="access-states.html?state=one-organisation">HERALD<span>.</span></a><div class="fl-context"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">${icon('switch')}Switch organisation</a></div><nav class="fl-nav" aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="entries-states.html?state=list-with-entries" aria-current="page">Tournaments</a></nav></aside><main id="main" class="fl-page" tabindex="-1"><header class="fl-top"><span>Organiser workspace</span><div class="fl-account">${button('Alex Morgan'+icon('down'),'explain')}</div></header><div class="fl-content">${heading(prefix,extra)}${content}</div></main></div>`;
  if(is('start-match-confirm'))confirmDialog('Start this match?','Starting locks both lineups: River Falcons and North Stars with 5 players each. Lineups cannot change once the match is in play.','Start match','match-team-in-play');
  if(is('withdraw-confirm'))confirmDialog('Withdraw Sam Reed?','Sam Reed’s played results stay. 2 unplayed matches will be resolved as Sam Reed’s absence, each opponent winning. This cannot be undone.','Withdraw','withdrawn',true);
  if(is('disqualify-confirm'))confirmDialog('Disqualify Harbour Lights?','Its played results stay. 2 unplayed matches will be resolved as its absence; its match in play becomes its concession after play. This cannot be undone.','Disqualify','disqualified',true);
  if(is('roster-running','sanction-confirm','player-sanctioned','player-withdrawn'))rosterDialog();
  if(is('result-win','result-draw','withdrawn'))toast(is('withdrawn')?'Sam Reed withdrawn. 2 matches resolved.':'Result recorded.');
}
function rosterDialog(){
  const d=document.createElement('dialog');d.className='fl-modal';d.setAttribute('aria-labelledby','dialog-heading');
  const status=p=>is('player-sanctioned','sanction-confirm')&&p==='Casey Moss'&&!is('sanction-confirm')?['Sanctioned','danger','Reason: Abusive conduct · since 22 November 2026, 11:10']:is('player-withdrawn')&&p==='Drew Lane'?['Withdrawn','danger','Withdrawn from the tournament 22 November 2026, 11:12 · final']:['Available','success',''];
  const sanctionForm=is('sanction-confirm')?`<section class="fl-panel"><h3>Sanction Casey Moss</h3><p>Casey Moss stays on the frozen roster and cannot be chosen for a lineup until the sanction is lifted. Played appearances stay.</p><div class="fl-field"><label for="sreason">Reason (required)</label><textarea id="sreason" maxlength="500" aria-describedby="sreason-help"></textarea><p class="help" id="sreason-help">Private to the organisation. At most 500 characters.</p></div><div class="actions"><a class="button primary danger" href="?state=player-sanctioned">Sanction</a>${button('Keep as it is','close')}</div></section>`:'';
  d.innerHTML=`<h2 id="dialog-heading" tabindex="-1">River Falcons · frozen roster</h2><p class="help">Revision 3, frozen at start ${when('10:05')}. No player can be added.</p>${sanctionForm}<ul class="fl-rows">${roster('River Falcons').map(p=>{const [s,t,h]=status(p);return `<li><div><div class="team-identity"><strong>${p}</strong>${badge(s,t)}</div>${h?`<p class="help">${h}</p>`:''}</div><div class="row-actions">${s==='Sanctioned'?button('Lift sanction','explain'):s==='Available'?`${button('Withdraw player','explain','',`aria-label="Withdraw ${p}"`)}${button('Sanction','sanction','',`aria-label="Sanction ${p}"`)}`:''}</div></li>`;}).join('')}</ul><div class="actions">${button('Close','close')}</div>`;
  document.body.append(d);d.showModal();d.querySelector('h2').focus();
}
function toast(text){const t=document.createElement('section');t.className='check-toasts';t.setAttribute('aria-label','Notifications');t.innerHTML=`<div class="check-toast">${icon('ok')}<p role="status">${text}</p></div>`;document.body.append(t);}
function confirmDialog(heading,text,action,next,reason=false){const d=document.createElement('dialog');d.className='fl-modal';d.setAttribute('aria-labelledby','dialog-heading');d.innerHTML=`<h2 id="dialog-heading" tabindex="-1">${heading}</h2><p>${text}</p>${reason?'<div class="fl-field"><label for="reason">Reason (required)</label><textarea id="reason" maxlength="500" aria-describedby="reason-help"></textarea><p class="help" id="reason-help">Private to the organisation. At most 500 characters.</p></div>':''}<div class="actions"><a class="button primary${reason?' danger':''}" href="?state=${next}">${action}</a>${button('Keep as it is','close')}</div>`;document.body.append(d);d.showModal();d.querySelector('h2').focus();}
document.querySelector('#state-links').innerHTML=Object.entries(groups).map(([g,keys])=>`<strong>${g}</strong>${keys.map(key=>`<a href="?state=${key}" ${key===state?'aria-current="page"':''}>${key.replaceAll('-',' ')}</a>`).join('')}`).join('');
render();
document.addEventListener('click',e=>{const c=e.target.closest('[data-action]');if(!c||c.disabled)return;const a=c.dataset.action;
  if(a==='close'){document.querySelector('dialog')?.remove();return;}
  const go={withdraw:'withdraw-confirm',disqualify:'disqualify-confirm',roster:'roster-running',sanction:'sanction-confirm',startmatch:'start-match-confirm',record:'result-win','explain-row':'standings-explained'}[a];
  if(go){location.search=`?state=${go}`;return;}
  const m=document.createElement('p');m.className='help';m.setAttribute('role','status');m.textContent='This action belongs to an existing review surface. No request is sent.';c.parentElement.append(m);});
})();
