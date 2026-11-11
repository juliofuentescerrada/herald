// Independent deterministic review fixtures. No clock, API or persistence.
const keys = ['entries-empty-open','entries-not-open','entries-automatic-full','entries-manual-team','entries-closed','add-existing','add-new','add-duplicate','adding','add-failed','admit-unavailable','admit-out-of-order','cancel-confirm','cancel-confirm-closed','conflict','over-capacity','loading','failed','entries-link','fields-locked','capacity-rejected','list-with-entries'];
const states = Object.fromEntries(keys.map(key => [key,key.replaceAll('-', ' ')]));
const parameters = new URLSearchParams(location.search);
const state = Object.hasOwn(states,parameters.get('state')) ? parameters.get('state') : 'entries-empty-open';
const isTeam = state === 'entries-manual-team' || parameters.get('kind') === 'team';
const isPublished = true;
const configurationStates = ['entries-link','fields-locked','capacity-rejected'];
const registration = state === 'entries-not-open' ? 'Registration not open' : ['entries-closed','cancel-confirm-closed','admit-out-of-order'].includes(state) ? 'Registration closed' : 'Registration open';
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/></svg>';
const dateText = value => {const [date,time] = value.split('T'); return `${Number(date.slice(8))} November 2026, ${time}`;};
const lifecycle = (label = registration,published = true) => `<div class="lifecycle" aria-label="Tournament lifecycle"><span>${published ? 'Published' : 'Draft'}</span><span>${label}</span><span>Preparing</span></div>`;
const notice = (title,copy,tone='info',extra='') => `<section class="status ${tone}" role="${tone==='danger'?'alert':'status'}"><strong>${icon}${title}</strong><p>${copy}</p>${extra}</section>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const link = (label, target, primary = false) => `<a class="button ${primary ? 'primary' : ''}" href="?state=${target}">${label}</a>`;
const button = (label, explanation, primary = false, extra = '') => `<button type="button" class="${primary ? 'primary' : ''}" data-demo="${escapeHtml(explanation)}" ${extra}>${label}</button>`;
const heading = (title, copy, action = '') => `<header class="page-heading"><div><h1>${title}</h1><p class="muted">${copy}</p></div>${action}</header>`;
const profile = 'Single round-robin · 3 / 1 / 0';
const example = {title:isTeam ? 'Saturday Team League':'Saturday Open',game:'Example strategy · Standard variant',kind:isTeam?'team':'individual',capacity:isTeam?'4':'8',start:isTeam?'2026-11-28T10:00':'2026-11-21T10:00',opening:'2026-11-10T09:00',closure:'2026-11-13T18:00',zone:'Europe/Madrid',location:'venue',venue:'Madrid',admission:!isTeam && ['entries-empty-open','entries-not-open','entries-automatic-full','admit-unavailable','admit-out-of-order','cancel-confirm','cancel-confirm-closed','over-capacity','entries-closed'].includes(state)?'automatic':'manual',visibility:'public'};
const draft = {...example};
if (state === 'capacity-rejected') draft.capacity = '2';
const fixtureErrors = state === 'capacity-rejected' ? {capacity:'Capacity must be at least 3: admitted entries.'} : {};
function field(key, label, options = {}) {
  const {type = 'text', help = '', readonly = false, value = draft[key], full = false} = options;
  const error = fixtureErrors[key];
  const written = type === 'datetime-local' && value ? `<p class="help written">${dateText(value)} · Europe/Madrid</p>` : ''; 
  return `<div class="field ${full ? 'full' : ''}"><label for="${key}">${label}</label><input id="${key}" name="${key}" type="${type}" value="${escapeHtml(value)}" ${readonly ? 'readonly' : ''} ${type === 'number' ? 'step="1"' : ''} ${error ? 'aria-invalid="true"' : ''} aria-describedby="${key}-help ${key}-error"><p class="help" id="${key}-help">${help}</p>${written}<p class="error" id="${key}-error" ${error ? '' : 'hidden'}>${error ? icon + 'Error: ' + error : ''}</p></div>`;
}
function selectField(key, label, choices, help = '', full = false) {
  return `<div class="field ${full ? 'full' : ''}"><label for="${key}">${label}</label><select ${["kind","admission"].includes(key) ? 'disabled' : ''} id="${key}" name="${key}" aria-describedby="${key}-help ${key}-error">${choices.map(([value, text]) => `<option value="${value}" ${draft[key] === value ? 'selected' : ''}>${text}</option>`).join('')}</select><p class="help" id="${key}-help">${help}</p><p class="error" id="${key}-error" hidden></p></div>`;
}
const formSection = (title, copy, content, id = '') => `<section class="form-section" ${id ? `id="${id}"` : ''}><h2>${title}</h2><p>${copy}</p><div class="form-grid">${content}</div></section>`;
function configurationForm() {
  const details = formSection('Tournament details', 'Published configuration remains editable.',
    field('title', 'Title', {full:true, help:'The tournament name shown when published.'}) +
    field('game', 'Game / variant', {full:true, help:'Free text. The fixture uses an invented generic placeholder.'}) +
    selectField('kind', 'Entry kind', [['individual','Individual'], ['team','Team']], 'Entries exist') +
    field('capacity', `Capacity in ${isTeam ? 'teams' : 'individual entries'}`, {type:'number', help:'At least 3: admitted entries'}));
  const competition = formSection('Competition profile', 'This H1 profile is fixed; points are not edited per tournament.',
    field('profile', 'Competition profile', {value:profile, readonly:true, full:true, help:'Win 3 · Draw 1 · Loss 0. Equal points share a position. Draws are allowed.'}));
  const dates = formSection('Dates and location', 'All three times use the reference time zone. A planned date does not start competition.',
    field('opening', 'Registration opening', {type:'datetime-local', help:'Planned opening; publication does not open registration.'}) +
    field('closure', 'Registration closure', {type:'datetime-local', help:'Must not be later than the planned start.'}) +
    field('start', 'Planned start', {type:'datetime-local', help:'The announced start date and time.'}) +
    selectField('zone', 'Reference time zone', [['','Choose a time zone'],['Europe/Madrid','Europe/Madrid']], 'Times above are interpreted in this zone.') +
    selectField('location', 'Location mode', [['','Choose a location mode'],['venue','On-site venue'],['online','Online']], 'Choose a venue or an online tournament.') +
    field('venue', 'Venue', {help:'City or venue name for an on-site tournament.'}));
  const participation = formSection('Admission and visibility', 'These fixture choices illustrate the controls; they approve no product default.',
    selectField('admission', 'Admission', [['','Choose admission'],['automatic','Automatic'],['manual','Manual']], 'Entries exist') +
    selectField('visibility', 'Visibility', [['','Choose visibility'],['public','Public'],['unlisted','Unlisted'],['private','Private']], 'Public: listed. Unlisted: readable by link. Private: owner-only access.', true));
  const controls = button('Save changes','A real save validates the current revision. Input stays in place on failure. This fixture does not persist anything.',true) + link('Back to tournaments','list-with-entries');
  return `<form id="configuration" class="form-frame" novalidate><fieldset class="fields"><legend hidden>Tournament configuration</legend>${details}${competition}${dates}${participation}</fieldset><div class="form-actions">${controls}</div></form>`;
}

function registrationArea() {
  const label = registration === 'Registration open' ? 'Close registration' : registration === 'Registration closed' ? 'Reopen registration' : 'Open registration';
  let output = `<section class="registration-area" aria-labelledby="registration-heading" ><h2 id="registration-heading">Registration</h2><p class="registration-state">${registration}</p><dl class="facts"><div><dt>Announced opening</dt><dd>${example.opening ? dateText(example.opening) : 'Not set'}</dd></div><div><dt>Announced closure</dt><dd>${example.closure ? dateText(example.closure) : 'Not set'}</dd></div><div class="full"><dt>Reference time zone</dt><dd>Europe/Madrid</dd></div></dl><p class="help">These dates are an announcement. Registration changes only with the action below, not automatically at these times.</p>`;
  if (registration === 'Registration open') output += '<p class="audit">Opened 11 November 2026, 09:30 · Europe/Madrid</p>';
  if (registration === 'Registration closed') output += '<p class="audit">Closed 13 November 2026, 18:15 · Europe/Madrid</p>';
  return output + `<button id="registration-action" class="primary" type="button">${label}</button></section>`;
}

const players = ['Robin Vale','Sam Reed','Jamie Brook','Taylor Finch','Casey Wood','Drew Hill','Avery Lane','Morgan Field','Parker Snow'];
const teams = ['North Stars','River Falcons','Meadow Foxes','Cedar Owls','Harbour Lights'];
const names = isTeam ? teams : players;
const empty = ['entries-empty-open','entries-not-open'].includes(state);
const full = ['entries-automatic-full','admit-unavailable','cancel-confirm','cancel-confirm-closed'].includes(state);
const admitted = empty ? 0 : state === 'over-capacity' ? 9 : state === 'admit-out-of-order' ? 7 : full ? 8 : 3;
const waiting = empty ? [] : isTeam ? ['Cedar Owls','Harbour Lights'] : full || state === 'admit-out-of-order' ? ['Ellis Stone','Rowan Lake'] : ['Ellis Stone'];
const unit = isTeam ? 'teams':'individual entries';
const addLabel = isTeam ? 'Add team':'Add player';
const kindName = isTeam ? 'team':'player';
const back = () => link('Back to entries',isTeam?'entries-manual-team':'entries-closed');
function tournamentHeader(entries=false) {
 return `<a class="back" href="?state=${entries?'entries-link':'list-with-entries'}">${entries?'Back to configuration':'Back to tournaments'}</a><h1>${entries?'Entries · ':''}${example.title}</h1><p class="tournament-meta">${example.game} · ${isTeam?'Team':'Individual'} · Madrid</p><p class="tournament-meta">${dateText(example.start)} · Europe/Madrid</p>${lifecycle()}`;
}
function formView(){
 let result = tournamentHeader() + registrationArea() + notice('Published · configuration remains editable','Competition is preparing. Saving configuration does not change registration.');
 result += `<section class="entry-link"><h2>Entries</h2><p>${isTeam?'3 of 4 teams admitted · 2 waiting':'3 of 8 individual entries admitted · 1 waiting'}</p>${link('View entries',isTeam?'entries-manual-team':'entries-closed')}</section>`;
 if(state==='capacity-rejected') result += notice('Correct 1 field to save','Nothing was saved. Everything you typed has been kept.','danger','<ul><li><a href="#capacity">Capacity: must be at least 3 admitted entries</a></li></ul>');
 return result + configurationForm();
}
function addPanel(){
 if(!['add-existing','add-new','add-duplicate','adding','add-failed'].includes(state))return '';
 const existing = state==='add-existing', busy=state==='adding', duplicate=state==='add-duplicate';
 return `<section class="operation" aria-labelledby="add-heading" ${busy?'aria-busy="true"':''}><h2 id="add-heading">${addLabel}</h2><p class="help">Choose a guest of Northside Gaming or create a new ${kindName}.</p><div class="actions">${link('Choose existing','add-existing'+(isTeam?'&kind=team':''))}${link('Create new','add-new'+(isTeam?'&kind=team':''))}</div><form id="add-form"><div class="field"><label for="guest-name">${existing?'Search by name':'Name (alias)'}</label><input id="guest-name" name="name" maxlength="80" value="${existing?(isTeam?'Bir':'Qui'):duplicate?(isTeam?'birch kites':'quinn ash'):isTeam?'Oak Comets':'Reese Moss'}" ${busy?'readonly':''} aria-describedby="name-help"><p id="name-help" class="help">${existing?'Only '+kindName+' guests in Northside Gaming.':'1–80 characters after trimming. Review the name before creating the guest.'}</p></div>${state==='add-failed'?notice('Entry was not added','The request failed. Nothing was added. Your input is kept; try again.','danger'):''}${duplicate?notice('Possible duplicate','These '+kindName+' guests have the same name ignoring case, accents and spaces. Choose one or create a separate guest. Nothing will be merged.'):''}${existing||duplicate?`<ul class="list guest-results"><li><div><h3>${isTeam?'Birch Kites':'Quinn Ash'}</h3><p class="help">Existing ${kindName} · Northside Gaming · Guest 014</p></div>${button('Enter this '+kindName,'Would enter the selected organisation guest. No duplicate guest is created.',true)}</li></ul>`:''}${busy?'<p role="status" class="help">Adding entry. Please wait; do not submit again.</p>':''}<div class="actions">${existing?'':button(busy?'Adding…':duplicate?'Create a new '+kindName+' anyway':state==='add-failed'?'Retry add':'Create and enter '+kindName,'Would create and enter a distinct guest; this fixture sends nothing.',!duplicate,busy?'disabled':'')}${back()}</div></form></section>`;
}
function confirmation(){
 if(state==='admit-out-of-order') return `<section class="operation" aria-labelledby="reason-heading"><h2 id="reason-heading">Admit Rowan Lake ahead of Ellis Stone?</h2><p>One slot is free. Ellis Stone is earlier in the capacity queue. Registration is closed, so no entry is admitted automatically.</p><form id="reason-form"><label for="reason">Private reason (required)</label><textarea id="reason" required aria-describedby="reason-help"></textarea><p id="reason-help" class="help">Record why you are departing from queue order. This reason is private.</p><div class="actions"><button class="primary" id="confirm-admit" disabled aria-describedby="reason-help">Admit Rowan Lake</button>${back()}</div></form></section>`;
 if(!['cancel-confirm','cancel-confirm-closed'].includes(state))return '';
 return `<section class="operation" aria-labelledby="cancel-heading"><h2 id="cancel-heading">Cancel Robin Vale’s entry?</h2><p>This cancellation is final for this entry. Entering Robin Vale again creates a new entry at the back of the queue.</p>${notice('Effect on the waiting list',state==='cancel-confirm'?'Ellis Stone, first in the capacity queue, will be admitted automatically when this slot is freed.':'No waiting entry will be admitted automatically because registration is closed. You can admit a waiting entry afterwards.')}<div class="actions">${button('Confirm cancellation','Would cancel Robin Vale’s entry after checking the current revision.',true)}${link('Keep entry',state==='cancel-confirm'?'entries-automatic-full':'entries-closed')}</div></section>`;
}
function group(label,items){
 return `<section class="entry-group"><h2>${label} · ${items.length}</h2>${items.length?`<${label==='Waiting'?'ol':'ul'} class="list" aria-label="${label} entries">${items.map((name,index)=>{const blocked=full||state==='over-capacity';return `<li><div><h3>${label==='Waiting'?`${index+1}. `:''}${name}</h3><p class="help">${label==='Waiting'?(example.admission==='manual'?'Admission pending':'Capacity full')+' · Waiting since 11 November 2026, '+(index?'10:05':'10:00')+' · Europe/Madrid':label==='Cancelled'?'Cancelled · 11 November 2026, 09:45 · Europe/Madrid':'Admitted'}</p>${label==='Waiting'&&blocked?`<p id="admit-reason-${index}" class="help">${state==='over-capacity'?'Field is over capacity. Cancel an admitted entry first.':'No free slot. Cancel an admitted entry or increase capacity.'}</p>`:''}</div>${label==='Cancelled'?'':`<div class="actions">${label==='Waiting'?blocked?`<button disabled aria-describedby="admit-reason-${index}">Admit</button>`:index && example.admission==='automatic' ? link('Admit','admit-out-of-order') : button('Admit','Would admit this waiting entry into a free slot, checking its current revision.'):''}${name==='Robin Vale'?link('Cancel entry',registration==='Registration closed'?'cancel-confirm-closed':'cancel-confirm'):`<button type="button" data-cancel="${name}" data-entry-state="${label}">Cancel entry</button>`}</div>`}</li>`}).join('')}</${label==='Waiting'?'ol':'ul'}>`:`<p class="help">No ${label.toLowerCase()} entries.</p>`}</section>`;
}
function entriesView(){
 let result=tournamentHeader(true);
 if(state==='loading')return result+'<section class="operation" role="status" aria-busy="true"><h2>Loading entries…</h2><p>Please wait while the tournament field is loaded.</p></section>';
 if(state==='failed')return result+notice('Entries could not be loaded','No entries are shown. Try loading the field again.','danger',button('Try again','Would reload the field; no stale rows are shown.',true));
 const blocked=registration!=='Registration open'||state==='over-capacity'||state==='conflict'||state==='adding';
 const reason=state==='adding'?'Request in progress. Please wait; do not submit again.':state==='over-capacity'?'Field is over capacity. Cancel an admitted entry before adding or admitting.':state==='conflict'?'Reload the latest version first.':registration==='Registration closed'?'Registration is closed. Reopen registration in configuration to add entries.':'Registration is not open. Open registration in configuration to add entries.';
 result+=`<section class="entries-summary"><div><h2>${admitted} of ${example.capacity} ${unit}</h2><p class="help">${example.admission==='manual'?'Manual':'Automatic'} admission · ${waiting.length} waiting</p><p class="help">Counts and entry terms updated 11 November 2026, 10:10 · Europe/Madrid</p></div><div>${blocked?`<button disabled aria-describedby="add-reason">${addLabel}</button><p class="help" id="add-reason">${reason}</p>`:link(addLabel,'add-existing'+(isTeam?'&kind=team':''),true)}</div></section>`;
 if(state==='conflict')result+=notice('This entry changed elsewhere','Nothing changed with this request. Reload the latest entries before trying again.','danger',button('Reload latest','Would fetch current entries before another operation.'));
 if(state==='over-capacity')result+=notice('Field is over capacity','9 admitted entries exceed the capacity of 8. Crossed changes left this mismatch. Nothing was removed automatically. Cancel an admitted entry to resolve it. Adding and admitting are blocked.','danger');
 result+=addPanel()+confirmation()+'<div id="inline-operation"></div>';
 if(empty)result+='<section class="empty-state"><h2>No entries yet</h2><p>Admitted and waiting entries will appear here. Each individual entry takes one slot.</p></section>';
 return result+group('Admitted',names.slice(0,admitted))+group('Waiting',waiting)+group('Cancelled',empty?[]:[isTeam?'West Winds':'Blair Moss']);
}
function listView(){
 return heading('Tournaments','Northside Gaming · your organising workspace')+`<ul class="list" aria-label="Organisation tournaments">${[['Saturday Open',false,false],['Saturday Team League',true,false],['Saturday Open',false,true]].map(([title,team,draftRow])=>`<li><div><h2>${title}</h2><p class="tournament-meta">${example.game} · ${team?'Team':'Individual'} · Madrid</p><p class="tournament-meta">${draftRow?'14':team?'28':'21'} November 2026, 10:00 · Europe/Madrid</p>${lifecycle(team?'Registration closed':draftRow?'Registration not open':'Registration open',!draftRow)}<span class="capacity">${draftRow?'Capacity: 16 individual entries':team?'3 of 4 teams admitted · 2 waiting':'3 of 8 individual entries admitted · 1 waiting'}</span></div><div class="actions">${draftRow?'<a class="button" href="tournament-setup-states.html?state=edit-individual-draft">Continue draft</a>':link('Edit configuration','fields-locked'+(team?'&kind=team':''))}${draftRow?'':link('Entries',team?'entries-manual-team':'entries-closed')}</div></li>`).join('')}</ul>`;
}
const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
const account = `<details class="account"><summary>Alex Morgan ${chevron}</summary><div class="account-panel"><strong>Alex Morgan</strong><small>Signed in with your account provider</small><a class="button" href="access-states.html?state=public-signed-out">Sign out</a></div></details>`;
const content = state === 'list-with-entries' ? listView() : configurationStates.includes(state) ? formView() : entriesView();
document.querySelector('#surface').innerHTML = `<div class="admin-layout"><aside class="rail"><a class="brand" href="?state=list-with-entries">HERALD<span>.</span></a><div class="org"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">Switch organisation</a></div><nav aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="?state=list-with-entries" aria-current="page">Tournaments</a></nav></aside><main id="main" class="admin-main" tabindex="-1"><header class="admin-top"><span class="muted">Organiser workspace</span>${account}</header><div class="admin-content">${content}<p id="feedback" class="status" role="status" hidden></p></div></main></div>`;
document.querySelector('#state-links').innerHTML = Object.entries(states).map(([key,label]) => `<a href="?state=${key}" ${key===state ? 'aria-current="page"' : ''}>${label}</a>`).join('');
document.title = `${states[state]} | Herald review`;
document.querySelectorAll('details').forEach(details => details.addEventListener('keydown', event => {
  if (event.key === 'Escape') { details.open = false; details.querySelector('summary').focus(); }
}));
document.querySelectorAll('[data-demo]').forEach(control => control.addEventListener('click', () => {
  const feedback = document.querySelector('#feedback');
  feedback.textContent = 'Review only: ' + control.dataset.demo;
  feedback.hidden = false;
}));

