// Direct file:// capture, matching capture-entries.cjs. No application server.
const path=require('path');
const fs=require('fs');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const {chromium}=require(path.join(root,'e2e/node_modules/@playwright/test'));
const directory=path.join(root,'docs/assets/mockups/team-rosters');
const states=["team-readiness", "roster-empty", "roster-incomplete", "roster-complete", "roster-full", "roster-above-maximum", "add-existing", "add-new", "add-duplicate", "adding", "add-failed", "remove", "possible-duplicate-member", "history-expanded", "cancelled-read-only", "awaiting-terms", "conflict", "loading", "failed"];
const source='prototypes/frontend/team-rosters-states.html';
const url=state=>'file://'+root+'/'+source+'?state='+state+'&capture=1';
const assert=(condition,message)=>{if(!condition)throw Error(message);};
(async()=>{
 fs.mkdirSync(directory,{recursive:true});
 const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true});
 try{
 const captures=[];
 for(const state of process.argv.includes('--interactions-only')?[]:states){
  const sizes=[['desktop',1440,1000],['mobile',390,844]];
  for(const [size,width,height] of sizes){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'en-GB',timezoneId:'Europe/Madrid',reducedMotion:'reduce'});
   const page=await context.newPage();const errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
   await page.goto(url(state));await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const checks=await page.evaluate(()=>{
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    const modal=document.querySelector('dialog[open]');
    const focus=document.activeElement;
    const toast=document.querySelector('.fl-toasts');
    const primary=[...document.querySelectorAll('.fl-content button.primary,.fl-content a.primary')].filter(visible);
    const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const rects=primary.map(e=>{const r=e.getBoundingClientRect();let top=r.top,bottom=r.bottom;for(let parent=e.parentElement;parent;parent=parent.parentElement){if(['auto','scroll','hidden'].includes(getComputedStyle(parent).overflowY)){const bounds=parent.getBoundingClientRect();top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom);}}return {left:r.left,right:r.right,top,bottom};}).filter(r=>r.top<innerHeight&&r.bottom>0&&r.bottom>r.top);
    return {state:document.body.dataset.state,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
     unlabelledControls:[...document.querySelectorAll('input,select,textarea')].filter(e=>!e.labels.length).map(e=>e.id),
     duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
     targetsUnder44px:[...document.querySelectorAll('button,a,summary,input,select,textarea')].filter(e=>visible(e)&&e.getBoundingClientRect().height<43.9).map(e=>e.textContent.trim()||e.id),
     heading:document.querySelector('h1')?.textContent,modalFocusInside:modal?modal.contains(focus):null,
     focusOutline:modal||document.body.dataset.state==='toast-stack'?{width:getComputedStyle(focus).outlineWidth,style:getComputedStyle(focus).outlineStyle}:null,
     primaryCovered:toast?rects.some(r=>overlaps(r,toast.getBoundingClientRect())):false,
     asideWidth:document.querySelector('.fl-aside')?.getBoundingClientRect().width,
     modalWidth:modal?.getBoundingClientRect().width,
     contentWidth:document.querySelector('.fl-content,.fl-public-inner')?.getBoundingClientRect().width};
   });
   Object.assign(checks,{pageErrors:errors,networkRequests:requests});
   assert(checks.state===state,'Wrong state '+state);
   assert(!checks.horizontalOverflow&&!checks.unlabelledControls.length&&!checks.duplicateIds.length&&!checks.targetsUnder44px.length&&!errors.length&&!requests.length&&checks.modalFocusInside!==false&&!checks.primaryCovered,JSON.stringify({state,size,checks}));
   if(checks.focusOutline)assert(checks.focusOutline.width==='3px'&&checks.focusOutline.style==='solid','Focus outline '+state);
   assert(!checks.asideWidth,'No secondary aside');
   if(state!=='team-readiness')assert(checks.modalWidth===(width<700?width:480),'Drawer width');
   const file=`team-rosters-${state}-${size}.png`;
   await page.screenshot({path:path.join(directory,file),fullPage:true});
   captures.push({state,label:state.replaceAll('-',' '),file,source:source+'?state='+state,sourceUrl:page.url(),viewport:[width,height],fullPage:true,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,file))).digest('hex'),checks});
   await context.close();
  }
  console.log('Captured '+state);
 }
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-GB',timezoneId:'Europe/Madrid'});
 const page=await context.newPage();const load=state=>page.goto(url(state));
 const interactions=[];
 await load('unknown');assert(await page.getAttribute('body','data-state')==='team-readiness','Unknown fallback');
 assert(!await page.locator('#cancelled').evaluate(e=>e.open),'Cancelled initially collapsed');
 await page.locator('#cancelled summary').click();await page.getByRole('button',{name:'Roster: Harbour Lights',exact:true}).click();
 assert(await page.locator('dialog button').count()===1,'Cancelled roster is read-only');
 await page.keyboard.press('Escape');assert(await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Roster: Harbour Lights','Focus restored');
 interactions.push('Unknown query falls back; cancelled group opens a read-only roster; Escape restores focus');
 await load('roster-incomplete');await page.getByRole('button',{name:'Add player',exact:true}).click();
 assert(await page.locator('dialog').getByText('On Team A',{exact:true}).count()===1,'Exclusive player explained');
 assert(await page.locator('dialog li').filter({hasText:'On Team A'}).locator('button').count()===0,'No add action for exclusive player');
 await page.locator('dialog').getByRole('button',{name:'Add player',exact:true}).click();
 assert(await page.locator('dialog #members-heading').textContent()==='Members · 3','Member added');
 assert((await page.locator('[data-team-readiness="River Falcons"]').textContent()).trim()==='3 of 3–5 players','Row readiness updated');
 assert(await page.locator('dialog[open]').count()===1,'Drawer stays open');
 await page.getByRole('button',{name:'Remove Reese Moss',exact:true}).click();
 assert(await page.locator('dialog #members-heading').textContent()==='Members · 2','Member removed');
 await page.locator('dialog summary').click();assert(await page.locator('dialog details').textContent().then(t=>t.includes('Removed Reese Moss')),'Removal recorded');
 assert(await page.locator('.fl-toast').count()===0,'No roster toast');
 interactions.push('Add and remove update members, row readiness and history inside the open drawer, without a toast');
 await load('add-failed');await page.locator('#player-name').fill('Retained Player');
 assert(await page.locator('#player-name').inputValue()==='Retained Player','Input editable after failure');
 await page.getByRole('button',{name:'Retry add',exact:true}).click();
 assert(await page.locator('dialog li h3').allTextContents().then(names=>names.includes('Retained Player')),'Retry uses retained input');
 interactions.push('Failed addition keeps editable input and retry adds that input');
 for(const state of ['adding','remove']){
 await load(state);await page.keyboard.press('Escape');assert(await page.locator('dialog[open]').count()===1,'Busy cannot close');
 assert(await page.locator('dialog button:not(:disabled)').count()===0,'Busy cannot repeat');
 }
 interactions.push('Busy add and removal cannot repeat or close');
 for(const state of ['roster-full','roster-above-maximum','awaiting-terms']){
 await load(state);assert(await page.getByRole('button',{name:'Add player',exact:true}).isDisabled(),'Add blocked');assert(await page.locator('#add-reason').textContent(),'Reason shown');
 }
 await load('conflict');await page.getByRole('button',{name:'Reload latest',exact:true}).click();assert(await page.locator('dialog #members-heading').textContent()==='Members · 1','Reload latest removal');
 interactions.push('Full, above-maximum and awaiting-terms explain unavailable adding; conflict reload shows the latest roster');
 await load('failed');assert(await page.locator('dialog li').count()===0,'No stale members');await page.getByRole('button',{name:'Try again',exact:true}).click();assert(await page.locator('dialog #members-heading').count()===1,'Load retry');
 await load('roster-incomplete');await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.activeElement.textContent)==='Back to entries','Reverse focus trap');await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Remove Robin Vale','Forward focus trap');
 interactions.push('Load failure shows no stale members and can retry; keyboard focus wraps in the drawer');
 for(const width of [699,700,1920]){await page.setViewportSize({width,height:1000});await load('team-readiness');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Boundary overflow '+width);assert(await page.locator('.fl-content').evaluate(e=>getComputedStyle(e).maxWidth)==='none','Full-width content');await load('roster-incomplete');assert(await page.locator('dialog').evaluate(e=>e.getBoundingClientRect().width)===(width<700?width:480),'Boundary drawer');}
 interactions.push('Layout checked at 699, 700 and 1920 px; drawer is full screen below 700 px and 480 px otherwise');
 await context.close();
 assert(captures.length===38,'Capture total');
 assert(new Set(captures.map(c=>c.sha256)).size===38,'Unique images');
 for(const capture of captures)assert(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,capture.file))).digest('hex')===capture.sha256,'Hash mismatch');
 assert(fs.readdirSync(directory).filter(file=>file.endsWith('.png')).length===38,'Exactly 38 PNGs');
 fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({description:'Deterministic team roster documentation captures; review material approves no product default.',captureMethod:'Playwright with installed Google Chrome, headless, direct file://, device scale 1, en-GB, Europe/Madrid, reduced motion, local assets and system sans-serif fallback.',captures,interactionChecks:interactions,limitations:'Static review fixtures: no backend, persistence, real concurrency or production accessibility certification. Busy states deliberately remain in progress.'},null,2)+'\n');
 console.log('Verified 38 PNGs across 19 states, with interaction checks.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
