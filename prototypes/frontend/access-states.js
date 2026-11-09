// Static, dependency-free fixtures. Authentication and authorisation are never executed.
const states = {
  'public-signed-out':'Public navigation · signed out',
  'public-signed-in':'Public navigation · signed in',
  'sign-in-redirecting':'Sign-in · redirecting',
  'sign-in-returning':'Sign-in · returning',
  'sign-in-failed':'Sign-in · failed',
  'sign-in-cancelled':'Sign-in · cancelled',
  'not-assigned':'Account not assigned to Herald',
  'onboarding':'Create organisation · empty',
  'name-required':'Create organisation · name required',
  'name-too-long':'Create organisation · name too long',
  'creating':'Create organisation · submitting',
  'create-failed':'Create organisation · failed save',
  'created':'Organisation created · owner context',
  'admin-session':'Admin shell · active session',
  'one-organisation':'One organisation · no selector',
  'organisation-selector':'Several organisations · selector',
  'switching':'Organisation · switching',
  'switched':'Organisation · switched',
  'context-replaced':'Organisation changed in another tab',
  'access-lost':'Membership removed · landing',
  'write-rejected':'Membership removed · rejected write',
  'session-expired':'Session expired during work',
  'recovery':'Account recovery · support next action',
  'private-denied':'Generic private denial'
};
const params = new URLSearchParams(location.search);
const state = Object.hasOwn(states, params.get('state')) ? params.get('state') : 'onboarding';
const link = (label, target, primary=false) => `<a class="button ${primary?'primary':''}" href="?state=${target}">${label}</a>`;
const actions = (...items) => `<div class="actions">${items.join('')}</div>`;
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4m0 4h.01M10 3h4l8 16-2 2H4l-2-2z"/></svg>';
const notice = (title, copy) => `<div class="status" role="status"><div class="status-icon">${icon}<strong>${title}</strong></div><p>${copy}</p></div>`;
const account = (open=false) => `<details class="account" ${open?'open':''}><summary>Alex Morgan · Account</summary><div class="account-panel"><strong>Alex Morgan</strong><small>Signed in with your account provider</small>${state==='not-assigned'?'':link('Organise','one-organisation')}${link('Sign out','public-signed-out')}</div></details>`;
const publicNav = (signed=true, open=false) => `<header class="public-nav"><a class="brand" href="?state=public-signed-out">HERALD<span>.</span></a><a href="?state=public-signed-out">Tournaments</a>${signed?account(open):link('Sign in','sign-in-redirecting')}</header>`;
const auth = (body, signed=true, note='Your account and your organisation', copy='Your account provider handles sign-in. Herald checks your organisation membership before showing private content.') => `${publicNav(signed)}<main id="main" class="auth-main" tabindex="-1"><section class="panel stack">${body}</section><aside class="side-note"><h2>${note}</h2><p>${copy}</p></aside></main>`;
const heading = (title, copy) => `<h1>${title}</h1><p class="muted">${copy}</p>`;
const overview = `<section class="panel stack"><h2>Your organisation is ready</h2><p>Prepare your first tournament in this organisation. You are its only owner.</p>${actions('<button class="primary" data-demo="Tournament setup belongs to the next H1 slice. No tournament is created here.">Create tournament</button>')}</section>`;
function admin(body, {organisation='Northside Gaming', multiple=false, menu=false, neutral=false}={}) {
  return `<div class="admin-layout"><aside class="rail"><a class="brand" href="?state=admin-session">HERALD<span>.</span></a><div class="org"><strong>${neutral?'No organisation selected':organisation}</strong><small>${neutral?'Access needs attention':'Organisation · Owner'}</small>${multiple?link('Switch organisation','organisation-selector'):''}</div>${neutral?'':`<nav aria-label="Workspace"><a href="?state=one-organisation" aria-current="page">Overview</a><a href="journeys.html?step=setup">Tournaments</a><a href="?state=one-organisation">Organisation</a></nav>`}</aside><main id="main" class="admin-main" tabindex="-1"><header class="admin-top"><span class="muted">Organiser workspace</span>${account(menu)}</header><div class="admin-content">${body}</div></main></div>`;
}
function creation() {
  const invalid = ['name-required','name-too-long'].includes(state);
  const value = state==='name-too-long' ? 'Northside Gaming and Community Competition Organisation for All Local Tournament Organisers and Players' : ['creating','create-failed'].includes(state)?'Northside Gaming':'';
  const error = state==='name-too-long'?'Use 80 characters or fewer.':'Enter an organisation name.';
  return auth(`${heading('Create an organisation','Give your organising workspace a name. You will become its only owner.')}${state==='create-failed'?notice('Organisation not created','The save failed. Your name has been kept. Try again when you are ready.'):''}<form id="create-form" novalidate ${state==='creating'?'aria-busy="true"':''}><div class="field"><label for="organisation-name">Organisation name <small>Required</small></label><input id="organisation-name" name="organisation-name" value="${value}" required aria-describedby="name-help${invalid?' name-error':''}" ${invalid?'aria-invalid="true"':''} ${state==='creating'?'readonly':''}><span class="help" id="name-help">For example, Northside Gaming. Up to 80 characters in this proposal.</span><p class="error" id="name-error" ${invalid?'':'hidden'}>${invalid?error:''}</p></div>${state==='creating'?'<p class="help" role="status">Creating your organisation. Please wait; do not submit again.</p>':''}${actions(`<button class="primary" type="submit" ${state==='creating'?'aria-disabled="true"':''}>${state==='creating'?'Creating organisation…':state==='create-failed'?'Try again':'Create organisation'}</button>`,link('Back to public page','public-signed-in'))}</form>`,true,'A workspace of your own','Organisation access is separate from sign-in. Creating this organisation gives you ownership of it, without granting access to anyone else’s private content.');
}
let body;
if (['onboarding','name-required','name-too-long','creating','create-failed'].includes(state)) body=creation();
else switch(state) {
case 'public-signed-out': case 'public-signed-in':
  body=`${publicNav(state==='public-signed-in',true)}<main id="main" class="auth-main" tabindex="-1"><section class="stack">${heading('Follow the competition','Open a published tournament link to see its schedule, results and standings.')}<p>Public pages can be read without signing in.</p>${actions(link(state==='public-signed-in'?'Organise':'Sign in to organise',state==='public-signed-in'?'one-organisation':'sign-in-redirecting',true))}</section></main>`;break;
case 'sign-in-redirecting':
  body=auth(`${heading('Taking you to sign in','Continue with your account provider. You will return to Herald afterwards.')}<div class="progress" aria-hidden="true"><span></span></div><p role="status">Opening your account provider…</p>${actions(link('Continue to sign in','sign-in-returning',true),link('Cancel','public-signed-out'))}`,false,'Access by invitation','Only people invited by the platform operator and assigned to Herald can sign in. If you need access, contact the platform operator.');break;
case 'sign-in-returning':
  body=auth(`${heading('Completing sign-in','Herald is checking your application access and organisation memberships.')}<p role="status">Checking access. Private content is not loaded yet.</p>${actions(link('Check again','onboarding',true),link('Back to public page','public-signed-out'))}`,false);break;
case 'sign-in-failed': case 'sign-in-cancelled':
  body=auth(`${heading(state==='sign-in-failed'?'Sign-in did not complete':'Sign-in was cancelled','You are not signed in to Herald. Try again with your invited account.')}<p role="alert">${state==='sign-in-failed'?'Your account provider could not complete sign-in.':'No changes were made.'}</p>${actions(link('Try signing in again','sign-in-redirecting',true),link('Get recovery help','recovery'),link('Back to public page','public-signed-out'))}`,false);break;
case 'not-assigned':
  body=auth(`${heading('Herald access is by invitation','Your account has not been granted access to Herald.')}<p>Contact the platform operator who invited you and ask them to check your application assignment.</p><p>Signing in with your account provider does not grant Herald access.</p>${actions(link('Use another account','sign-in-redirecting',true),link('Sign out','public-signed-out'))}`,true,'Need an invitation?','Ask the platform operator responsible for your Herald access. There is no self-service registration.');break;
case 'created':
  body=admin(`${notice('Organisation created','You are now the only owner of Northside Gaming.')}${heading('Northside Gaming','Your organisation workspace')}${overview}`);break;
case 'admin-session': case 'one-organisation':
  body=admin(`${heading('Overview','Northside Gaming · your organisation')}${overview}${actions(link('Create another organisation','onboarding'))}`,{menu:state==='admin-session'});break;
case 'organisation-selector':
  body=admin(`${heading('Choose an organisation','You own these organisations. Switching replaces the workspace; permissions are never combined.')}<section class="panel"><h2>Your organisations</h2><ul class="org-list"><li><div><strong>Northside Gaming</strong><small>Owner · Current organisation</small></div><span>Selected</span></li><li><div><strong>Southside Club</strong><small>Owner</small></div>${link('Switch to Southside Club','switching',true)}</li></ul>${actions(link('Create another organisation','onboarding'),link('Keep current organisation','one-organisation'))}</section>`,{multiple:true});break;
case 'switching':
  body=admin(`${heading('Switching organisation','Opening Southside Club.')}<section class="panel stack" aria-busy="true"><h2>Replacing your workspace</h2><p role="status">Previous private content has been cleared. Checking access before loading the next organisation.</p>${actions(link('Check switch status','switched',true))}</section>`,{neutral:true});break;
case 'switched': case 'context-replaced':
  body=admin(`${notice('You are now working in Southside Club',state==='context-replaced'?'The organisation changed in another tab, so this tab reloaded. Previous private content and pending requests were discarded.':'Previous private content and pending requests were discarded. Only this organisation’s workspace is loaded.')}${heading('Overview','Southside Club · your organisation')}${overview}`,{organisation:'Southside Club',multiple:true});break;
case 'access-lost': case 'write-rejected':
  body=auth(`${heading('Organisation access is no longer available','Your sign-in is still valid, but your membership no longer permits this workspace.')}${notice(state==='write-rejected'?'Your change was not saved':'Private content has been cleared',state==='write-rejected'?'Your unsaved input is kept below. It cannot be submitted without current access.':'No private organisation or tournament information is shown.')} ${state==='write-rejected'?'<div class="field"><label for="retained-input">Your unsaved input</label><textarea id="retained-input" readonly>Confirm the venue opening time before publication.</textarea><p class="help">Only text you entered is retained. Copy it before leaving; this prototype does not persist it.</p></div>':''}${actions(state==='write-rejected'?'<button class="primary" id="copy-input">Copy unsaved input</button>':link('Choose an accessible organisation','organisation-selector',true),state==='write-rejected'?link('Choose an accessible organisation','organisation-selector'):link('Back to public page','public-signed-in'))}<p>If you expected access, contact the platform operator. Sign-in alone cannot restore membership.</p><p id="copy-status" role="status"></p>`,true);break;
case 'session-expired':
  body=auth(`${heading('Sign in again to continue','Your session expired. Private content has been hidden.')}${notice('Your unsaved input is kept in this tab','Sign in with the same account. Herald must check your current membership again before restoring the task.')}<div class="field"><label for="retained-input">Your unsaved input</label><textarea id="retained-input" readonly>Confirm the venue opening time before publication.</textarea><span class="help">Keep this tab open. Copy your text before leaving if sign-in cannot be completed.</span></div>${actions('<button class="primary" data-demo="Sign in with the same account, then recheck membership and reload current data before offering the retained draft. No change is submitted automatically.">Sign in again</button>','<button id="copy-input">Copy unsaved input</button>',link('Get recovery help','recovery'))}<p id="copy-status" role="status"></p>`,false);break;
case 'recovery':
  body=auth(`${heading('Recover access to your account','Start with your account provider’s self-service recovery. Herald cannot reset your password.')}<p>If that does not work, contact the platform operator through the support contact supplied with your invitation.</p><h2>What support will verify</h2><ul class="checklist"><li>That you own the account you are trying to recover.</li><li>Your existing Herald ownership, using previously recorded evidence.</li><li>The replacement account, before recording and completing an identity relink.</li></ul><p>Support will explain the verification procedure. Never send a password or recovery code. Recovery does not merge identities or copy someone else’s permissions.</p>${actions('<button class="primary" data-demo="Open your account provider’s verified recovery route. The provider and recovery URL are not configured in this static proposal.">Open account recovery</button>','<button data-demo="Use the support contact supplied with your invitation. The contact channel and verification evidence must be defined in the access specification.">Contact support</button>',link('Try signing in','sign-in-redirecting'))}`,false,'A recorded recovery procedure','Access can be relinked only after verified ownership. Support does not grant access simply because someone knows a name or email address.');break;
case 'private-denied':
  body=auth(`${heading('This page is unavailable','Check that you are signed in to the expected account.')}<p>If you expected access, contact the platform operator through your usual support channel.</p>${actions(link('Use another account','sign-in-redirecting',true),link('Back to public page','public-signed-in'))}`,true,'Access stays private','This response does not confirm whether the requested page exists.');break;
}
document.title=`${states[state]} | Herald review`;
document.querySelector('#state-links').innerHTML=Object.entries(states).map(([key,label])=>`<a href="?state=${key}" ${key===state?'aria-current="page"':''}>${label}</a>`).join('');
document.querySelector('#surface').innerHTML=body;
const feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.className='status';feedback.hidden=true;
document.querySelector('main').append(feedback);
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{feedback.textContent='Review only: '+button.dataset.demo;feedback.hidden=false;}));
document.querySelectorAll('details').forEach(details=>details.addEventListener('keydown',event=>{if(event.key==='Escape'){details.open=false;details.querySelector('summary').focus();}}));
const form=document.querySelector('#create-form');
form?.addEventListener('submit',event=>{
  event.preventDefault();if(state==='creating')return;
  const input=document.querySelector('#organisation-name');const value=input.value.trim();
  const error=document.querySelector('#name-error');
  if(!value||value.length>80){error.textContent=!value?'Enter an organisation name.':'Use 80 characters or fewer.';error.hidden=false;input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','name-help name-error');input.focus();return;}
  input.removeAttribute('aria-invalid');error.hidden=true;
  // In-page simulation retains the typed name without storing data or putting it in a URL.
  const panel=form.closest('section');panel.innerHTML=`<h1>Organisation created</h1><p>You are its only owner. This is a review simulation.</p><h2 id="created-name"></h2>${actions(link('Review owner workspace','created',true))}`;panel.querySelector('#created-name').textContent=value;
  panel.querySelector('h1').tabIndex=-1;panel.querySelector('h1').focus();
});
document.querySelector('#copy-input')?.addEventListener('click',async()=>{
  const input=document.querySelector('#retained-input');const status=document.querySelector('#copy-status');
  try{await navigator.clipboard.writeText(input.value);status.textContent='Unsaved input copied.';}catch{input.focus();input.select();status.textContent='Text selected. Use your device’s copy command.';}
});
