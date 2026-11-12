// Direct file:// capture, matching capture-entries.cjs. No application server.
const path=require('path');
const fs=require('fs');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const {chromium}=require(path.join(root,'e2e/node_modules/@playwright/test'));
const directory=path.join(root,'docs/assets/mockups/check-in');
const states=['check-in-mandatory','check-in-optional','no-admitted','checking-in','checked-in-toast','undo','check-in-failed','check-in-conflict','cancelled-checked-in','team-check-in','check-in-locked'];
const source='prototypes/frontend/check-in-states.html';
const url=state=>'file://'+root+'/'+source+'?state='+state+'&capture=1';
const assert=(condition,message)=>{if(!condition)throw Error(message);};
(async()=>{
 fs.mkdirSync(directory,{recursive:true});
 const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true});
 try{
 const captures=[];
 for(const state of process.argv.includes('--interactions-only')?[]:states){
  const sizes=[['desktop',1440,1000],['mobile',390,1100]];
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
    const toast=document.querySelector('.check-toasts');
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
   const file=`check-in-${state}-${size}.png`;
   await page.screenshot({path:path.join(directory,file),fullPage:true});
   captures.push({state,label:state.replaceAll('-',' '),file,source:source+'?state='+state,sourceUrl:page.url(),viewport:[width,height],fullPage:true,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,file))).digest('hex'),checks});
   await context.close();
  }
  console.log('Captured '+state);
 }
 const context=await browser.newContext({viewport:{width:390,height:1100},locale:'en-GB',timezoneId:'Europe/Madrid'});
 const page=await context.newPage();const load=state=>page.goto(url(state));
 const interactions=[];
 await load('unknown');assert(await page.getAttribute('body','data-state')==='check-in-mandatory','Unknown fallback');
 assert(!await page.locator('#cancelled').evaluate(e=>e.open),'Cancelled initially collapsed');
 await page.getByRole('button',{name:'Check in: Jamie Brook',exact:true}).click();
 assert((await page.locator('#check-count').textContent()).includes('3 of 4'),'Count grows');
 assert(await page.locator('dialog').count()===0,'No check-in dialog');
 assert((await page.locator('.check-toast').textContent()).includes('Jamie Brook checked in.'),'Success toast');
 await page.getByRole('button',{name:'Undo check-in: Jamie Brook',exact:true}).click();
 assert((await page.locator('#check-count').textContent()).includes('2 of 4'),'Undo count');
 assert((await page.locator('[data-entry="2"]').textContent()).includes('Check-in pending'),'Undo pending');
 interactions.push('Check-in and undo apply immediately, update count, retain row focus and announce their outcome without a dialog');
 await load('checking-in');assert(await page.locator('[data-entry="2"] button:not(:disabled)').count()===0,'Busy row controls disabled');assert(await page.locator('[data-entry="3"] button:not(:disabled)').count()===2,'Other rows usable');
 await load('check-in-failed');assert(await page.locator('.row-error').count()===1,'Inline error');await page.getByRole('button',{name:'Check in: Jamie Brook',exact:true}).click();assert(await page.locator('.row-error').count()===0,'Retry clears error');
 await load('check-in-conflict');assert((await page.locator('[data-entry="2"] .check-label').textContent())==='Checked in','Conflict current state');await page.getByRole('button',{name:'Reload latest',exact:true}).click();assert(await page.locator('.fl-notice.danger').count()===0,'Conflict reload');
 interactions.push('Busy row is isolated; failed check-in retries from unchanged state; conflict shows current field and reloads');
 await load('cancelled-checked-in');assert(await page.locator('#cancelled').evaluate(e=>e.open),'Cancelled expanded');assert(await page.locator('#cancelled button').count()===0,'Read-only cancellation');assert(await page.locator('#cancelled .check-label').textContent()==='Checked in','Evidence kept');
 await load('no-admitted');assert(await page.locator('#check-count').textContent()==='Check-in mandatory','Empty policy without count');
 await load('check-in-locked');for(const id of ['entryKind','admission','checkIn'])assert(await page.locator('#t-'+id).isDisabled(),'Locked '+id);assert(await page.locator('#t-title').isEditable(),'Title editable');assert(await page.locator('#t-capacity').isEditable(),'Capacity editable');
 interactions.push('Cancelled check-in is read-only; empty field retains policy without count; only entry kind, admission and check-in policy are locked');
 await load('team-check-in');assert((await page.locator('[data-entry="0"]').textContent()).includes('2 of 3–5 players · incomplete'),'Independent roster readiness');await page.getByRole('button',{name:'Roster: River Falcons',exact:true}).click();assert(await page.locator('dialog[open]').count()===1,'Roster action');await page.keyboard.press('Escape');assert(await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Roster: River Falcons','Roster focus return');
 for(const width of [699,700,1920]){await page.setViewportSize({width,height:1000});await load('check-in-mandatory');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Boundary overflow '+width);assert(await page.locator('.fl-content').evaluate(e=>getComputedStyle(e).maxWidth)==='none','Full width');}
 await load('check-in-mandatory');await page.keyboard.press('Tab');assert(await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle==='solid'&&s.outlineWidth==='3px';}),'Visible keyboard focus');
 interactions.push('Roster opens and returns focus; full-width layouts checked at 699, 700 and 1920 px; keyboard focus is visible');
 await context.close();
 assert(captures.length===22,'Capture total');
 assert(new Set(captures.map(c=>c.sha256)).size===22,'Unique images');
 for(const capture of captures)assert(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,capture.file))).digest('hex')===capture.sha256,'Hash mismatch');
 assert(fs.readdirSync(directory).filter(file=>file.endsWith('.png')).length===22,'Exactly 22 PNGs');
 fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({description:'Deterministic check-in documentation captures; review material approves no product default.',captureMethod:'Playwright with installed Google Chrome, headless, direct file://, device scale 1, en-GB, Europe/Madrid, reduced motion, local assets and system sans-serif fallback.',captures,interactionChecks:interactions,limitations:'Static review fixtures: no backend, persistence, real concurrency or production accessibility certification. Busy states deliberately remain in progress. Capture toasts remain visible until dismissed for deterministic review.'},null,2)+'\n');
 console.log('Verified 22 PNGs across 11 states, with interaction checks.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
