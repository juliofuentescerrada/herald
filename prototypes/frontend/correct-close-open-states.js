// Deterministic documentation fixtures for H1 batch 3 (corrections, finalisation, cancellation and dates, change log,
// public page, pilot access). No API, storage or live clock.
(() => {
'use strict';
const groups={
  'Match (corrections)':['correct-resolved','correct-form','correct-impact','correct-stale','correct-conflict','correct-failed','corrected','correct-finalised'],
  Standings:['finalise-ready','finalise-unresolved','finalise-updating','finalise-stale','finalising','final','final-no-champion','reopen-confirm','reopened','standings-cancelled'],
  Configuration:['dates-dialog','dates-preview','dates-invalid','dates-after-start','cancel-before-start','cancel-after-start','cancelled','archive-ready','delete-draft','visibility-panel','visibility-to-private','visibility-preview'],
  'Tournament list':['list-archived-hidden','list-archived-shown'],
  Schedule:['schedule-cancelled'],
  'Change log':['log-populated','log-filtered','log-empty','log-load-failed'],
  'Public page':['public-before-start','public-schedule','public-running','public-explained','public-final','public-revised','public-cancelled','public-not-available'],
  Applications:['apps-empty','apps-list','apps-grant','apps-grant-errors','apps-revoke'],
};
const states=Object.values(groups).flat();
const query=new URLSearchParams(location.search);
const state=states.includes(query.get('state'))?query.get('state'):'correct-resolved';
const group=Object.keys(groups).find(key=>groups[key].includes(state));
document.body.dataset.state=state;
const zone='Europe/Madrid';
const is=(...keys)=>keys.includes(state);
const icon=(type='info')=>`<svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',error:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/>',ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',down:'<path d="m7 10 5 5 5-5"/>',switch:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',entry:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',schedule:'<rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M9 3v4m6-4v4"/>',tournament:'<path d="M5 21V4h11l-2 4 2 4H5"/>',results:'<path d="M7 4h10v5a5 5 0 0 1-10 0zM12 14v4m-4 3h8"/>'})[type]}</svg>`;
const button=(label,action='',cls='',attrs='')=>`<button type="button" class="${cls}" ${action?`data-action="${action}"`:''} ${attrs}>${label}</button>`;
const link=(label,target,cls='button')=>`<a class="${cls}" href="?state=${target}">${label}</a>`;
const notice=(heading,text,tone='info',extra='')=>`<section class="fl-notice ${tone}" role="${tone==='danger'?'alert':'status'}">${icon(tone==='danger'?'error':'info')}<div><strong>${heading}</strong><p>${text}</p>${extra}</div></section>`;
// Status badge: tone in words, colour and icon, never colour alone.
const badge=(text,tone='neutral')=>`<span class="sp-badge ${tone}"><svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({success:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',danger:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',pending:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',neutral:'<circle cx="12" cy="12" r="9"/>'})[tone]}</svg>${text}</span>`;
const when=(time,day=22)=>`<span class="sp-when">${day} November 2026, ${time} · ${zone}</span>`;
const field=(id,label,help,value='',error='')=>`<div class="fl-field"><label for="${id}">${label}</label><textarea id="${id}" maxlength="500" aria-describedby="${id}-help${error?` ${id}-error`:''}" ${error?'aria-invalid="true"':''}>${value}</textarea><p class="help" id="${id}-help">${help}</p>${error?`<p class="error" id="${id}-error">${error}</p>`:''}</div>`;
const reasonHelp='Private to the organisation. At most 500 characters.';

// Fixtures: four players, six matches; Robin Vale beat Sam Reed in round 1 (the corrected result).
const P=['Robin Vale','Sam Reed','Jamie Brook','Taylor Finch'];
const pairs=[[[0,1],[2,3]],[[0,2],[3,1]],[[0,3],[1,2]]];
const cancelled=is('cancel-after-start','cancelled','standings-cancelled','schedule-cancelled','archive-ready','public-cancelled','list-archived-shown');
const finalised=is('correct-finalised','final','final-no-champion','reopen-confirm','public-final','public-revised');
const preparing=is('dates-dialog','dates-preview','dates-invalid','cancel-before-start','delete-draft','visibility-panel','visibility-to-private','visibility-preview','public-before-start','public-schedule','log-empty');
const draft=is('delete-draft');
const competition=draft?'Draft':cancelled?'Cancelled':finalised?'Finalised':preparing?'Preparing':'Running';
const title=is('delete-draft')?'Winter Cup (draft)':'Saturday Open';
const lifecycle=()=>`<div class="labels" aria-label="Tournament lifecycle">${draft?'<span>Draft</span>':`<span>Published</span><span>Registration ${is('dates-dialog','dates-preview','dates-invalid','cancel-before-start','public-before-start')?'open':'closed'}</span><span>${competition}</span>${is('archive-ready')&&false?'<span>Archived</span>':''}`}</div>`;

const tabs=[['Configuration','dates-after-start'],['Entries',''],['Schedule','schedule-cancelled'],['Standings','finalise-ready'],['Change log','log-populated']];
const tabFor={Configuration:'Configuration',Schedule:'Schedule',Standings:'Standings','Change log':'Change log','Match (corrections)':'Schedule'};
function heading(prefix,extra=''){const current=tabFor[group];return `<header class="fl-heading"><a class="back" href="?state=list-archived-hidden">Back to tournaments</a><div class="title"><h1>${prefix}${title}</h1>${lifecycle()}${extra}</div>${draft?'':`<nav class="sp-tabs" aria-label="Tournament">${tabs.map(([t,s])=>`<a href="${s?`?state=${s}`:'play-and-score-states.html?state=schedule-results'}" ${t===current?'aria-current="page"':''}>${t}</a>`).join('')}</nav>`}</header>`;}
function shell(content,nav='Tournaments'){return `<div class="fl-shell"><aside class="fl-rail"><a class="brand" href="access-states.html?state=one-organisation">HERALD<span>.</span></a><div class="fl-context"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">${icon('switch')}Switch organisation</a></div><nav class="fl-nav" aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="?state=list-archived-hidden" ${nav==='Tournaments'?'aria-current="page"':''}>Tournaments</a><a href="?state=apps-list" ${nav==='Applications'?'aria-current="page"':''}>Applications</a></nav></aside><main id="main" class="fl-page" tabindex="-1"><header class="fl-top"><span>Organiser workspace</span><div class="fl-account">${button('Alex Morgan'+icon('down'),'explain')}</div></header><div class="fl-content">${content}</div></main></div>`;}

// Match page: correcting Robin Vale's win over Sam Reed.
function matchPage(){
  const top=`<section class="fl-summary"><div><div class="sp-title"><h2>Round 1 · Robin Vale vs Sam Reed</h2>${badge('Resolved','success')}${is('corrected')?badge('Corrected','pending'):''}</div><p class="help">Individual match · single round-robin</p></div></section>`;
  const current=is('corrected')?'Draw · played':'Robin Vale won · played';
  const history=is('corrected')?`<details class="fl-history" open><summary>Result history</summary><ul><li><strong>Robin Vale won · played</strong><p class="help">Recorded by Alex Morgan, ${when('10:40')} · replaced by Alex Morgan, ${when('12:05')} · Reason: Score sheet misread</p></li></ul></details>`:'';
  if(is('correct-resolved','corrected','correct-finalised'))return `<div class="column">${top}<section class="fl-panel" aria-labelledby="result-heading"><div class="sp-title"><h2 id="result-heading">Result</h2></div><p><strong>${current}</strong></p><p class="help">${is('corrected')?`Corrected by Alex Morgan, ${when('12:05')}`:`Recorded by Alex Morgan, ${when('10:40')}`}</p>${is('correct-finalised')?notice('The competition is finalised','Results cannot change. Reopen the competition with a reason first, from the Standings page.','info',`<div class="actions">${link('Go to standings','final')}</div>`):`<div class="actions">${link('Correct result','correct-form','button')}</div>`}${history}</section></div>`;
  const radios=(legend,opts,checked,id,disabled=false)=>`<fieldset class="ps-choice"><legend>${legend}</legend>${opts.map(o=>`<label><input type="radio" name="${id}" ${o===checked?'checked':''} ${disabled?'disabled':''}> ${o}</label>`).join('')}</fieldset>`;
  const locked=is('correct-impact','correct-stale');
  const form=`<section class="fl-panel" aria-labelledby="correct-heading"><h2 id="correct-heading">Correct result</h2><p class="help">Current result: Robin Vale won · played. Play was recorded, so the correction can be a played result, a concession after play or a no contest after play.</p>${radios('What happened?',['Played','Concession after play','No contest after play'],'Played','cause',locked)}${radios('Outcome',['Robin Vale wins','Draw','Sam Reed wins'],is('correct-form')?'':'Draw','outcome',locked)}${field('reason','Reason for the correction (required)',reasonHelp,is('correct-form')?'':'Score sheet misread')}${locked?'':`<div class="actions">${link('Review impact','correct-impact','button primary')}${button('Cancel','explain')}</div>`}</section>`;
  const impact=`<section class="fl-panel" aria-labelledby="impact-heading"><h2 id="impact-heading">Impact of this correction</h2><div class="cco-compare"><div><h3>Now</h3><p>Robin Vale won · played</p></div><div><h3>After the correction</h3><p>Draw · played · appearances unchanged</p></div></div><table class="ps-table" aria-label="Points and positions"><thead><tr><th scope="col">Player</th><th scope="col" class="pts">Points</th><th scope="col" class="pts">Position</th></tr></thead><tbody><tr><td>Robin Vale</td><td class="pts">6 → 4</td><td class="pts">1 → 1</td></tr><tr><td>Sam Reed</td><td class="pts">1 → 2</td><td class="pts">4 → 3=</td></tr><tr><td>Taylor Finch</td><td class="pts">2 → 2</td><td class="pts">3 → 3=</td></tr></tbody></table><p class="help">Based on results revision 9. No published pairing depends on this result.</p>${is('correct-stale')?notice('The standings are updating','Results changed after this preview (now revision 10). Nothing was applied. Review the impact again.','danger',`<div class="actions">${link('Review again','correct-impact')}</div>`):`<div class="actions">${link('Apply correction','corrected','button primary')}${link('Edit correction','correct-form')}</div>`}</section>`;
  const failure=is('correct-conflict')?notice('This match changed elsewhere','Nothing changed with this request. Reload the match and review the impact again; your correction and reason are kept.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`):is('correct-failed')?notice('The correction could not be saved','The request failed and nothing changed. Your input is kept; try again.','danger',`<div class="actions">${button('Try again','explain')}</div>`):'';
  return `<div class="column">${top}${form}${locked?impact:''}${failure}</div>`;
}

// Standings page: review barrier, final, reopened, cancelled.
function standingsPage(){
  const rows=is('final-no-champion')?[['Robin Vale',3,2,0,1,6,'Withdrawn'],['Jamie Brook',3,1,1,1,4,'Withdrawn'],['Taylor Finch',3,1,0,2,3,'Withdrawn'],['Sam Reed',3,0,1,2,1,'Disqualified']]:cancelled?[['Robin Vale',2,2,0,0,6],['Jamie Brook',2,1,0,1,3],['Sam Reed',2,0,1,1,1],['Taylor Finch',2,0,1,1,1]]:[['Robin Vale',3,2,1,0,7],['Jamie Brook',3,1,1,1,4],['Sam Reed',3,1,1,1,4],['Taylor Finch',3,0,1,2,1]];
  let pos=0,prev=null;const ranked=rows.map((r,i)=>{if(r[5]!==prev){pos=i+1;prev=r[5];}return [pos,...r];});
  const shared=p=>ranked.filter(r=>r[0]===p).length>1;
  const table=`<table class="ps-table" aria-label="Standings"><thead><tr><th scope="col">Position</th><th scope="col">Player</th><th scope="col" class="num wide">Resolved</th><th scope="col" class="num wide">Won</th><th scope="col" class="num wide">Drawn</th><th scope="col" class="num wide">Lost</th><th scope="col" class="pts">Points</th></tr></thead><tbody>${ranked.map(([p,n,res,w,d,l,pts,flag])=>`<tr><td><span aria-label="Position ${p}${shared(p)?', shared':''}">${p}${shared(p)?'=':''}</span></td><td>${n}${flag?' '+badge(flag,'danger'):''}</td><td class="num wide">${res}</td><td class="num wide">${w}</td><td class="num wide">${d}</td><td class="num wide">${l}</td><td class="pts">${pts}</td></tr>`).join('')}</tbody></table>`;
  const finalRevisions=is('reopened')?`<details class="fl-history" open><summary>Final revisions</summary><ul class="cco-revisions"><li><span><strong>Final revision 1</strong> · results revision 14</span><span class="help">Finalised by Alex Morgan, ${when('18:10')} · reopened ${when('10:05',23)} · Reason: Result appeal upheld</span></li></ul></details>`:finalised?`<details class="fl-history"><summary>Final revisions</summary><ul class="cco-revisions"><li><span><strong>Final revision 1</strong> · results revision 14</span><span class="help">Finalised by Alex Morgan, ${when('18:10')} · current</span></li></ul></details>`:'';
  let panel='';
  if(cancelled)panel=notice('Cancelled · no champion or final ranking',`The tournament was cancelled by Alex Morgan, ${when('15:20')}. These are the results recorded before; 2 matches were voided.`);
  else if(finalised)panel=`<section class="fl-summary"><div><p><strong>Final revision 1 · results revision 14</strong></p><p class="help">Finalised by Alex Morgan, ${when('18:10')}. Registration stays closed; nothing can change unless the competition is reopened.</p></div><div class="row-actions">${link('Reopen','reopen-confirm')}</div></section>${is('final-no-champion')?notice('No active entrant','Every entrant withdrew or was disqualified. Points and positions stay; no champion is declared.'):''}`;
  else{
    const revisions=r=>`<p class="help">Results revision ${r[0]} · standings revision ${r[1]} · you are reviewing revision ${r[2]}</p>`;
    if(is('finalise-ready','reopened'))panel=`<section class="fl-panel" aria-labelledby="review-heading"><h2 id="review-heading">Review and finalise</h2><p>All ${is('reopened')?'6':'6'} matches are resolved. Finalising makes these standings final; results then cannot change unless the competition is reopened.</p>${revisions(is('reopened')?[15,15,15]:[14,14,14])}<div class="actions">${link('Finalise','final','button primary')}</div></section>`;
    if(is('finalise-unresolved'))panel=`<section class="fl-panel" aria-labelledby="review-heading"><h2 id="review-heading">Review and finalise</h2><p>2 matches are unresolved. Resolve them before finalising.</p><ul class="fl-rows"><li><a href="play-and-score-states.html?state=result-empty">Round 3 · Robin Vale vs Taylor Finch</a>${badge('In play','pending')}</li><li><a href="play-and-score-states.html?state=result-empty">Round 3 · Sam Reed vs Jamie Brook</a>${badge('Scheduled','neutral')}</li></ul></section>`;
    if(is('finalise-updating'))panel=`<section class="fl-panel" aria-labelledby="review-heading"><h2 id="review-heading">Review and finalise</h2>${notice('Standings are updating','Results revision 14 has not reached the standings yet (revision 13). Finalising becomes available when they are current.')}</section>`;
    if(is('finalise-stale'))panel=`<section class="fl-panel" aria-labelledby="review-heading"><h2 id="review-heading">Review and finalise</h2>${notice('Standings changed since your review','A correction moved the results to revision 15 while you reviewed revision 14. Nothing was finalised.','danger',`<div class="actions">${link('Review again','finalise-ready')}</div>`)}</section>`;
    if(is('finalising'))panel=`<section class="fl-panel" aria-labelledby="review-heading"><h2 id="review-heading">Review and finalise</h2>${revisions([14,14,14])}<p class="help" role="status">Finalising. Please wait; do not submit again.</p><div class="actions">${button('Finalising…','','primary','disabled')}</div></section>`;
  }
  const status=cancelled?'Cancelled':finalised?'Final':'Provisional';
  return `<div class="column">${panel}<section class="fl-summary"><div><p><strong>${status} · ${cancelled?'4 of 6':'6 of 6'} matches resolved${cancelled?' · 2 voided':''}</strong></p><p class="help">3 points a win, 1 a draw · equal points share a position, listed by name</p></div></section>${table}${finalRevisions}</div>`;
}

// Configuration page: dates, cancellation, archive, deletion, visibility.
function configurationPage(){
  const running=is('dates-after-start','cancel-after-start');
  const actions=draft?`${link('Delete draft','delete-draft','button danger')}`:cancelled?link(is('archive-ready')?'Archive':'Archive','list-archived-shown'):`${running?'':link('Change dates','dates-dialog')}${link('Cancel tournament',running?'cancel-after-start':'cancel-before-start','button danger')}`;
  const summary=`<section class="fl-summary"><div><p><strong>${draft?'Draft · not published':cancelled?'Cancelled':running?'Running since 22 November 2026, 10:00':'Published · registration open'}</strong></p><p class="help">${cancelled?`Cancelled by Alex Morgan, ${when('15:20')}. Nothing can change.`:'Individual · capacity 8 · automatic admission · mandatory check-in'}</p></div><div class="row-actions">${actions}</div></section>`;
  const cancelledNotice=cancelled?notice('This tournament is cancelled',`Cancelled by Alex Morgan, ${when('15:20')}. Results recorded before stay; 2 unresolved matches were voided. A replacement is a new tournament.`):'';
  const dates=`<section class="fl-panel" aria-labelledby="dates-heading"><h2 id="dates-heading">Dates</h2><dl class="cco-facts"><dt>Registration opens</dt><dd>15 November 2026, 09:00</dd><dt>Registration closes</dt><dd>21 November 2026, 20:00</dd><dt>Planned start</dt><dd>22 November 2026, 10:00</dd><dt>Time zone</dt><dd>${zone}</dd></dl>${is('dates-after-start')?'<p class="help">The competition has started: dates are fixed. H1 has no match times.</p>':cancelled?'':'<p class="help">Change dates through “Change dates”; only the dates you select change.</p>'}</section>`;
  const visibility=`<section class="fl-panel" aria-labelledby="visibility-heading"><div class="sp-title"><h2 id="visibility-heading">Visibility</h2>${badge(is('visibility-preview')?'Private':'Public','neutral')}</div><p class="help">${is('visibility-preview')?'Only the organisation can read this tournament.':'Anyone with the link can read the details, rounds and standings, with aliases only. Without a directory in H1, public and unlisted both open by link.'}</p><div class="actions">${link('Change visibility',is('visibility-preview')?'visibility-preview':'visibility-to-private')}${is('visibility-preview')?'':link('View public page','public-running','link')}</div></section>`;
  return `<div class="column">${summary}${cancelledNotice}${dates}${draft?'':visibility}</div>`;
}

function listPage(){
  const rows=[['Saturday Open','Running',''],['Spring League','Finalised',''],['Winter Cup (draft)','Draft','']];
  const archived=[['Autumn Cup','Cancelled','Archived'],['Summer League','Finalised','Archived']];
  const shown=is('list-archived-shown')?[...rows,...archived]:rows;
  return `<header class="fl-heading"><div class="title"><h1>Tournaments</h1></div></header><div class="column"><section class="fl-summary"><div><p><strong>${shown.length} tournaments</strong></p><p class="help">${is('list-archived-shown')?'Including 2 archived.':'2 archived tournaments are hidden.'}</p></div><div class="row-actions"><label><input type="checkbox" ${is('list-archived-shown')?'checked':''} data-action="toggle-archived"> Show archived</label>${button('Create tournament','explain','primary')}</div></section><ul class="fl-rows">${shown.map(([n,s,a])=>`<li><div class="team-identity"><h3><a href="?state=${s==='Cancelled'?'cancelled':'dates-dialog'}">${n}</a></h3>${badge(s,s==='Cancelled'?'danger':s==='Draft'?'neutral':s==='Running'?'pending':'success')}${a?badge(a,'neutral'):''}</div>${a?`<div class="row-actions">${button('Unarchive','explain','',`aria-label="Unarchive ${n}"`)}</div>`:''}</li>`).join('')}</ul></div>`;
}

function schedulePage(){
  const outcome=(r,m)=>r<2?['Resolved','success',r===0&&m===0?'Robin Vale won':m===0?'Robin Vale won':'Draw']:['Voided','danger','Voided: tournament cancelled · no points'];
  return `<div class="column">${notice('This tournament is cancelled','Results recorded before stay; unresolved matches were voided with no points.')}${pairs.map((ms,r)=>`<section class="fl-group sp-round"><div class="sp-title"><h3>Round ${r+1}</h3>${badge(r<2?'Completed':'Voided',r<2?'success':'danger')}</div><ul class="fl-rows">${ms.map(([a,b],m)=>{const [s,t,o]=outcome(r,m);return `<li class="ps-match"><span class="home">${P[a]}</span><span class="vs">vs</span><span>${P[b]}</span>${badge(s,t)}<p class="ps-outcome">${o}</p></li>`;}).join('')}</ul></section>`).join('')}</div>`;
}

function changeLogPage(){
  if(is('log-load-failed'))return `<div class="column">${notice('The change log could not be loaded','The request failed. Nothing changed.','danger',`<div class="actions">${button('Try again','explain')}</div>`)}</div>`;
  if(is('log-empty'))return `<div class="column">${notice('No changes yet','Changes appear here from publication onwards: admissions, schedules, dates and other material changes, cancellation and final standings.')}</div>`;
  const entries=[
    ['tournament','Tournament cancelled · Reason: Venue unavailable','15:20',23,true,'Tournament'],
    ['tournament','Planned start changed from 22 November 2026, 10:00 to 29 November 2026, 10:00 · Europe/Madrid','09:30',20,true,'Tournament'],
    ['schedule','Schedule revision 2 published · <a href="start-and-pair-states.html?state=published">withdrawal reason in the publication history</a>','19:05',19,false,'Schedule'],
    ['schedule','Schedule revision 1 withdrawn','18:40',19,false,'Schedule'],
    ['entry','Taylor Finch admitted','12:10',17,false,'Entries'],
    ['entry','Sam Reed admitted','11:02',17,false,'Entries'],
    ['tournament','Tournament published','09:00',15,true,'Tournament'],
  ];
  const shown=is('log-filtered')?entries.filter(e=>e[5]==='Schedule'):entries;
  const filter=['All','Entries','Schedule','Tournament','Results'].map(f=>`<button type="button" aria-pressed="${is('log-filtered')?f==='Schedule':f==='All'}" data-action="${f==='Schedule'?'filter':'all'}">${f}</button>`).join('');
  return `<div class="column"><div class="cco-filter" role="group" aria-label="Show changes of kind">${filter}</div><ul class="cco-log">${shown.map(([k,s,t,d,pub])=>`<li>${icon(k)}<div><p>${s}</p><p class="help">Alex Morgan · ${when(t,d)}</p></div>${pub?badge('Public','neutral'):''}</li>`).join('')}</ul><p class="help">Herald records these changes; it does not send them. Tell your guests through your usual channels.</p></div>`;
}

function appsPage(){
  const grants=[['Results bot','0198f5ee-0000-4d21-9a55-1c0e8d6b2f41','Saturday Open',['Read','Results and corrections'],'Active'],['Scoreboard sync','0198f5ee-0000-4f88-b3e2-6a0d4c9f1e77','All tournaments',['Read'],'Revoked by Alex Morgan, 20 November 2026, 16:00 · Europe/Madrid']];
  const list=is('apps-empty')?notice('No application has access','Grant access to let a pilot application act for this organisation. The platform operator provides its application identifier.'):`<ul class="fl-rows">${grants.map(([n,id,scope,gs,st])=>`<li><div><div class="team-identity"><h3>${n}</h3>${badge(st==='Active'?'Active':'Revoked',st==='Active'?'success':'danger')}</div><p class="help"><span class="cco-mono">${id}</span> · ${scope}</p><p>${gs.map(g=>badge(g,'neutral')).join(' ')}</p>${st==='Active'?'':`<p class="help">${st}</p>`}</div>${st==='Active'?`<div class="row-actions">${link('Revoke','apps-revoke','button danger')}</div>`:''}</li>`).join('')}</ul>`;
  return `<header class="fl-heading"><div class="title"><h1>Applications</h1></div></header><div class="column"><section class="fl-summary"><div><p><strong>Pilot applications</strong></p><p class="help">An application acts only within its grant: the tournaments and operations you choose. Revoking stops it from the next request; what it did stays, attributed to it.</p></div><div class="row-actions">${link('Grant access','apps-grant','button primary')}</div></section>${list}</div>`;
}

// Public page (public application, anonymous visitor).
function publicPage(){
  if(is('public-not-available'))return `<div class="cco-public"><header class="cco-public-head"><a class="brand" href="shell-states.html?state=public-shell">HERALD.</a><a href="shell-states.html?state=public-shell">Sign in</a></header><main id="main" tabindex="-1"><div class="text"><h1>This tournament is not available</h1><p>The link may be wrong, or the organiser has not made the tournament available.</p><p><a href="shell-states.html?state=public-shell">Go to the home page</a></p></div></main></div>`;
  const before=is('public-before-start'),sched=is('public-schedule');
  const comp=before||sched?'Preparing':is('public-final','public-revised')?'Finalised':is('public-cancelled')?'Cancelled':'Running';
  const labels=`<div class="labels" aria-label="Tournament lifecycle"><span>Registration ${before?'open':'closed'}</span><span>${comp}</span></div>`;
  const facts=`<section class="fl-panel" aria-labelledby="overview"><h2 id="overview">Overview</h2><dl class="cco-facts"><dt>Organiser</dt><dd>Northside Gaming</dd><dt>Game</dt><dd>Generic card game</dd><dt>Venue</dt><dd>Northside Hall</dd><dt>Planned start</dt><dd>22 November 2026, 10:00 · ${zone}</dd><dt>Format</dt><dd>Individual · single round-robin · 4 players</dd></dl></section>`;
  const outcome=(r,m)=>{if(is('public-cancelled'))return r<2?['Resolved','success',m===0?'Robin Vale won':'Draw']:['Voided','danger','Voided: tournament cancelled'];if(sched)return ['Scheduled','neutral',''];if(is('public-final','public-revised'))return ['Resolved','success',r===0&&m===0&&is('public-revised')?'Draw · corrected':m===0?'Robin Vale won':'Draw'];return r===0?['Resolved','success',m===0?'Robin Vale won':'Draw']:r===1&&m===0?['Resolved','success','Jamie Brook absent · Robin Vale wins']:r===1?['In play','pending','']:['Scheduled','neutral',''];};
  const rounds=before?'':`<section class="fl-panel" aria-labelledby="rounds"><h2 id="rounds">Rounds</h2>${pairs.map((ms,r)=>`<section class="fl-group sp-round"><h3>Round ${r+1}</h3><ul class="fl-rows">${ms.map(([a,b],m)=>{const [s,t,o]=outcome(r,m);return `<li class="ps-match"><span class="home">${P[a]}</span><span class="vs">vs</span><span>${P[b]}</span>${badge(s,t)}${o?`<p class="ps-outcome">${o}</p>`:''}</li>`;}).join('')}</ul></section>`).join('')}</section>`;
  const st=is('public-final','public-revised')?[['Robin Vale',7],['Jamie Brook',4],['Sam Reed',4],['Taylor Finch',1]]:[['Robin Vale',6],['Jamie Brook',1],['Taylor Finch',1],['Sam Reed',0]];
  let pos=0,prev=null;const ranked=st.map((r,i)=>{if(r[1]!==prev){pos=i+1;prev=r[1];}return [pos,...r];});
  const shared=p=>ranked.filter(r=>r[0]===p).length>1;
  const header=is('public-final')?`Final · final revision 1 · finalised ${when('18:10')}`:is('public-revised')?`Final · final revision 2 (revised after reopening) · ${when('11:30',23)}`:is('public-cancelled')?'Cancelled · no champion or final ranking':`Provisional · results revision 9 · updated ${when('11:40')}`;
  const explain=`<tr class="ps-explain"><td colspan="3"><ul><li>Round 1 · vs Sam Reed · won · played · 3 points</li><li>Round 2 · vs Jamie Brook · won · Jamie Brook absent · 3 points</li><li>Round 3 · vs Taylor Finch · scheduled</li></ul><p class="help">Total: 6 points</p></td></tr>`;
  const standings=before||sched?'':`<section class="fl-panel" aria-labelledby="standings"><h2 id="standings">Standings</h2><p><strong>${header}</strong></p><table class="ps-table" aria-label="Standings"><thead><tr><th scope="col">Position</th><th scope="col">Player</th><th scope="col" class="pts">Points</th></tr></thead><tbody>${ranked.map(([p,n,pts])=>`<tr><td>${p}${shared(p)?'=':''}</td><td><button type="button" class="link" data-action="explain-row" aria-expanded="${is('public-explained')&&n==='Robin Vale'}">${n}</button>${n==='Taylor Finch'&&is('public-running','public-explained')?'':''}</td><td class="pts">${pts}</td></tr>${is('public-explained')&&n==='Robin Vale'?explain:''}`).join('')}</tbody></table></section>`;
  const changes=`<section class="fl-panel" aria-labelledby="changes"><h2 id="changes">Changes</h2><ul class="cco-log">${is('public-cancelled')?`<li>${icon('tournament')}<div><p>Tournament cancelled</p><p class="help">${when('15:20',23)}</p></div></li>`:''}${is('public-revised')?`<li>${icon('results')}<div><p>Final standings revised (final revision 2)</p><p class="help">${when('11:30',23)}</p></div></li>`:''}<li>${icon('tournament')}<div><p>Planned start changed from 15 to 22 November 2026, 10:00 · ${zone}</p><p class="help">${when('09:30',12)}</p></div></li><li>${icon('tournament')}<div><p>Tournament published</p><p class="help">${when('09:00',10)}</p></div></li></ul></section>`;
  const cancelNote=is('public-cancelled')?notice('This tournament was cancelled',`Cancelled on 23 November 2026, 15:20 · ${zone}. Results recorded before stay; no champion is declared.`):'';
  return `<div class="cco-public"><header class="cco-public-head"><a class="brand" href="shell-states.html?state=public-shell">HERALD.</a><a href="shell-states.html?state=public-shell">Sign in</a></header><main id="main" tabindex="-1"><header class="fl-heading"><div class="title"><h1>Saturday Open</h1>${labels}</div></header>${cancelNote}${facts}${rounds}${standings}${changes}</main></div>`;
}

function render(){
  let html;
  if(group==='Public page'){document.querySelector('#surface').innerHTML=publicPage();return dialogs();}
  if(group==='Applications')html=shell(appsPage(),'Applications');
  else if(group==='Tournament list')html=shell(listPage());
  else{
    const prefix={'Match (corrections)':'Match · ',Standings:'Standings · ',Configuration:'',Schedule:'Schedule · ','Change log':'Change log · '}[group];
    const extra=group==='Standings'?badge(cancelled?'Cancelled':finalised?'Final':is('finalise-updating')?'Updating':'Provisional',cancelled?'danger':finalised?'success':'pending'):'';
    const content=group==='Match (corrections)'?matchPage():group==='Standings'?standingsPage():group==='Configuration'?configurationPage():group==='Schedule'?schedulePage():changeLogPage();
    html=shell(heading(prefix,extra)+content);
  }
  document.querySelector('#surface').innerHTML=html;
  dialogs();
}
function dialogs(){
  if(is('reopen-confirm'))confirmDialog('Reopen Saturday Open?','The competition returns to running so results can be corrected. Final revision 1 is kept and listed. Registration stays closed and rosters stay frozen; finalising again needs a new review.','Reopen','reopened',field('reason','Reason (required)',reasonHelp));
  if(is('cancel-before-start'))confirmDialog('Cancel Saturday Open?','Registration closes. 3 admitted and 1 waiting entry will be cancelled; nobody is promoted. The published schedule is withdrawn. This cannot be undone: a replacement is a new tournament.','Cancel tournament','cancelled',field('reason','Reason (required)',reasonHelp),true);
  if(is('cancel-after-start'))confirmDialog('Cancel Saturday Open?','4 results recorded so far stay. 2 unresolved matches will be voided with no points. No champion or final ranking is declared. This cannot be undone.','Cancel tournament','cancelled',field('reason','Reason (required)',reasonHelp),true);
  if(is('delete-draft'))confirmDialog('Delete Winter Cup?','This draft was never published. It is deleted permanently, with its configuration. This cannot be undone.','Delete draft','list-archived-hidden','',true);
  if(is('archive-ready'))toastMsg('Saturday Open archived. It is hidden from the list unless “Show archived” is chosen.');
  if(is('apps-revoke'))confirmDialog('Revoke Results bot?','Results bot stops acting for Northside Gaming from its next request. Results it recorded stay, attributed to it.','Revoke','apps-list','',true);
  if(is('dates-dialog','dates-preview','dates-invalid'))datesDialog();
  if(is('visibility-to-private'))confirmDialog('Make Saturday Open private?','Visitors with the link see “not available” from the moment you confirm. Copies already seen cannot be retracted.','Make private','visibility-preview');
  if(is('visibility-preview'))previewDialog();
  if(is('apps-grant','apps-grant-errors'))grantDialog();
  if(is('corrected'))toastMsg('Result corrected. Standings updated to revision 10.');
  if(is('final'))toastMsg('Saturday Open finalised.');
}
function modal(inner){const d=document.createElement('dialog');d.className='fl-modal';d.setAttribute('aria-labelledby','dialog-heading');d.innerHTML=inner;document.body.append(d);d.showModal();d.querySelector('h2').focus();}
function confirmDialog(heading,text,action,next,extra='',danger=false){modal(`<h2 id="dialog-heading" tabindex="-1">${heading}</h2><p>${text}</p>${extra}<div class="actions"><a class="button primary${danger?' danger':''}" href="?state=${next}">${action}</a>${button('Keep as it is','close')}</div>`);}
function datesDialog(){
  const rows=[['opens','Registration opens','15 November 2026, 09:00','',false],['closes','Registration closes','21 November 2026, 20:00',is('dates-invalid')?'23 November 2026, 12:00':'28 November 2026, 20:00',!is('dates-dialog')],['start','Planned start','22 November 2026, 10:00','29 November 2026, 10:00',!is('dates-dialog')]];
  const preview=is('dates-preview')?`<section class="fl-panel"><h3>Preview</h3><ul><li>Registration closes: 21 November 2026, 20:00 → 28 November 2026, 20:00</li><li>Planned start: 22 November 2026, 10:00 → 29 November 2026, 10:00</li></ul><p class="help">${zone}. Registration opening stays. Check-ins stay as they are. The change is recorded in the change log; tell your guests through your usual channels.</p></section>`:'';
  const error=is('dates-invalid')?'<p class="error" id="dates-error">Registration closes after the planned start. Move the closure to or before 29 November 2026, 10:00.</p>':'';
  modal(`<h2 id="dialog-heading" tabindex="-1">Change dates</h2><p class="help">Select the dates to change. The others stay as they are. Time zone: ${zone}.</p><div class="cco-dates">${rows.map(([id,label,old,nw,on])=>`<div class="row"><label><input type="checkbox" ${on?'checked':''} aria-describedby="${id}-old"> ${label}</label><span class="help" id="${id}-old">Now: ${old}</span>${on?`<div class="new fl-field"><label for="${id}-new">New</label><input id="${id}-new" value="${nw}" ${id==='closes'&&is('dates-invalid')?'aria-invalid="true" aria-describedby="dates-error"':''}></div>`:'<span></span>'}</div>`).join('')}</div>${error}${preview}<div class="actions">${is('dates-preview')?link('Save dates','dates-after-start','button primary'):link('Preview changes','dates-preview','button primary')}${button('Keep as it is','close')}</div>`);
}
function previewDialog(){modal(`<h2 id="dialog-heading" tabindex="-1">Make Saturday Open public?</h2><p>Anyone with the link will read what follows. Contacts, reasons, rosters and lineups are never shown.</p><section class="fl-panel"><h3>What becomes public</h3><dl class="cco-facts"><dt>Title</dt><dd>Saturday Open</dd><dt>Dates</dt><dd>22 November 2026, 10:00 · ${zone}</dd><dt>Entrant aliases</dt><dd>Robin Vale, Sam Reed, Jamie Brook, Taylor Finch</dd><dt>Also</dt><dd>Published rounds, results with their causes, standings, public changes</dd></dl></section><fieldset class="ps-choice"><legend>Visibility</legend><label><input type="radio" name="vis" checked> Public</label><label><input type="radio" name="vis"> Unlisted (in H1, also by link only)</label></fieldset><div class="actions">${link('Make public','visibility-panel','button primary')}${button('Keep private','close')}</div>`);}
function grantDialog(){const err=is('apps-grant-errors');modal(`<h2 id="dialog-heading" tabindex="-1">Grant access</h2><div class="fl-field"><label for="gname">Name</label><input id="gname" value="${err?'':'Results bot'}" ${err?'aria-invalid="true" aria-describedby="gname-error"':''}>${err?'<p class="error" id="gname-error">Give the application a name.</p>':''}</div><div class="fl-field"><label for="gid">Application identifier</label><input id="gid" class="cco-mono" value="${err?'results-bot':'0198f5ee-0000-4d21-9a55-1c0e8d6b2f41'}" aria-describedby="gid-help${err?' gid-error':''}" ${err?'aria-invalid="true"':''}><p class="help" id="gid-help">From the platform operator's provisioning record.</p>${err?'<p class="error" id="gid-error">Enter the identifier as given: 32 hexadecimal digits with hyphens.</p>':''}</div><fieldset class="ps-choice"><legend>Tournaments</legend><label><input type="radio" name="scope"> All of the organisation's tournaments</label><label><input type="radio" name="scope" checked> Selected: <span>Saturday Open</span></label></fieldset><fieldset class="ps-choice" ${err?'aria-describedby="ops-error"':''}><legend>Operations</legend>${[['Read','tournaments, entries, schedule, results and standings'],['Tournament setup','create, configure, publish, dates, visibility'],['Entries','guests, entries, admission, check-in, rosters'],['Schedule','generate, publish and withdraw, start'],['Results and corrections','lineups, results, outcomes, departures, corrections'],['Finalisation','finalise and reopen']].map(([g,d])=>`<label><input type="checkbox" ${!err&&(g==='Read'||g==='Results and corrections')?'checked':''}> <span><strong>${g}</strong> · ${d}</span></label>`).join('')}</fieldset>${err?'<p class="error" id="ops-error">Choose at least one operation.</p>':''}<div class="actions">${link('Grant access',err?'apps-grant-errors':'apps-list','button primary')}${button('Cancel','close')}</div>`);}
function toastMsg(text){const t=document.createElement('section');t.className='check-toasts';t.setAttribute('aria-label','Notifications');t.innerHTML=`<div class="check-toast">${icon('ok')}<p role="status">${text}</p></div>`;document.body.append(t);}
document.querySelector('#state-links').innerHTML=Object.entries(groups).map(([g,keys])=>`<strong>${g}</strong>${keys.map(key=>`<a href="?state=${key}" ${key===state?'aria-current="page"':''}>${key.replaceAll('-',' ')}</a>`).join('')}`).join('');
render();
document.addEventListener('click',e=>{const c=e.target.closest('[data-action]');if(!c||c.disabled)return;const a=c.dataset.action;
  if(a==='close'){document.querySelector('dialog')?.remove();return;}
  const go={'explain-row':group==='Public page'?'public-explained':'',filter:'log-filtered',all:'log-populated','toggle-archived':is('list-archived-shown')?'list-archived-hidden':'list-archived-shown'}[a];
  if(go){location.search=`?state=${go}`;return;}
  const m=document.createElement('p');m.className='help';m.setAttribute('role','status');m.textContent='This action belongs to an existing review surface. No request is sent.';c.parentElement.append(m);});
})();
