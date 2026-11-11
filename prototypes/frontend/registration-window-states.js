// Independent deterministic review fixtures; no backend or clock.
const states = Object.fromEntries(['not-open-ready','not-open-missing-dates','unsaved-changes','opening','open','open-failed','closing','closed','conflict','open-date-removed','list-registration-states'].map(key => [key,key.replaceAll('-', ' ')]));
const parameters = new URLSearchParams(location.search);
const state = Object.hasOwn(states, parameters.get('state')) ? parameters.get('state') : 'not-open-ready';
const isTeam = parameters.get('kind') === 'team';
const isPublished = true;
const isEmpty = false;
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/></svg>';
const dateText = value => { const [date,time] = value.split('T'); return `${Number(date.slice(8))} November 2026, ${time}`; };
const registration = ['open','closing','open-date-removed'].includes(state) ? 'Registration open' : state === 'closed' ? 'Registration closed' : 'Registration not open';
const lifecycle = (label = registration) => `<div class="lifecycle" aria-label="Tournament lifecycle"><span>Published</span><span>${label}</span><span>Preparing</span></div>`;
const notice = (title, copy, tone = 'info', extra = '') => `<section class="status ${tone}" role="${tone === 'danger' ? 'alert' : 'status'}"><strong>${icon}${title}</strong><p>${copy}</p>${extra}</section>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const link = (label, target, primary = false) => `<a class="button ${primary ? 'primary' : ''}" href="?state=${target}">${label}</a>`;
const button = (label, explanation, primary = false, extra = '') => `<button type="button" class="${primary ? 'primary' : ''}" data-demo="${escapeHtml(explanation)}" ${extra}>${label}</button>`;
const oldLifecycle = published => `<div class="lifecycle" aria-label="Tournament lifecycle"><span>${published ? 'Published' : 'Draft'}</span><span>Registration not open</span><span>Preparing</span></div>`;
const actions = (...items) => `<div class="actions">${items.join('')}</div>`;
const oldNotice = (title, copy, extra = '', alert = false) => `<section class="status" role="${alert ? 'alert' : 'status'}"><strong>${title}</strong><p>${copy}</p>${extra}</section>`;
const heading = (title, copy, action = '') => `<header class="page-heading"><div><h1>${title}</h1><p class="muted">${copy}</p></div>${action}</header>`;
const profile = 'Single round-robin · 3 / 1 / 0';
const example = {
  title: isTeam ? 'Saturday Team League' : 'Saturday Open',
  game: 'Example strategy · Standard variant',
  kind: isTeam ? 'team' : 'individual',
  capacity: isPublished && !isTeam ? '8' : '16',
  minimum: '5', maximum: '7', active: '5',
  start: isPublished ? (isTeam ? '2026-11-28T10:00' : '2026-11-21T10:00') : '2026-11-14T10:00', opening: '2026-11-10T09:00', closure: '2026-11-13T18:00',
  zone: 'Europe/Madrid', location: 'venue', venue: 'Madrid',
  admission: 'manual', checkin: 'mandatory', visibility: isTeam ? 'private' : 'public'
};
if (state === 'not-open-missing-dates') { example.opening = ''; example.closure = ''; }
const draft = isEmpty ? Object.fromEntries(Object.keys(example).map(key => [key, key === 'kind' ? 'individual' : ''])) : {...example};
if (state === 'not-open-missing-dates') { draft.opening = ''; draft.closure = ''; }
if (state === 'unsaved-changes' || state === 'conflict') draft.venue = 'Madrid · Main hall';
if (state === 'open-date-removed') draft.closure = '';
if (state === 'draft-incomplete') { draft.zone = ''; draft.capacity = ''; }
if (state === 'validation-errors') { draft.maximum = '4'; draft.capacity = '1'; draft.closure = '2026-11-14T12:00'; }
const fixtureErrors = state === 'open-date-removed' ? {closure:'Registration closure is required while registration is open.'} : state === 'validation-errors' ? {
  closure: 'Registration must close no later than the planned start.',
  maximum: 'Maximum roster size must allow at least 5 active players per side.',
  capacity: 'Capacity must be at least 2 teams.'
} : {};
function field(key, label, options = {}) {
  const {type = 'text', help = '', readonly = false, value = draft[key], full = false} = options;
  const error = fixtureErrors[key];
  const written = type === 'datetime-local' && value ? `<p class="help written">${dateText(value)} · Europe/Madrid</p>` : ''; 
  return `<div class="field ${full ? 'full' : ''}"><label for="${key}">${label}</label><input id="${key}" name="${key}" type="${type}" value="${escapeHtml(value)}" ${readonly ? 'readonly' : ''} ${type === 'number' ? 'step="1"' : ''} ${error ? 'aria-invalid="true"' : ''} aria-describedby="${key}-help ${key}-error"><p class="help" id="${key}-help">${help}</p>${written}<p class="error" id="${key}-error" ${error ? '' : 'hidden'}>${error ? icon + 'Error: ' + error : ''}</p></div>`;
}
function selectField(key, label, choices, help = '', full = false) {
  return `<div class="field ${full ? 'full' : ''}"><label for="${key}">${label}</label><select id="${key}" name="${key}" aria-describedby="${key}-help ${key}-error">${choices.map(([value, text]) => `<option value="${value}" ${draft[key] === value ? 'selected' : ''}>${text}</option>`).join('')}</select><p class="help" id="${key}-help">${help}</p><p class="error" id="${key}-error" hidden></p></div>`;
}
const formSection = (title, copy, content, id = '') => `<section class="form-section" ${id ? `id="${id}"` : ''}><h2>${title}</h2><p>${copy}</p><div class="form-grid">${content}</div></section>`;
function configurationForm() {
  const busy = state === 'saving';
  const blocked = ['draft-incomplete', 'validation-errors', 'revision-conflict', 'saving'].includes(state);
  const teamFields = formSection('Team structure', 'Roster size and players taking part on each side are separate limits.',
    field('minimum', 'Minimum roster size', {type:'number', help:'Players required on each team’s roster.'}) +
    field('maximum', 'Maximum roster size', {type:'number', help:'Players allowed on each team’s roster.'}) +
    field('active', 'Active players per side', {type:'number', help:'Players taking part on one side of a match.'}), 'team-fields');
  const details = formSection('Tournament details', 'Published configuration remains editable.',
    field('title', 'Title', {full:true, help:'The tournament name shown when published.'}) +
    field('game', 'Game / variant', {full:true, help:'Free text. The fixture uses an invented generic placeholder.'}) +
    selectField('kind', 'Entry kind', [['individual','Individual'], ['team','Team']], 'Each entry takes one place in the tournament.') +
    field('capacity', `Capacity in ${isTeam ? 'teams' : 'individual entries'}`, {type:'number', help:isTeam ? '16 teams means 16 places, regardless of roster size.' : 'One person per entry. At least 2 places for publication.'}));
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
    selectField('admission', 'Admission', [['','Choose admission'],['automatic','Automatic'],['manual','Manual']], 'Automatic admission or an operator decision.') +
    selectField('checkin', 'Check-in', [['','Choose check-in'],['optional','Optional'],['mandatory','Mandatory']], 'Whether admitted entrants must check in.') +
    selectField('visibility', 'Visibility', [['','Choose visibility'],['public','Public'],['unlisted','Unlisted'],['private','Private']], 'Public: listed. Unlisted: readable by link. Private: owner-only access.', true));
  let controls;
  if (busy) controls = '<button type="button" aria-disabled="true" aria-describedby="operation-status">Saving draft…</button>';
  else if (state === 'revision-conflict') controls = button('Reload latest', 'Reload only after copying or reviewing your retained input. Fetch the latest revision, then explicitly reconcile your changes. Never overwrite silently.', true) + button('Copy your input', 'Copy or export the entered values before loading the latest revision. This prototype does not persist a draft.');
  else controls = button(state === 'save-failed' ? 'Retry save' : isPublished ? 'Save changes' : 'Save draft', 'A real save validates the current revision and authority. Valid input stays in place on failure. This fixture does not persist anything.', true) +
    (isPublished ? '' : blocked ? `<button type="button" aria-disabled="true" aria-describedby="block-reason">Preview publication</button>` : link('Preview publication', isTeam ? 'preview-team' : 'preview-individual'));
  controls += link('Back to tournaments','list-registration-states');
  return `<form id="configuration" class="form-frame" novalidate ${busy ? 'aria-busy="true"' : ''}><fieldset class="fields" ${busy ? 'disabled' : ''}><legend hidden>Tournament configuration</legend>${details}<div id="team-container" ${isTeam ? '' : 'hidden'}>${teamFields}</div>${competition}${dates}${participation}</fieldset><div class="form-actions">${controls}</div></form>`;
}

function registrationArea() {
  const busy = ['opening','closing'].includes(state);
  const blocked = ['not-open-missing-dates','unsaved-changes','conflict','open-date-removed'].includes(state);
  const label = busy ? (state === 'opening' ? 'Opening registration…' : 'Closing registration…') : registration === 'Registration open' ? 'Close registration' : state === 'closed' ? 'Reopen registration' : 'Open registration';
  const reason = state === 'not-open-missing-dates' ? 'Set both registration dates before opening registration.' : ['unsaved-changes','open-date-removed'].includes(state) ? 'Save your changes first' : state === 'conflict' ? 'Reload the latest version and review your retained input first.' : busy ? 'Request in progress. Please wait; do not submit again.' : '';
  let output = `<section class="registration-area" aria-labelledby="registration-heading" ${busy ? 'aria-busy="true"' : ''}><h2 id="registration-heading">Registration</h2><p class="registration-state">${registration}</p><dl class="facts"><div><dt>Announced opening</dt><dd>${example.opening ? dateText(example.opening) : 'Not set'}</dd></div><div><dt>Announced closure</dt><dd>${example.closure ? dateText(example.closure) : 'Not set'}</dd></div><div class="full"><dt>Reference time zone</dt><dd>Europe/Madrid</dd></div></dl><p class="help">These dates are an announcement. Registration changes only with the action below, not automatically at these times.</p>`;
  if (registration === 'Registration open') output += '<p class="audit">Opened by Alex Morgan · 11 November 2026, 09:30 · Europe/Madrid</p>';
  if (state === 'closed') output += '<p class="audit">Closed by Alex Morgan · 13 November 2026, 18:15 · Europe/Madrid</p>';
  if (state === 'open-failed') output += notice('Registration was not opened', 'The request failed. Registration is still not open. Try opening it again.', 'danger');
  if (state === 'conflict') output += notice('This tournament changed elsewhere', 'Nothing was changed by this request. Everything you typed is kept below. Copy what you need, then reload the latest version.', 'danger', '<button type="button" data-demo="Fetch the latest revision and reconcile your retained input before trying again. This snapshot keeps all input.">Reload latest</button>');
  if (state === 'not-open-missing-dates') output += '<ul><li><a href="#opening">Set registration opening</a></li><li><a href="#closure">Set registration closure</a></li></ul>';
  if (reason) output += `<p id="registration-reason" class="help">${reason}</p>`;
  return output + `<button id="registration-action" class="primary" type="button" ${busy || blocked ? 'disabled aria-describedby="registration-reason"' : ''}>${label}</button></section>`;
}
function formView() {
  let output = `<a class="back" href="?state=list-registration-states">Back to tournaments</a><header><h1>${example.title}</h1><p class="tournament-meta">${example.game} · ${isTeam ? 'Team' : 'Individual'} · Madrid</p><p class="tournament-meta">${dateText(example.start)} · Europe/Madrid</p>${lifecycle()}</header>`;
  output += registrationArea();
  output += notice('Published · configuration remains editable', 'Competition is preparing. Saving configuration does not change registration.');
  if (state === 'open-date-removed') output += notice('Correct 1 field to save', 'Nothing was saved. Everything you typed has been kept. Registration remains open.', 'danger', '<ul><li><a href="#closure">Registration closure is required while registration is open</a></li></ul>');
  return output + configurationForm();
}
function listView() {
  const rows = [['Saturday Open','Individual','21','Registration not open','not-open-ready'],['Saturday Open','Individual','21','Registration open','open'],['Saturday Team League','Team','28','Registration closed','closed']];
  return heading('Tournaments', 'Northside Gaming · your organising workspace') + `<ul class="list" aria-label="Organisation tournaments">${rows.map(([title,kind,day,label,target]) => `<li><div><h2>${title}</h2><p class="tournament-meta">${example.game} · ${kind} · Madrid</p><p class="tournament-meta">${day} November 2026, 10:00 · Europe/Madrid</p>${lifecycle(label)}</div><a class="button" href="?state=${target}${kind === 'Team' ? '&kind=team' : ''}">Edit configuration</a></li>`).join('')}</ul>`;
}
const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
const account = `<details class="account"><summary>Alex Morgan ${chevron}</summary><div class="account-panel"><strong>Alex Morgan</strong><small>Signed in with your account provider</small><a class="button" href="access-states.html?state=public-signed-out">Sign out</a></div></details>`;
const content = state === 'list-registration-states' ? listView() : formView();
document.querySelector('#surface').innerHTML = `<div class="admin-layout"><aside class="rail"><a class="brand" href="?state=list-registration-states">HERALD<span>.</span></a><div class="org"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">Switch organisation</a></div><nav aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="?state=list-registration-states" aria-current="page">Tournaments</a></nav></aside><main id="main" class="admin-main" tabindex="-1"><header class="admin-top"><span class="muted">Organiser workspace</span>${account}</header><div class="admin-content">${content}<p id="feedback" class="status" role="status" hidden></p></div></main></div>`;
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
document.querySelector('#configuration')?.addEventListener('submit', event => event.preventDefault());
function updateEntryKind() {
  const team = document.querySelector('#kind').value === 'team';
  const container = document.querySelector('#team-container');
  container.hidden = !team;
  container.querySelectorAll('input').forEach(input => { input.disabled = !team; });
  document.querySelector('label[for="capacity"]').textContent = 'Capacity in ' + (team ? 'teams' : 'individual entries');
  document.querySelector('#capacity-help').textContent = team ? '16 teams means 16 places, regardless of roster size.' : 'One person per entry. At least 2 places for publication.';
}
if (document.querySelector('#kind')) {
  document.querySelector('#kind').addEventListener('change', updateEntryKind);
  updateEntryKind();
}
function updateLocation() {
  const input = document.querySelector('#venue');
  const online = document.querySelector('#location').value === 'online';
  input.closest('.field').hidden = online;
  input.disabled = online;
}
if (document.querySelector('#location')) {
  document.querySelector('#location').addEventListener('change', updateLocation);
  updateLocation();
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', () => {
  const target = document.getElementById(anchor.hash.slice(1));
  target?.focus();
}));

const action = document.querySelector('#registration-action');
action?.addEventListener('click', () => { if (!action.disabled) location.search = '?state=' + (registration === 'Registration open' ? 'closing' : 'opening') + (isTeam ? '&kind=team' : ''); });
document.querySelector('#configuration')?.addEventListener('input', () => {
  action.disabled = true;
  let reason = document.querySelector('#registration-reason');
  if (!reason) { reason = document.createElement('p'); reason.id = 'registration-reason'; reason.className = 'help'; action.before(reason); }
  reason.textContent = 'Save your changes first'; action.setAttribute('aria-describedby', reason.id);
});
