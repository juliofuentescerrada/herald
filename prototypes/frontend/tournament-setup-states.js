// Documentation fixtures only: query parameters select independent snapshots.
// No network, persistence, authentication or production command is implemented.
const states = {
  'list-empty': 'Tournament list · empty',
  'list-populated': 'Tournament list · populated',
  'list-loading': 'Tournament list · loading',
  'list-failed': 'Tournament list · failed',
  'create-individual': 'New individual draft · empty',
  'edit-individual-draft': 'Individual draft · saved',
  'edit-team-draft': 'Team draft · saved',
  'draft-incomplete': 'Draft · publication blocked',
  'validation-errors': 'Team draft · validation errors',
  'saving': 'Draft · saving',
  'save-failed': 'Draft · save failed',
  'revision-conflict': 'Draft · revision conflict',
  'preview-individual': 'Individual · publication preview',
  'preview-team': 'Team · publication preview',
  'publishing': 'Draft · publishing',
  'publish-failed': 'Draft · publication failed',
  'published-individual': 'Published individual · configuration',
  'published-team': 'Published team · configuration'
};
const parameters = new URLSearchParams(location.search);
const state = Object.hasOwn(states, parameters.get('state')) ? parameters.get('state') : 'list-empty';
const isTeam = ['edit-team-draft', 'validation-errors', 'preview-team', 'published-team'].includes(state);
const isPublished = state.startsWith('published-');
const isEmpty = state === 'create-individual';
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const link = (label, target, primary = false) => `<a class="button ${primary ? 'primary' : ''}" href="?state=${target}">${label}</a>`;
const button = (label, explanation, primary = false, extra = '') => `<button type="button" class="${primary ? 'primary' : ''}" data-demo="${escapeHtml(explanation)}" ${extra}>${label}</button>`;
const lifecycle = published => `<div class="lifecycle" aria-label="Tournament lifecycle"><span>${published ? 'Published' : 'Draft'}</span><span>Registration not open</span><span>Preparing</span></div>`;
const actions = (...items) => `<div class="actions">${items.join('')}</div>`;
const notice = (title, copy, extra = '', alert = false) => `<section class="status" role="${alert ? 'alert' : 'status'}"><strong>${title}</strong><p>${copy}</p>${extra}</section>`;
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
const draft = isEmpty ? Object.fromEntries(Object.keys(example).map(key => [key, key === 'kind' ? 'individual' : ''])) : {...example};
if (state === 'draft-incomplete') { draft.zone = ''; draft.capacity = ''; }
if (state === 'validation-errors') { draft.maximum = '4'; draft.capacity = '1'; draft.closure = '2026-11-14T12:00'; }
const fixtureErrors = state === 'validation-errors' ? {
  closure: 'Registration must close no later than the planned start.',
  maximum: 'Maximum roster size must allow at least 5 active players per side.',
  capacity: 'Capacity must be at least 2 teams.'
} : {};
function field(key, label, options = {}) {
  const {type = 'text', help = '', readonly = false, value = draft[key], full = false} = options;
  const error = fixtureErrors[key];
  return `<div class="field ${full ? 'full' : ''}"><label for="${key}">${label}</label><input id="${key}" name="${key}" type="${type}" value="${escapeHtml(value)}" ${readonly ? 'readonly' : ''} ${type === 'number' ? 'step="1"' : ''} ${error ? 'aria-invalid="true"' : ''} aria-describedby="${key}-help ${key}-error"><p class="help" id="${key}-help">${help}</p><p class="error" id="${key}-error" ${error ? '' : 'hidden'}>${error || ''}</p></div>`;
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
  const details = formSection('Tournament details', 'A draft can be saved before all publication requirements are complete.',
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
  controls += link('Back to tournaments','list-populated');
  return `<form id="configuration" class="form-frame" novalidate ${busy ? 'aria-busy="true"' : ''}><fieldset class="fields" ${busy ? 'disabled' : ''}><legend hidden>Tournament configuration</legend>${details}<div id="team-container" ${isTeam ? '' : 'hidden'}>${teamFields}</div>${competition}${dates}${participation}</fieldset><div class="form-actions">${controls}</div></form>`;
}
function tournamentHeader(title = example.title, published = isPublished) {
  return `<header><h1>${title}</h1><p class="tournament-meta">${example.game} · ${isTeam ? 'Team' : 'Individual'} · Madrid</p><p class="tournament-meta">${isPublished ? (isTeam ? '28' : '21') : '14'} November 2026, 10:00 · Europe/Madrid</p>${lifecycle(published)}</header>`;
}
function formView() {
  let output = '<a class="back" href="?state=list-populated">Back to tournaments</a>';
  output += isPublished ? tournamentHeader() : heading(isEmpty ? 'Create tournament' : `Configure ${example.title}`, isEmpty ? 'Start a new individual draft in Northside Gaming.' : 'Draft configuration · Northside Gaming · not yet published');
  if (!isEmpty && !isPublished) output += lifecycle(false);
  if (state === 'draft-incomplete') output += notice('Publication is blocked', 'Your other input is kept. Complete these fields before publication.', '<ul><li><a href="#zone">Choose a reference time zone</a></li><li><a href="#capacity">Set entry capacity</a></li></ul><p id="block-reason">Publish is unavailable until the reference time zone and capacity are complete.</p><button type="button" aria-disabled="true" aria-describedby="block-reason">Publish</button>');
  if (state === 'validation-errors') output += notice('Correct 3 fields before publication', 'Your other configuration has been kept.', '<ul><li><a href="#closure">Registration closure is after the planned start</a></li><li><a href="#maximum">Maximum roster size is below active players per side</a></li><li><a href="#capacity">Capacity is below 2 teams</a></li></ul><p id="block-reason">Preview publication is unavailable while these errors remain.</p>', true);
  if (state === 'saving') output += notice('Saving draft', 'Please wait. Your input remains visible; a second save is unavailable.', '<p id="operation-status">Save in progress. This is not a success confirmation.</p><p id="block-reason">Preview is unavailable until saving completes.</p>');
  if (state === 'save-failed') output += notice('Draft could not be saved', 'Your input is still here. Try saving again; publication has not changed.', '', true);
  if (state === 'revision-conflict') output += notice('This draft changed elsewhere', 'Your input is kept below. The server has a newer revision. Reload the latest version and review the differences before saving.', '<p id="block-reason">Saving and publication are blocked to prevent a silent overwrite.</p>', true);
  if (isPublished) output += notice('Published · configuration remains editable', 'Registration is still not open and competition is preparing. Saving configuration does not open registration.');
  output += configurationForm();
  return output;
}
const facts = rows => `<dl class="facts">${rows.map(([label, value, full]) => `<div class="${full ? 'full' : ''}"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const summarySection = (title, rows) => `<section class="summary-section"><h2>${title}</h2>${facts(rows)}</section>`;
function previewView() {
  const busy = state === 'publishing';
  const failed = state === 'publish-failed';
  let output = '<a class="back" href="?state=' + (isTeam ? 'edit-team-draft' : 'edit-individual-draft') + '">Back to configuration</a>';
  output += heading('Review before publishing', 'Read-only configuration summary · Northside Gaming');
  output += lifecycle(false);
  if (busy) output += notice('Publishing tournament', 'Please wait. The tournament is still shown as a draft until publication is confirmed.', '<p id="operation-status">Publication in progress. A second submission is unavailable.</p>');
  if (failed) output += notice('Tournament was not published', 'Publication failed. This tournament remains a draft. Your saved configuration is unchanged; retry when ready.', '', true);
  output += `<article class="form-frame" ${busy ? 'aria-busy="true"' : ''}>${summarySection('Tournament details', [['Title', example.title],['Organisation','Northside Gaming'],['Game / variant',example.game],['Entry kind',isTeam?'Team':'Individual'],['Capacity',isTeam?'16 teams':'16 individual entries']])}${isTeam ? summarySection('Team structure', [['Minimum roster size','5 players'],['Maximum roster size','7 players'],['Active players per side','5 players']]) : ''}${summarySection('Competition profile', [['Profile',profile,true],['Scoring','Win 3 · Draw 1 · Loss 0'],['Equal points','Shared position']])}${summarySection('Dates and location', [['Registration opening','10 November 2026, 09:00'],['Registration closure','13 November 2026, 18:00'],['Planned start','14 November 2026, 10:00'],['Reference time zone','Europe/Madrid'],['Location','On-site · Madrid']])}${summarySection('Admission and visibility', [['Admission','Manual'],['Check-in','Mandatory'],['Visibility',isTeam?'Private — only this organisation’s owner can read private content. A link alone grants no access.':'Public — appears in discovery when published; anyone can read published information.',true]])}<p class="preview-intent"><strong>Publishing keeps registration not open.</strong> It creates no entries, pairings or play. There is no unpublish action.</p><div class="form-actions">${busy ? '<button type="button" aria-disabled="true" aria-describedby="operation-status">Publishing…</button>' : link(failed ? 'Retry publication' : 'Publish tournament', 'publishing', true)}${busy ? '' : link('Edit configuration',isTeam?'edit-team-draft':'edit-individual-draft')}</div></article>`;
  return output;
}
function listView() {
  const canCreate = ['list-populated'].includes(state);
  let output = heading('Tournaments', 'Northside Gaming · your organising workspace', canCreate ? link('Create tournament','create-individual',true) : '');
  if (state === 'list-empty') return output + `<section class="empty-state"><h2>No tournaments yet</h2><p>Create a draft, complete its configuration and review it before publication.</p>${actions(link('Create tournament','create-individual',true))}</section>`;
  if (state === 'list-loading') return output + `<section class="empty-state" aria-busy="true"><h2>Loading tournaments</h2><p role="status">Checking this organisation’s tournaments. Please wait.</p><div class="progress" aria-hidden="true"><span></span></div></section>`;
  if (state === 'list-failed') return output + `<section class="empty-state"><h2>Tournaments could not be loaded</h2><p role="alert">Herald could not load the list. No stale tournament data is shown.</p>${actions(link('Try again','list-loading',true))}</section>`;
  const rows = [
    {title:'Saturday Open', mode:'Individual', date:'14 November 2026', capacity:'16 individual entries', published:false, next:'edit-individual-draft'},
    {title:'Saturday Open', mode:'Individual', date:'21 November 2026', capacity:'8 individual entries', published:true, next:'published-individual'},
    {title:'Saturday Team League', mode:'Team', date:'28 November 2026', capacity:'16 teams', published:true, next:'published-team'}
  ];
  return output + `<ul class="list" aria-label="Organisation tournaments">${rows.map(row => `<li><div><h2>${row.title}</h2><p class="tournament-meta">${example.game} · ${row.mode} · Madrid</p><p class="tournament-meta">${row.date}, 10:00 · Europe/Madrid</p><span class="capacity">Capacity · ${row.capacity}</span>${lifecycle(row.published)}</div>${link(row.published?'Edit configuration':'Continue draft',row.next)}</li>`).join('')}</ul>`;
}
const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
const account = `<details class="account"><summary>Alex Morgan ${chevron}</summary><div class="account-panel"><strong>Alex Morgan</strong><small>Signed in with your account provider</small><a class="button" href="access-states.html?state=public-signed-out">Sign out</a></div></details>`;
const content = state.startsWith('list-') ? listView() : ['preview-individual','preview-team','publishing','publish-failed'].includes(state) ? previewView() : formView();
document.querySelector('#surface').innerHTML = `<div class="admin-layout"><aside class="rail"><a class="brand" href="?state=list-populated">HERALD<span>.</span></a><div class="org"><strong>Northside Gaming</strong><small>Organisation · Owner</small><a href="access-states.html?state=organisation-selector">Switch organisation</a></div><nav aria-label="Workspace"><a href="access-states.html?state=one-organisation">Overview</a><a href="?state=list-populated" aria-current="page">Tournaments</a><a href="access-states.html?state=one-organisation">Organisation</a></nav></aside><main id="main" class="admin-main" tabindex="-1"><header class="admin-top"><span class="muted">Organiser workspace</span>${account}</header><div class="admin-content">${content}<p id="feedback" class="status" role="status" hidden></p></div></main></div>`;
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