document.querySelectorAll('form').forEach(form => form.addEventListener('submit',event=>event.preventDefault()));
document.querySelector('#reason')?.addEventListener('input',event=>{document.querySelector('#confirm-admit').disabled=!event.target.value.trim();});
document.querySelector('#confirm-admit')?.addEventListener('click',()=>{document.querySelector('#feedback').hidden=false;document.querySelector('#feedback').textContent='Review only: admission would record the private reason and check the latest entry revision.';});
document.querySelectorAll('a[href^="#"]').forEach(anchor=>anchor.addEventListener('click',()=>document.getElementById(anchor.hash.slice(1))?.focus()));
const registrationAction=document.querySelector('#registration-action');
registrationAction?.addEventListener('click',()=>{const feedback=document.querySelector('#feedback');feedback.hidden=false;feedback.textContent='Review only: registration changes by an explicit owner action, independently of saving configuration.';});
document.querySelector('#configuration')?.addEventListener('input',()=>{registrationAction.disabled=true;let reason=document.querySelector('#registration-reason');if(!reason){reason=document.createElement('p');reason.id='registration-reason';reason.className='help';registrationAction.before(reason);}reason.textContent='Save your changes first.';registrationAction.setAttribute('aria-describedby',reason.id);});

// Contextual confirmation for rows other than the named confirmation snapshots.
document.querySelectorAll('[data-cancel]').forEach(control=>control.addEventListener('click',()=>{
 const name=control.dataset.cancel;
 const promotion=control.dataset.entryState==='Waiting'?'No slot is freed by cancelling a waiting entry. No waiting entry will be admitted.':example.admission==='manual'?'No waiting entry will be admitted automatically because admission is manual.':registration==='Registration closed'?'No waiting entry will be admitted automatically because registration is closed.':waiting.length?`${waiting[0]}, first in the capacity queue, will be admitted automatically.`:'No waiting entry is available to admit.';
 const panel=document.querySelector('#inline-operation');
 panel.innerHTML=`<section class="operation" aria-labelledby="inline-heading"><h2 id="inline-heading" tabindex="-1">Cancel ${escapeHtml(name)}’s entry?</h2><p>This cancellation is final for this entry. Entering again creates a new entry at the back of the queue.</p>${notice('Effect on the waiting list',promotion)}<div class="actions"><button class="primary" type="button" id="inline-confirm">Confirm cancellation</button><button type="button" id="inline-keep">Keep entry</button></div></section>`;
 panel.querySelector('h2').focus();
 panel.querySelector('#inline-keep').addEventListener('click',()=>{panel.innerHTML='';control.focus();});
 panel.querySelector('#inline-confirm').addEventListener('click',()=>{const feedback=document.querySelector('#feedback');feedback.hidden=false;feedback.textContent='Review only: cancellation would check the latest revision before applying the stated consequence.';});
}));
