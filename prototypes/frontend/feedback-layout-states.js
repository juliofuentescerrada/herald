// Independent, deterministic documentation fixtures. No API, storage or real mutations.
(() => {
'use strict';
const batches = [
['entries-wide','entries-cancelled-expanded','entries-manual-pending','entries-empty','cancel-dialog','cancel-dialog-closed','cancel-dialog-busy','cancel-dialog-failed','admit-reason-dialog','admit-reason-typed','add-drawer-search','add-drawer-create','add-drawer-duplicate','add-drawer-adding','add-drawer-failed','toast-admitted','toast-stack','entries-conflict','entries-over-capacity','entries-loading','entries-failed'],
['config-published','config-saved-toast','config-rejected','config-conflict','config-reload-dialog','config-leave-dialog','config-draft','list-wide','list-empty','review-form','organisation-selector','organisation-create','not-found'],
['public-home','catalogue-dialog','catalogue-drawer','catalogue-toast']];
const keys = batches.flat();
const parameters = new URLSearchParams(location.search);
const state = keys.includes(parameters.get('state')) ? parameters.get('state') : 'entries-wide';
const team = state === 'entries-manual-pending' || parameters.get('kind') === 'team';
const kind = team ? 'team' : 'player';
const title = team ? 'Saturday Team League' : 'Saturday Open';
const zone = 'Europe/Madrid';
const players = ['Robin Vale','Sam Reed','Jamie Brook','Taylor Finch','Casey Wood','Drew Hill','Avery Lane','Morgan Field','Parker Snow'];
const teams = ['North Stars','River Falcons','Meadow Foxes','Cedar Owls','Harbour Lights'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name='info') => `<svg class="fl-icon" viewBox="0 0 24 24" aria-hidden="true">${({info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',error:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/>',check:'<path d="m5 12 4 4L19 6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',down:'<path d="m7 10 5 5 5-5"/>',switch:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'})[name]}</svg>`;
const button = (text, action='', cls='', attrs='') => `<button type="button" class="${cls}" ${action ? `data-action="${action}"` : ''} ${attrs}>${text}</button>`;
const link = (text, target, cls='') => `<a class="button ${cls}" href="?state=${target}">${text}</a>`;
const notice = (heading, text, tone='info', extra='') => `<section class="fl-notice ${tone}" role="${tone==='danger'?'alert':'status'}">${icon(tone==='danger'?'error':'info')}<div><strong>${heading}</strong><p>${text}</p>${extra}</div></section>`;
const labels = (registration='Registration open', published=true) => `<div class="labels" aria-label="Tournament lifecycle"><span>${published?'Published':'Draft'}</span><span>${registration}</span><span>Preparing</span></div>`;
const header = (entries=false, closed=false) => `<header class="fl-heading"><a class="back" href="?state=${entries?'config-published':'list-wide'}">Back to ${entries?'configuration':'tournaments'}</a><h1>${entries?'Entries · ':''}${title}</h1><p class="lead">Example strategy · Standard variant · ${team?'Team':'Individual'} · Madrid</p><p class="lead">${team?'28':'21'} November 2026, 10:00 · ${zone}</p>${labels(closed?'Registration closed':'Registration open')}</header>`;
function shell(content, width='') {
 return `<div class="fl-shell"><aside class="fl-rail"><a class="brand" href="?state=list-wide">HERALD<span>.</span></a><div class="fl-context"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="?state=organisation-selector">${icon('switch')}Switch organisation</a></div><nav class="fl-nav" aria-label="Workspace"><a href="access-states.html?state=one-organisation">${icon('home')}Overview</a><a href="?state=list-wide" aria-current="page">Tournaments</a></nav></aside><main id="main" class="fl-page" tabindex="-1"><header class="fl-top"><span>Organiser workspace</span><div class="fl-account"><button type="button" data-action="account" aria-expanded="false" aria-controls="account-panel">Alex Morgan${icon('down')}</button><div id="account-panel" class="fl-account-panel" hidden><strong>Alex Morgan</strong><small>Signed in with your account provider</small>${link('Organise','list-wide')}${button('Sign out','explain')}</div></div></header><div class="fl-content ${width}">${content}</div></main></div>`;
}
function entryFixture() {
 const empty = state === 'entries-empty';
 const reason = state.startsWith('admit-reason');
 const closed = state === 'cancel-dialog-closed' || reason;
 const over = state === 'entries-over-capacity';
 let admitted = empty?[]:team?teams.slice(0,3):players.slice(0,over?9:reason?7:state.startsWith('add-drawer')?3:8);
 let waiting = empty?[]:team?teams.slice(3):['Ellis Stone','Rowan Lake'];
 if(state==='toast-admitted'){admitted=[...players.slice(0,7),'Ellis Stone'];waiting=['Rowan Lake'];}
 if(state==='toast-stack'){admitted=[...players.slice(1,8),'Ellis Stone'];waiting=['Rowan Lake'];}
 return {admitted,waiting,capacity:team?4:8,closed,over,empty};
}
const fixture = entryFixture();
function entryGroup(label, names) {
 const isWaiting = label==='Waiting';
 const blocked = fixture.over || fixture.admitted.length>=fixture.capacity;
 const why = fixture.over?'Field is over capacity. Cancel an admitted entry first.':'No free slot. Cancel an admitted entry or increase capacity.';
 return `<section class="fl-group" aria-labelledby="${label.toLowerCase()}-heading"><h2 id="${label.toLowerCase()}-heading">${label} · ${names.length}</h2>${names.length?`<${isWaiting?'ol':'ul'} class="fl-rows">${names.map((name,i)=>`<li><div><h3>${isWaiting?`${i+1}. `:''}${name}</h3><p class="help">${isWaiting?`${team?'Admission pending':'Capacity full'} · Waiting since 11 November 2026, ${i?'10:05':'10:00'} · ${zone}`:'Admitted'}</p>${isWaiting&&blocked?`<p class="help" id="why-${i}">${why}</p>`:''}</div><div class="row-actions">${isWaiting?button('Admit',i?'admit-reason':'admit','',`aria-label="Admit: ${name}" data-name="${name}" ${blocked?`disabled aria-describedby="why-${i}"`:''}`):''}${button('Cancel entry','cancel','',`data-name="${name}" data-waiting="${isWaiting}" aria-label="Cancel entry: ${name}"`)}</div></li>`).join('')}</${isWaiting?'ol':'ul'}>`:`<p class="help">No ${label.toLowerCase()} entries.</p>`}</section>`;
}
function history() {
 if(team||fixture.empty)return '';
 return `<details class="fl-history" ${state==='entries-cancelled-expanded'?'open':''}><summary>Cancelled · 5</summary><ul>${[state==='toast-stack'?'Robin Vale':'Blair Moss','Quinn Ash','Reese Moss','Parker Snow','Sam Reed'].map((name,i)=>`<li><strong>${name}</strong> <small>· Cancelled 11 November 2026, 09:${40+i} · ${zone}</small></li>`).join('')}</ul></details>`;
}
function entries() {
 let body = header(true,fixture.closed);
 if(state==='entries-loading')return body+'<section class="fl-panel" role="status" aria-busy="true"><h2>Loading entries…</h2><p>Please wait while the tournament field is loaded.</p></section>';
 if(state==='entries-failed')return body+notice('Entries could not be loaded','No entries are shown. Try loading the field again.','danger',`<div class="actions">${button('Try again','explain','primary')}</div>`);
 const blocked=fixture.closed||fixture.over||state==='entries-conflict';
 const why=fixture.closed?'Registration is closed. Reopen registration in configuration to add entries.':fixture.over?'Field is over capacity. Cancel an admitted entry before adding or admitting.':'Reload the latest version first.';
 const summary=`<section class="fl-summary"><div><h2>${fixture.admitted.length} of ${fixture.capacity} ${team?'teams':'individual entries'}</h2><p class="help">${team?'Manual':'Automatic'} admission · ${fixture.waiting.length} ${team?'pending your decision':'waiting for a slot'}</p><p class="help">Entry terms updated 11 November 2026, 10:10 · ${zone}</p></div><div>${button('Add '+kind,'add','primary',`id="add-entry" ${blocked?'disabled aria-describedby="add-reason"':''}`)}${blocked?`<p class="help" id="add-reason">${why}</p>`:''}</div></section>`;
 let messages='';
 if(state==='entries-conflict')messages=notice('This entry changed elsewhere','Nothing changed with this request. Reload the latest entries before trying again.','danger',`<div class="actions">${button('Reload latest','explain')}</div>`);
 if(fixture.over)messages=notice('Field is over capacity','9 admitted entries exceed the capacity of 8. Changes made at the same time left this mismatch, and nothing was removed automatically. Cancel an admitted entry or raise the capacity to resolve it. Adding and admitting are blocked.','danger');
 return body+`<div class="fl-grid"><section class="fl-aside" aria-label="Entry summary">${summary}${history()}</section><div class="fl-main">${messages}${fixture.empty?'<section class="fl-panel"><h2>No entries yet</h2><p>Admitted and waiting entries will appear here. Each individual entry takes one slot.</p></section>':''}${entryGroup('Admitted',fixture.admitted)}${entryGroup('Waiting',fixture.waiting)}</div></div>`;
}
function cancelContents(name='Robin Vale', busy=false, failed=false, waiting=false) {
 const effect=waiting?'No slot is freed by cancelling a waiting entry. No waiting entry will be admitted.':fixture.closed?'No waiting entry will be admitted automatically because registration is closed. You can admit a waiting entry afterwards.':team?'No waiting entry will be admitted automatically because admission is manual.':'Ellis Stone, first in the capacity queue, will be admitted automatically when this slot is freed.';
 return `<h2 id="modal-heading">Cancel ${escape(name)}’s entry?</h2><p>This cancellation is final for this entry. Entering ${escape(name)} again creates a new entry at the back of the queue.</p>${notice('Effect on the waiting list',effect)}${failed?notice('Entry was not cancelled','The request failed. Nothing changed. Try cancelling the entry again.','danger'):''}<div class="actions">${button(busy?'Cancelling…':failed?'Try again':'Confirm cancellation','confirm','destructive',busy?'disabled':'')}${button('Keep entry','close','',busy?'disabled':'')}</div>`;
}
function reasonContents(typed=false) {
 return `<h2 id="modal-heading">Admit Rowan Lake ahead of Ellis Stone?</h2><p>One slot is free. Ellis Stone is earlier in the capacity queue. Registration is closed, so no entry is admitted automatically.</p><form><div class="fl-field"><label for="admit-reason">Private reason (required)</label><textarea id="admit-reason" rows="3" maxlength="500" aria-describedby="admit-reason-help">${typed?'Reviewed priority exception':''}</textarea><p class="help" id="admit-reason-help">Record why you are departing from queue order. This reason is private.</p></div><div class="actions">${button('Admit Rowan Lake','confirm','primary',`id="confirm-admit" ${typed?'':'disabled'}`)}${button('Back to entries','close')}</div></form>`;
}
function drawerContents(mode, prefix='') {
 const search=mode==='search', duplicate=mode==='duplicate', busy=mode==='adding', failed=mode==='failed';
 const id=prefix+'guest-name';
 const result=(name,entered=false)=>`<li><div><h3>${name}</h3><p class="help">Existing ${kind} · created 10 November 2026</p></div>${entered?'<p class="help">Already entered in this tournament</p>':button('Enter this '+kind,'confirm','primary',busy?'disabled':'')}</li>`;
 return `<h2 id="${prefix}modal-heading">Add ${kind}</h2><p class="help">Choose a guest of Northside Gaming or create a new ${kind}.</p><div class="actions">${button('Choose existing','choose-existing','',`aria-pressed="${search}" ${busy?'disabled':''}`)}${button('Create new','choose-new','',`aria-pressed="${!search}" ${busy?'disabled':''}`)}</div><form><div class="fl-field"><label for="${id}">${search?'Search by name':'Name (alias)'}</label><input id="${id}" maxlength="80" value="${search?'R':duplicate?'quinn ash':team?'Oak Comets':'Reese Moss'}" ${busy?'readonly':''} aria-describedby="${id}-help"><p id="${id}-help" class="help">${search?'Only '+kind+' guests in Northside Gaming.':'1–80 characters after trimming. Review the name before creating the guest.'}</p></div>${failed?notice('Entry was not added','The request failed. Nothing was added. Your input is kept; try again.','danger'):''}${duplicate?notice('Possible duplicate',`These ${kind} guests have the same name ignoring case, accents and spaces. Choose one or create a separate guest. Nothing will be merged.`):''}${search||duplicate?`<ul class="fl-rows">${result(team?'Birch Kites':search?'Reese Moss':'Quinn Ash')}${search?result(team?'North Stars':'Robin Vale',true):''}</ul>`:''}${busy?'<p class="help" role="status">Adding entry. Please wait; do not submit again.</p>':''}<div class="actions">${search?'':button(busy?'Adding…':duplicate?'Create a new '+kind+' anyway':failed?'Retry add':'Create and enter '+kind,'confirm',duplicate?'':'primary',busy?'disabled':'')}${button('Back to entries','close','',busy?'disabled':'')}</div></form>`;
}
let opener=null;
function openModal(contents, drawer=false, busy=false, focusSelector) {
 document.querySelector('#operation-dialog')?.remove();
 const modal=document.createElement('dialog');modal.id='operation-dialog';modal.className='fl-modal'+(drawer?' drawer':'');modal.setAttribute('aria-labelledby','modal-heading');modal.setAttribute('aria-modal','true');modal.dataset.busy=String(busy);if(busy)modal.setAttribute('aria-busy','true');modal.innerHTML=contents;document.body.append(modal);
 modal.setAttribute('closedby',busy?'none':'closerequest');
 modal.addEventListener('keydown',event=>{if(busy&&event.key==='Escape'){event.preventDefault();event.stopPropagation();}});
 modal.addEventListener('cancel',event=>{event.preventDefault();if(!busy)closeModal();});
 document.body.classList.add('has-modal');
 document.body.style.setProperty('--review-height',document.querySelector('.review-bar').getBoundingClientRect().height+'px');
 modal.showModal();
 const focus=modal.querySelector(focusSelector||'button:not(:disabled),input,textarea');
 if(focus){focus.classList.add('focus-evidence');focus.focus();}else{modal.querySelector('h2').tabIndex=-1;modal.querySelector('h2').classList.add('focus-evidence');modal.querySelector('h2').focus();}
}
function closeModal(){const modal=document.querySelector('#operation-dialog');if(!modal||modal.dataset.busy==='true')return;modal.close();modal.remove();document.body.classList.remove('has-modal');const target=opener?.isConnected?opener:document.querySelector('#add-entry:not(:disabled)')||document.querySelector('h1');if(target){if(target.tagName==='H1')target.tabIndex=-1;target.focus();}}
function removeToast(item){const region=item.parentElement;item.remove();if(region?.classList.contains('fl-toasts')&&!region.children.length){region.remove();document.body.classList.remove('has-toast');document.body.style.removeProperty('--toast-reserve');}}
let toastSequence=0;
function toast(text,tone='success',focused=false,container) {
 let region=container||document.querySelector('.fl-toasts');
 if(!region){region=document.createElement('div');region.className='fl-toasts';region.setAttribute('aria-label','Notifications');document.body.append(region);}
 while(region.children.length>=3)region.firstElementChild.remove();
 const item=document.createElement('div');item.className='fl-toast '+tone;item.tabIndex=0;item.setAttribute('role','status');item.innerHTML=`${icon(tone==='success'?'check':'info')}<p>${escape(text)}</p>${button(icon('close'),'dismiss','','aria-label="Dismiss notification"')}`;item.dataset.toast=++toastSequence;region.append(item);if(!container)document.body.classList.add('has-toast');
 if(!container)requestAnimationFrame(()=>document.body.style.setProperty('--toast-reserve',(region.getBoundingClientRect().height+32)+'px')); 
 let timer,remaining=5000,started;
 const pause=()=>{clearTimeout(timer);if(started)remaining-=Date.now()-started;started=null;};
 const resume=()=>{if(parameters.has('capture')||item.matches(':hover')||item.contains(document.activeElement))return;started=Date.now();timer=setTimeout(()=>removeToast(item),Math.max(0,remaining));};
 item.addEventListener('mouseenter',pause);item.addEventListener('mouseleave',resume);item.addEventListener('focusin',pause);item.addEventListener('focusout',()=>setTimeout(resume,0));resume();if(focused)item.focus();
}
const values={title:'Saturday Open',gameVariant:'Example strategy · Standard variant',entryKind:'Individual',capacity:'8',profile:'Single round-robin · 3 / 1 / 0',registrationOpensAt:'2026-11-10T09:00',registrationClosesAt:'2026-11-13T18:00',plannedStartAt:'2026-11-21T10:00',timeZone:'Europe/Madrid',location:'On-site venue',venue:'Madrid',admission:'Automatic',checkIn:'Optional',visibility:'Public'};
const fieldLabels={title:'Title',gameVariant:'Game / variant',entryKind:'Entry kind',capacity:'Capacity in individual entries',profile:'Competition profile',registrationOpensAt:'Registration opening',registrationClosesAt:'Registration closure',plannedStartAt:'Planned start',timeZone:'Reference time zone',location:'Location mode',venue:'Venue',admission:'Admission',checkIn:'Check-in',visibility:'Visibility'};
const locked='Locked while the tournament has entries. Cancel every entry to change it.';
const sections=[
{heading:'Tournament details',help:'A published tournament must stay complete.',fields:[['title','text','The tournament name shown when published.',true],['gameVariant','text','Free text, for example the game and its variant.',true],['entryKind','select',locked,false,['Individual','Team']],['capacity','number','How many entries the tournament admits. At least 3: the admitted entries.']]},
{heading:'Competition profile',help:'This H1 profile is fixed; points are not edited per tournament.',fields:[['profile','readonly','Win 3 · Draw 1 · Loss 0. Equal points share a position. Draws are allowed.',true]]},
{heading:'Dates and location',help:'All three times use the reference time zone. A planned date does not start competition.',fields:[['registrationOpensAt','datetime-local','Planned opening; publication does not open registration.'],['registrationClosesAt','datetime-local','Must not be later than the planned start.'],['plannedStartAt','datetime-local','The announced start date and time.'],['timeZone','select','Times above are interpreted in this zone.',false,['Europe/Madrid']],['location','select','Choose a venue or an online tournament.',false,['On-site venue','Online']],['venue','text','City or venue name for an on-site tournament.']]},
{heading:'Admission and visibility',help:'Nothing is preselected: each is your decision for this tournament.',fields:[['admission','select',locked,false,['Automatic','Manual']],['checkIn','select','Whether admitted entrants must check in.',false,['Optional','Mandatory']],['visibility','select','Public: listed. Unlisted: readable by link. Private: owner-only access.',true,['Public','Unlisted','Private']]]}];
function formField([key,type,help,full=false,choices],draft=false) {
 const id='t-'+key;
 const rejected=state==='config-rejected'&&key==='capacity';
 let value=values[key];
 if(rejected)value='2';
 if(['config-conflict','config-reload-dialog','config-leave-dialog'].includes(state)&&key==='title')value='Saturday Open · revised';
 if(draft&&key==='timeZone')value='';
 const disabled=!draft&&['entryKind','admission'].includes(key);
 if(draft&&key==='entryKind')help='Each entry takes one place in the tournament.';
 if(draft&&key==='capacity')help='How many entries the tournament admits.';
 if(draft&&key==='admission')help='Automatic admission or an operator decision.';
 const attrs=`id="${id}" name="${key}" aria-describedby="${id}-help${rejected?' '+id+'-error':''}" ${rejected?'aria-invalid="true"':''}`;
 return `<div class="fl-field ${full?'full':''}"><label for="${id}">${fieldLabels[key]}</label>${type==='select'?`<select ${attrs} ${disabled?'disabled':''}><option value="">Choose…</option>${choices.map(v=>`<option ${v===value?'selected':''}>${v}</option>`).join('')}</select>`:`<input ${attrs} type="${type==='readonly'?'text':type}" value="${escape(value)}" ${type==='readonly'?'readonly':''} ${type==='number'?'step="1"':''}>`}<p class="help" id="${id}-help">${draft&&disabled?help:help}</p>${type==='datetime-local'?`<p class="help">${Number(value.slice(8,10))} November 2026, ${value.slice(11)}</p>`:''}${rejected?`<p class="field-error" id="${id}-error">${icon('error')}Error: Capacity cannot be lower than the admitted entries.</p>`:''}</div>`;
}
function registrationArea() {
 const dirty=['config-conflict','config-reload-dialog','config-leave-dialog','config-rejected'].includes(state);
 return `<section class="fl-panel fl-registration"><h2>Registration</h2><p><strong>Registration open</strong></p><dl><div><dt>Announced opening</dt><dd>10 November 2026, 09:00</dd></div><div><dt>Announced closure</dt><dd>13 November 2026, 18:00</dd></div><div><dt>Reference time zone</dt><dd>${zone}</dd></div></dl><p class="help">These dates are an announcement. Registration changes only with the action below, not automatically at these times.</p><p>Opened 11 November 2026, 09:30 · ${zone}</p>${dirty?'<p class="help" id="registration-reason">Save your changes first.</p>':''}${button('Close registration','registration','primary',`id="registration-action" ${dirty?'disabled aria-describedby="registration-reason"':''}`)}</section>`;
}
function configuration() {
 const draft=state==='config-draft';
 const heading=draft?`<header class="fl-heading"><a class="back" href="?state=list-wide">Back to tournaments</a><h1>Configure Saturday Open</h1><p class="lead">Draft configuration · Northside Gaming · not yet published</p>${labels('Registration not open',false)}</header>`:header();
 let notices=draft?`<section class="fl-panel"><h2>Missing for publication</h2><p>The draft is saved. Publication needs this value:</p><ul><li><a class="back" href="#t-timeZone">Reference time zone</a></li></ul></section>`:notice('Published · configuration remains editable','Competition is preparing. Saving configuration does not change registration.');
 if(['config-conflict','config-reload-dialog'].includes(state))notices+=notice('This tournament changed elsewhere','Your save was not applied, so nothing was overwritten. Everything you typed is still here: copy what you need, then reload the latest version.','danger',`<div class="actions">${button('Reload latest','reload')}</div>`);
 if(state==='config-rejected')notices+=`<section class="fl-notice danger" tabindex="-1" id="error-summary">${icon('error')}<div><h2>Correct 1 field to save</h2><p>Nothing was saved. Everything you typed has been kept.</p><a class="back" href="#t-capacity">Capacity: Capacity cannot be lower than the admitted entries.</a></div></section>`;
 const form=`<form class="fl-panel fl-form" id="configuration" novalidate>${sections.map(section=>`<fieldset><legend>${section.heading}</legend><p class="help">${draft&&section.heading==='Tournament details'?'A draft can be saved before all publication requirements are complete.':section.help}</p><div class="field-grid">${section.fields.map(f=>formField(f,draft)).join('')}</div></fieldset>`).join('')}<div class="actions">${button(draft?'Save draft':'Save changes','save','primary')}${draft?button('Review and publish','','','disabled aria-describedby="review-why"'):''}${link('Back to tournaments','list-wide')}</div>${draft?'<p class="help" id="review-why">Review is unavailable. Complete the values missing for publication first.</p>':''}</form>`;
 return heading+(draft?`<div class="fl-main fl-form">${notices}${form}</div>`:`<div class="fl-grid config"><section class="fl-aside" aria-label="Registration and entries">${registrationArea()}<section class="fl-panel"><h2>Entries</h2><p>3 of 8 individual entries admitted · 1 waiting</p>${link('View entries','entries-wide')}</section></section><div class="fl-main">${notices}${form}</div></div>`);
}
function list() {
 const heading=`<header class="fl-list-heading"><div><h1>Tournaments</h1><p class="lead">Northside Gaming · your organising workspace</p></div>${state==='list-empty'?'':link('Create tournament','config-draft','primary')}</header>`;
 if(state==='list-empty')return heading+`<section class="fl-panel"><h2>No tournaments yet</h2><p>Create a draft with a title, complete it when you are ready, then publish it. Publishing does not open registration.</p><div class="actions">${link('Create tournament','config-draft','primary')}</div></section>`;
 return heading+`<ul class="fl-rows fl-list">${[['Saturday Open',false,false],['Saturday Team League',true,false],['Saturday Open',false,true]].map(([name,t,d])=>`<li><div><h2>${name}</h2><p class="help">Example strategy · Standard variant · ${t?'Team':'Individual'} · Madrid</p><p class="help">${t?'28':d?'14':'21'} November 2026, 10:00 · ${zone}</p><p class="capacity">${d?'Capacity · 16 individual entries':t?'3 of 4 teams admitted · 2 waiting':'3 of 8 individual entries admitted · 1 waiting'}</p>${labels(d?'Registration not open':t?'Registration closed':'Registration open',!d)}</div><div class="row-actions">${link(d?'Continue draft':'Edit configuration',d?'config-draft':'config-published')}${d?'':link('Entries',t?'entries-manual-pending':'entries-wide')}</div></li>`).join('')}</ul>`;
}
function review() {
 const reviewSections=[
 ['Tournament details',[['Title','Saturday Open'],['Game / variant',values.gameVariant],['Entry kind','Individual'],['Capacity','8 individual entries']]],
 ['Competition profile',[['Profile',values.profile],['Scoring','Win 3 · Draw 1 · Loss 0'],['Equal points','Shared position']]],
 ['Dates and location',[['Registration opening','10 November 2026, 09:00'],['Registration closure','13 November 2026, 18:00'],['Planned start','21 November 2026, 10:00'],['Reference time zone',zone],['Location','On-site · Madrid']]],
 ['Admission and visibility',[['Admission','Automatic'],['Check-in','Optional'],['Visibility','Public: listed']]]];
 return `<header class="fl-heading"><a class="back" href="?state=config-draft">Back to configuration</a><h1>Review before publishing</h1><p class="lead">Read-only configuration summary · Saturday Open</p>${labels('Registration not open',false)}</header><section class="fl-panel fl-review">${reviewSections.map(([heading,items])=>`<h2>${heading}</h2><dl>${items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`).join('')}<p><strong>Publishing keeps registration not open.</strong> It creates no entries, pairings or play.</p><p>A published tournament cannot be unpublished.</p><div class="actions">${button('Publish tournament','explain','primary')}${link('Edit configuration','config-draft')}</div></section>`;
}
function organisation() {
 if(state==='not-found')return `<section class="fl-panel"><h1>Page not found in Northside Gaming</h1><p>It may have been removed, or it may belong to an organisation you are not working in.</p><div class="actions">${link('Go to overview','list-wide','primary')}</div></section>`;
 if(state==='organisation-create')return `<section class="fl-panel"><h1>Create an organisation</h1><p class="lead">Give your organising workspace a name. You will become its only owner.</p><form><div class="fl-field"><label for="organisation-name">Organisation name <small>Required</small></label><input id="organisation-name" name="organisation-name" autocomplete="organization" aria-describedby="name-help"><p class="help" id="name-help">For example, Northside Gaming. Up to 80 characters.</p></div><div class="actions">${button('Create organisation','explain','primary')}${link('Cancel','organisation-selector')}</div></form></section><section class="fl-panel"><h2>A workspace of your own</h2><p>Organisation access is separate from sign-in. Creating this organisation gives you ownership of it, without granting access to anyone else’s private content.</p></section>`;
 return `<h1>Choose an organisation</h1><p class="lead">You own these organisations. Switching replaces the workspace; permissions are never combined.</p><section class="fl-panel"><h2>Your organisations</h2><ul class="fl-rows"><li><div><strong>Northside Gaming</strong><p class="help">Owner · Current organisation</p></div><span>Selected</span></li></ul><div class="actions">${link('Create another organisation','organisation-create')}${link('Keep current organisation','list-wide')}</div></section>`;
}
function publicHome() {
 return `<header class="fl-public-header"><a class="brand" href="?state=public-home">HERALD<span>.</span></a>${button(icon('menu')+'Menu','public-menu','fl-public-menu','aria-expanded="false" aria-controls="public-menu"')}<nav id="public-menu" aria-label="Main"><a href="?state=public-home" aria-current="page">Home</a>${link('Sign in','organisation-selector')}</nav></header><main id="main"><section class="fl-public-hero"><div class="fl-public-inner"><p class="eyebrow">Tournaments for every game</p><h1>Run the event. Herald keeps the score.</h1><p class="lead">Leagues and knockouts with clear results, fair standings and a public page your players can follow.</p>${link('Open the organiser workspace','organisation-selector','primary')}</div></section><section class="fl-points"><div class="fl-public-inner"><h2>Why organisers use Herald</h2><div class="points-grid"><div><h3>One record of every result</h3><p>Corrections keep their reason and who made them.</p></div><div><h3>Standings players trust</h3><p>Only effective results count, and shared positions stay shared.</p></div><div><h3>A page to share</h3><p>Players follow the published competition by link.</p></div></div></div></section></main><footer class="fl-public-footer">Herald</footer>`;
}
function catalogueIncumbent() {
 const variants=[['Primary','Publish','primary'],['Secondary','Save draft',''],['Quiet','Cancel','quiet'],['Destructive','Withdraw entry','destructive']];
 return `<section id="buttons"><h2>Buttons</h2><div class="specimens">${variants.map(([name,label,cls])=>`<section class="specimen"><h3>${name}</h3><div class="actions">${button(label,'explain',cls)}${button(label,'',cls,'disabled aria-label="'+label+' · unavailable"')}${button(label,'',cls,'disabled aria-busy="true" aria-label="'+label+' · loading"')}</div></section>`).join('')}</div><p class="help">Actions run: <span id="press-count">0</span>. Unavailable and loading buttons never add one.</p><div class="specimens"><div><h3>Unavailable, with a reason</h3>${button('Start competition','','primary','disabled aria-describedby="start-reason"')}<p class="help" id="start-reason">One admitted entry has not checked in.</p></div><div><h3>Link with button appearance</h3><a class="button primary" href="#buttons">Open the organiser workspace</a></div></div></section><section><h2>Icons</h2><div class="actions"><span>${icon('home')} Navigation, 24 px</span><span>${icon('switch')} Control, 20 px</span><span>${icon('info')} Metadata, 16 px</span>${button(icon('switch')+'Try again','explain')}${button(icon('menu'),'explain','quiet','aria-label="Open menu"')}</div></section><section><h2>Status labels</h2><div class="labels"><span>Draft</span><span>Live</span><span>Finalised</span><span>Check-in pending</span><span>Publication blocked</span></div></section><section id="feedback"><h2>Feedback</h2><div class="fl-main">${notice('You are now working in Northside Gaming.','The organisation was changed in another tab, so this tab reloaded.')}${notice('You are offline.','Changes cannot be sent until the connection returns. Nothing you entered has been lost.','warning')}${notice('Results saved.','Standings use them once they are effective.','success')}${notice('The tournament could not be published.','The reference time zone is missing. Your other settings were kept.','danger','<div class="actions"><a class="button" href="#feedback">Choose a time zone</a></div>')}${notice('This section did not load.','Herald may have been updated since you opened it. Reload to get the current version.','info',`<div class="actions">${button('Reload page','explain','primary')}</div>`)}</div></section><section id="navigation"><h2>Navigation links</h2><nav class="fl-nav fl-rail" aria-label="Workspace example"><a href="#navigation" aria-current="page">${icon('home')}Overview</a><a href="#navigation">Tournaments</a><a href="#navigation">Organisation</a></nav></section><section><h2>Error and recovery</h2><p class="help">The first attempt fails and the retry succeeds; the name you enter is kept throughout.</p><div class="fl-field"><label for="recovery-name">Tournament name</label><input id="recovery-name" value="Saturday Open"></div><div class="actions">${button('Publish','recovery','primary')}</div><div id="recovery-result"></div></section>`;
}
function catalogue() {
 const type=state.split('-')[1];
 const samples=type==='dialog'?[
 ['Default',`<h2>Reload the latest entries?</h2><p>Read the latest entries before continuing.</p><div class="actions">${button('Reload latest','explain','primary')}${button('Back','explain')}</div>`],
 ['Destructive confirmation',cancelContents()],['Busy',cancelContents('Robin Vale',true)],['Error inside',cancelContents('Robin Vale',false,true)]
 ]:type==='drawer'?[['Default · search',drawerContents('search','search-')],['Busy',drawerContents('adding','busy-')],['Error inside · input kept',drawerContents('failed','failed-')]]:[];
 return `<main id="main" class="fl-catalogue"><header><p>Development tool · never deployed</p><h1>Herald controls</h1><p>Each shared control in the states the shells use. Hover, press and keyboard focus are live: use the pointer and the Tab key.</p></header><section><h2>${type[0].toUpperCase()+type.slice(1)}</h2>${type==='toast'?`<div class="specimens"><section class="specimen"><h3>Success</h3><div id="sample-success"></div></section><section class="specimen"><h3>Info</h3><div id="sample-info"></div></section><section class="specimen"><h3>Three stacked</h3><div id="sample-stack"></div></section><section class="specimen"><h3>Focused · expiry paused</h3><div id="sample-focus"></div></section></div>`:`<div class="specimens">${samples.map(([label,body],i)=>`<section class="specimen"><h3>${label}</h3><div class="fl-modal ${type==='drawer'?'drawer':''}" aria-label="${label}">${body.replaceAll('id="modal-heading"',`id="sample-heading-${i}"`)}</div></section>`).join('')}</div>`}</section>${catalogueIncumbent()}</main>`;
}
const isConfig=state.startsWith('config-');
const isCatalogue=state.startsWith('catalogue-');
const isEntry=batches[0].includes(state);
document.querySelector('#surface').innerHTML=state==='public-home'?publicHome():isCatalogue?catalogue():shell(isEntry?entries():isConfig?configuration():state.startsWith('list-')?list():state==='review-form'?review():organisation(),state.startsWith('organisation-')||state==='not-found'?'focused':state==='review-form'?'form-only':'');
document.querySelector('#state-links').innerHTML=batches.map((batch,i)=>`<strong>Batch ${i+1}</strong>${batch.map(key=>`<a href="?state=${key}" ${state===key?'aria-current="page"':''}>${key.replaceAll('-',' ')}</a>`).join('')}`).join('');
document.title=`${state.replaceAll('-',' ')} | Herald review`;
document.body.dataset.state=state;
if(state.startsWith('cancel-dialog'))openModal(cancelContents('Robin Vale',state.endsWith('busy'),state.endsWith('failed')),false,state.endsWith('busy'),state.endsWith('busy')?undefined:'[data-action="close"]');
if(state.startsWith('admit-reason'))openModal(reasonContents(state.endsWith('typed')),false,false,'textarea');
if(state.startsWith('add-drawer'))openModal(drawerContents(state.slice('add-drawer-'.length)),true,state.endsWith('adding'),'input');
function discardContents(leaving=false){return `<h2 id="modal-heading">${leaving?'Leave without saving your changes?':'Discard your unsaved input?'}</h2><p>${leaving?'Your unsaved changes will be lost when you leave this page.':'Reloading replaces everything you typed with the latest saved configuration. Your unsaved changes will be lost.'}</p><div class="actions">${button(leaving?'Leave without saving':'Reload latest','discard','destructive')}${button(leaving?'Stay on this page':'Back','close')}</div>`;}
if(state==='config-reload-dialog'||state==='config-leave-dialog')openModal(discardContents(state==='config-leave-dialog'),false,false,'[data-action="close"]');
if(state==='toast-admitted')toast('Ellis Stone admitted.');
if(state==='toast-stack'){toast('Ellis Stone admitted.');toast("Robin Vale's entry cancelled.");toast('Changes saved.','success',true);}
if(state==='config-saved-toast')toast('Changes saved.');
if(state==='catalogue-toast'){
 const sample=id=>document.getElementById(id);
 toast('Ellis Stone admitted.','success',false,sample('sample-success'));
 toast('Changes saved.','info',false,sample('sample-info'));
 ['Ellis Stone admitted.',"Robin Vale's entry cancelled.",'Changes saved.'].forEach(text=>toast(text,'success',false,sample('sample-stack')));
 toast('Changes saved.','success',true,sample('sample-focus'));
}
let presses=0,recoveryFailed=false;
let dirty=isConfig&&['config-conflict','config-reload-dialog','config-leave-dialog','config-rejected'].includes(state);
let pendingNavigation=state==='config-leave-dialog'?'?state=list-wide':'?state=config-published';
document.addEventListener('submit',event=>event.preventDefault());
document.addEventListener('input',event=>{
 if(event.target.id==='admit-reason')document.querySelector('#confirm-admit').disabled=!event.target.value.trim();
 if(event.target.closest('#configuration')){dirty=true;const registration=document.querySelector('#registration-action');if(registration){registration.disabled=true;if(!document.querySelector('#registration-reason'))registration.insertAdjacentHTML('beforebegin','<p class="help" id="registration-reason">Save your changes first.</p>');registration.setAttribute('aria-describedby','registration-reason');}}
});
document.addEventListener('click',event=>{
 const navigation=event.target.closest('.fl-content a.button[href^="?"]');
 if(dirty&&navigation){event.preventDefault();opener=navigation;pendingNavigation=navigation.getAttribute('href');openModal(discardContents(true),false,false,'[data-action="close"]');return;}
 const anchor=event.target.closest('a[href^="#"]');
 if(anchor){const target=document.getElementById(anchor.hash.slice(1));if(target){event.preventDefault();target.focus();target.scrollIntoView({block:'center'});}return;}
 const control=event.target.closest('[data-action]');if(!control||control.disabled)return;
 const action=control.dataset.action;
 const modal=control.closest('dialog');
 if(modal?.dataset.busy==='true')return;
 switch(action){
 case 'account':{const panel=document.querySelector('#account-panel');panel.hidden=!panel.hidden;control.setAttribute('aria-expanded',String(!panel.hidden));break;}
 case 'add':opener=control;openModal(drawerContents('search'),true,false,'input');break;
 case 'cancel':opener=control;openModal(cancelContents(control.dataset.name,false,false,control.dataset.waiting==='true'),false,false,'[data-action="close"]');break;
 case 'admit-reason':opener=control;openModal(reasonContents(),false,false,'textarea');break;
 case 'admit':{const name=control.dataset.name;fixture.waiting=fixture.waiting.filter(value=>value!==name);fixture.admitted.push(name);document.querySelector('.fl-content').innerHTML=entries();toast(name+' admitted.');break;}
 case 'close':closeModal();break;
 case 'reload':opener=control;openModal(discardContents(),false,false,'[data-action="close"]');break;
 case 'discard':location.href=pendingNavigation;break;
 case 'choose-existing':if(modal)openModal(drawerContents('search'),true,false,'input');break;
 case 'choose-new':if(modal)openModal(drawerContents('create'),true,false,'input');break;
 case 'confirm':if(modal){let note=modal.querySelector('.review-operation-note');if(!note){note=document.createElement('p');note.className='help review-operation-note';note.setAttribute('role','status');modal.append(note);}note.textContent='Review only: no request was sent. Your input is kept.';}break;
 case 'dismiss':removeToast(control.closest('.fl-toast'));break;
 case 'public-menu':{const nav=document.querySelector('#public-menu');nav.classList.toggle('open');control.setAttribute('aria-expanded',String(nav.classList.contains('open')));break;}
 case 'save':if(!['config-rejected','config-conflict'].includes(state)){dirty=false;toast(state==='config-draft'?'Draft saved.':'Changes saved.');}break;
 case 'registration':{const area=control.closest('.fl-registration');const closing=control.textContent==='Close registration';area.querySelector('p strong').textContent=closing?'Registration closed':'Registration open';control.textContent=closing?'Reopen registration':'Close registration';toast(closing?'Registration closed.':'Registration open.','info');break;}
 case 'recovery':document.querySelector('#recovery-result').innerHTML=recoveryFailed?notice('Published.',`“${escape(document.querySelector('#recovery-name').value)}” is published.`,'success'):notice('The tournament could not be published.','Herald could not reach the server. Your entry was kept; try again.','danger');recoveryFailed=true;break;
 case 'explain':if(isCatalogue)document.querySelector('#press-count').textContent=++presses;break;
 }
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
 const account=document.querySelector('#account-panel');if(account&&!account.hidden){account.hidden=true;const toggle=document.querySelector('[data-action="account"]');toggle.setAttribute('aria-expanded','false');toggle.focus();}
 const fixtures=document.querySelector('#fixtures');if(fixtures.open){fixtures.open=false;fixtures.querySelector('summary').focus();}
 }
});
window.feedbackLayoutReview={state,keys,batches};
})();
