const parameters = new URLSearchParams(location.search);
const kind = parameters.get('kind') === 'team' ? 'team' : 'individual';
const steps = [
  ['access', 'Organisation'], ['setup', 'Configuration'], ['entries', 'Entries'],
  ['readiness', 'Readiness'], ['rounds', 'Rounds'], ['result', 'Result'],
  ['correction', 'Correction'], ['finalise', 'Final review'], ['public', 'Public view']
];
const step = steps.some(([key]) => key === parameters.get('step')) ? parameters.get('step') : 'access';
const team = kind === 'team';
const people = team ? ['Northside', 'Southside', 'Eastside', 'Westside'] : ['Falcon', 'Harbour', 'Orion', 'Willow'];
const title = team ? 'Saturday Team League' : 'Saturday Open';
const corrected = parameters.get('corrected') === '1';
const explicitLast = ['a', 'draw', 'b'].includes(parameters.get('last')) ? parameters.get('last') : null;
const last = explicitLast || 'a';
const unit = team ? 'teams' : 'individual entries';
function url(next, additions = {}) {
  const values = new URLSearchParams({kind, step: next});
  if (explicitLast) values.set('last', explicitLast);
  if (corrected) values.set('corrected', '1');
  Object.entries(additions).forEach(([key, value]) => values.set(key, value));
  return '?' + values.toString();
}
const link = (label, next, primary = false, additions = {}) => `<a class="review-button ${primary ? 'primary' : ''}" href="${url(next, additions)}">${label}</a>`;
const reference = (state, label) => `<a class="review-button" href="review-states.html?state=${state}">${label}</a>`;
const field = (label, value) => `<div><label>${label}<input value="${value}" readonly></label></div>`;
function facts(items) { return `<div class="review-facts">${items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`; }
function table(headers, rows, caption = '') { return `<div class="tablewrap"><table>${caption ? `<caption>${caption}</caption>` : ''}<thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
const schedule = [{a:0,b:1,r:1,outcome:corrected?'draw':'a'},{a:2,b:3,r:1,outcome:'a'},{a:0,b:2,r:2,outcome:'a'},{a:1,b:3,r:2,outcome:'a'},{a:0,b:3,r:3,outcome:'a'},{a:1,b:2,r:3,outcome:last}];
function points(includeLast = true) {
  const rows = people.map((name, i) => ({name, i, points:0}));
  schedule.forEach((match, index) => {
    if (!includeLast && index === 5) return;
    if (match.outcome === 'draw') { rows[match.a].points++; rows[match.b].points++; }
    else rows[match[match.outcome]].points += 3;
  });
  return rows.sort((a,b) => b.points-a.points || a.name.localeCompare(b.name));
}
function standings(includeLast = true) {
  let previous = null, rank = 0;
  return table(['Position', team ? 'Team publication name' : 'Publication alias', 'Points'], points(includeLast).map((row,index) => {
    if (row.points !== previous) { rank=index+1; previous=row.points; }
    return [rank, row.name, row.points];
  }));
}
function roster() { return `<div class="journey-roster">${Array.from({length:7},(_,i)=>`<div><strong>North ${i+1}</strong><span>${i<5?'Eligible starter':'Unused reserve'}</span></div>`).join('')}</div>`; }
const pages = {
  access: {
    heading:'Start in the right organisation', description:'The organiser establishes their own workspace before preparing a tournament.', refs:'UJ-01 · D-21 proposed onboarding · AT-12',
    body:`<div class="journey-grid"><div><h2>Your organising workspace</h2><p>No organisation is selected in this snapshot.</p>${field('Organisation name','Northside Gaming')}<div class="actions">${link('Create organisation and continue','setup',true)}</div></div><div class="journey-side-note"><h3>Authority follows the organisation</h3><p>The proposed onboarding makes the creator its owner. Access to another organisation is never implied.</p><p>Invitation and collaboration flows are H2. No real sign-in or account creation happens here.</p></div></div>`
  },
  setup: {
    heading:team?'Prepare a direct team league':'Prepare an individual league', description:'Review the entry unit, competition profile and publication conditions.', refs:'UJ-02/UJ-03 · CP-01 · D-04/D-17/D-18/D-27 · AT-01/04',
    body:`<div class="review-title"><h2>${title}</h2><span class="tag">Draft</span></div><div class="review-form-grid">${field('Entry kind',team?'Team · direct 5v5':'Individual · one player per entrant')}${field('Capacity',`4 ${unit}`)}${field('Competition profile','Single round-robin · 3 / 1 / 0')}${field('Reference time zone','Europe/Madrid')}${field('Starts at','14 November 2026, 10:00')}${field('Visibility','Public when published')}</div>${team?facts([['Profile example','5 active players per side'],['Roster bounds in this fixture','5 to 7 identifiable players']]):'<p class="notice">Individual entries have no roster, lineup or team-only validation.</p>'}<p class="review-explanation">Sample policy: operator-managed admission, mandatory check-in and shared positions on equal points. These values illustrate the proposed profile; they do not approve every default.</p><div class="actions journey-next">${reference('configuration','Review incomplete draft')}${link('Publish and manage entries','entries',true)}</div>`
  },
  entries: {
    heading:'Admit the field and review attendance', description:'Each entrant occupies one place, regardless of how many players a team fields.', refs:'UJ-02/UJ-03 · F-04/F-05 · D-06/D-22 · AT-03/04',
    body:`<div class="review-title"><h2>${title}</h2><div class="tags"><span class="tag">Published</span><span class="tag">Registration closed</span><span class="tag">Preparing</span></div></div>${facts([['Capacity',`4 of 4 ${unit}`],['Readiness snapshot','All admitted and checked in']])}${table([team?'Team':'Publication alias','Admission','Check-in'],people.map(name=>[name,'Admitted','Confirmed']))}<p class="review-explanation">The publication names shown here are explicitly selected. Private guest identity records and contact details stay operational.</p><div class="actions journey-next">${reference('entries','Review capacity / absence exception')}${link(team?'Review roster and lineups':'Review eligible field','readiness',true)}</div>`
  },
  readiness: {
    heading:team?'Lock valid starting lineups':'Review the eligible field', description:team?'A frozen roster is separate from the selected starters and from actual play.':'Four admitted and checked-in entrants can be paired without team-only setup.', refs:'UJ-02/UJ-03 · TM-05–10 · H1 start contract · AT-01/04/05',
    body:team?`<h2>Northside vs Southside</h2>${facts([['Northside roster','7 players · frozen'],['Northside lineup','5 eligible starters · locked'],['Southside lineup','5 eligible starters · locked'],['Actual play','Not started']])}${roster()}<p class="notice">Both teams have five eligible locked starters. Two Northside reserves remain registered but unused. A locked lineup alone credits no appearance.</p><p class="review-explanation">Publishing pairings and starting competition are separate operations. The next view loads a later running snapshot; it performs neither.</p><div class="actions journey-next">${reference('team-blocked','Review 4-of-5 blocker')}${link('Review later rounds snapshot','rounds',true)}</div>`:`<h2>${title}</h2>${facts([['Eligible entrants','4'],['Required check-in','4 confirmed'],['Schedule','6 matches over 3 rounds'],['Publication state','Pairings ready to publish']])}<p class="notice">Review the field before publishing. After publication, a pre-start field change first withdraws the pairings. Competition start freezes the field. Publication and start are separate operations; the next view only loads a later running snapshot.</p><div class="actions journey-next">${reference('entries','Review attendance blocker')}${link('Review later rounds snapshot','rounds',true)}</div>`
  },
  rounds: {
    heading:'Finish the operator league', description:'This later snapshot has five effective results and one remaining match.', refs:'UJ-02/UJ-03 · F-06–09 · AT-01/04',
    body:`<div class="review-title"><h2>${title}</h2><span class="tag live">Running</span></div>${facts([['Published schedule','3 rounds · 6 matches'],['Next action','1 result remains']])}${table(['Round','Match','Effective outcome'],schedule.map((match,index)=>[match.r,`${people[match.a]} vs ${people[match.b]}`,index===5?`<span class="tag wait">${team?'Ready to start':'Awaiting result'}</span>`:match.outcome==='draw'?'Draw':`${people[match[match.outcome]]} wins`]))}<p class="review-explanation">${team?'Played team results refer to the explicit start and both locked lineups. Each encounter still contributes one aggregate outcome.':'The operator can record an individual played result in one validated start-and-resolution operation.'} Round-robin play need not wait for every earlier round to finish.</p><div class="actions journey-next">${reference('administrative-result','Review an administrative outcome')}${link(team?'Start remaining match':'Record remaining result','result',true)}</div>`
  },
  result: {
    heading:'Record the observed result', description:'A new result starts without a winner selected.', refs:'UJ-06 · F-07/F-08 · H1 result/start contract · AT-06',
    body:`<div class="journey-result"><h2>${people[1]} vs ${people[2]}</h2><p class="muted">Played match · operator authority${team?' · both locked lineups and recorded start':''}</p><label for="journey-outcome">Outcome</label><select id="journey-outcome" required><option value="" disabled selected>Select outcome</option><option value="a">${people[1]} wins</option><option value="draw">Draw</option><option value="b">${people[2]} wins</option></select><div id="journey-preview" class="notice" aria-live="polite"><p class="selection-help">Choose the outcome before reviewing its points.</p></div><div class="actions journey-next">${reference('recovery','Review an uncertain response')}<button class="primary" id="journey-confirm" disabled>Confirm result</button></div></div>`
  },
  correction: {
    heading:'Review a correction before applying it', description:'A later review finds that the first match was a draw. The existing result stays effective until confirmation.', refs:'UJ-06 · §9 · D-07/D-24 · AT-08',
    body:`<h2>${people[0]} vs ${people[1]}</h2><div class="impact-outcomes review-comparison"><div><span>Previous effective result · revision 12</span><strong>${people[0]} wins · played</strong></div><div><span>Proposed correction</span><strong>Draw · played</strong></div></div>${facts([[people[0]+' · match points','3 → 1'],[people[1]+' · match points','0 → 1']])}<label for="journey-reason">Correction reason</label><textarea id="journey-reason" readonly>The operator's match record confirms a draw.</textarea><p class="notice">No published result dependency in this round-robin example. Both versions, actor and reason must remain explainable in the real system. Participation is unchanged.</p><div class="actions journey-next">${reference('correction','Review blocked correction')}${link('Keep existing result','finalise')}${link('Confirm correction','finalise',true,{corrected:'1'})}</div>`
  },
  finalise: {
    heading:'Review the current final standings', description:'Every effective result appears in the table the director is approving.', refs:'UJ-02/UJ-06 · CP-05 · D-24 proposed barrier · AT-07',
    body:`<h2>${title}</h2>${facts([['Effective result revision',corrected?'13':'12'],['Standings and reviewed revision',corrected?'13':'12'],['Resolved matches','6 of 6'],['Blocking incidents','None in this fixture']])}${standings()}<p class="notice">Equal points share a position. A newer concurrent result must stop this finalisation attempt and require another review.</p><div class="actions journey-next">${reference('finalisation-stale','Review stale snapshot')}${link('Publish final standings','public',true,{published:'1'})}</div>`
  },
  public: {
    heading:'Follow the published competition', description:'H1 read-by-link shows only information selected for publication.', refs:'UJ-07 · §12 alias-only baseline · D-09 · AT-10/13',
    body:`<div class="journey-public-header"><h2>${title}</h2><p>Northside Gaming · Madrid · 14 November 2026, 10:00 Europe/Madrid</p><div class="tags"><span class="tag">Published</span><span class="tag">Registration closed</span><span class="tag">Finalised</span></div></div><h3>Final standings</h3><p class="muted">Revision ${corrected?'13 · revised final result':'12'} · current snapshot</p>${standings()}<p class="review-explanation">${team?'Team publication names are visible. Rosters, lineups and internal player identities remain private.':'Only the reviewed publication aliases appear. There is no fallback to private identity records.'} Public discovery and participant self-service are H2.</p><div class="actions journey-next">${reference('private-denied','Review unavailable private link')}${link('Return to operator review','finalise')}</div>`
  }
};
const page = pages[step];
document.querySelector('#journey').innerHTML = `<div class="journey-layout"><aside class="journey-rail"><a class="brand" href="journeys.html">HERALD</a><div class="org">${step==='access'?'No organisation selected':'Northside Gaming'}<small>Organisation workspace</small></div><nav class="journey-steps" aria-label="Illustrative journey steps">${steps.map(([key,label],index)=>`<a href="${url(key)}" ${key===step?'aria-current="page"':''}><span class="step-number">${index+1}</span>${label}</a>`).join('')}</nav></aside><main class="journey-main"><div class="journey-kind" aria-label="Journey variation"><a href="?kind=individual&step=${step}" ${!team?'aria-current="true"':''}>Individual league</a><a href="?kind=team&step=${step}" ${team?'aria-current="true"':''}>Direct team league</a></div><header><h1>${page.heading}</h1><p>${page.description}</p></header><section class="review-screen">${page.body}</section><p class="journey-source"><strong>${page.refs}</strong><br>Illustrative snapshots for <a href="../../docs/herald-functional-discovery.md">functional baseline v0.7</a>. Jumping between steps loads the named example; it does not execute a command. Confirmed scope and proposed defaults remain separate in §15. No automatic approval follows from this prototype.</p></main></div>`;
const outcome = document.querySelector('#journey-outcome');
if (outcome) {
  outcome.addEventListener('change', () => {
    const value = outcome.value;
    const valid = ['a','draw','b'].includes(value);
    document.querySelector('#journey-confirm').disabled = !valid;
    if (!valid) return;
    const a = value === 'draw' ? 1 : value === 'a' ? 3 : 0;
    const b = value === 'draw' ? 1 : value === 'b' ? 3 : 0;
    document.querySelector('#journey-preview').innerHTML = `<div class="impact-outcomes"><div><span>${people[1]}</span><strong>${a} points</strong></div><div><span>${people[2]}</span><strong>${b} points</strong></div></div><p>One aggregate result. Points become effective only after a successful authorised operation.</p>`;
  });
  document.querySelector('#journey-confirm').addEventListener('click', () => {
    if (['a','draw','b'].includes(outcome.value)) location.href = url('correction',{last:outcome.value});
  });
}

// Keep the current snapshot visible in the narrow horizontal navigator.
if (matchMedia('(max-width:700px)').matches) {
  const navigation = document.querySelector('.journey-steps');
  const current = navigation.querySelector('[aria-current="page"]');
  if (current) navigation.scrollLeft = current.offsetLeft - navigation.offsetLeft - 16;
}
