// Direct file:// capture, matching capture-entries.cjs. No application server.
const path=require('path');
const fs=require('fs');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const {chromium}=require(path.join(root,'e2e/node_modules/@playwright/test'));
const directory=path.join(root,'docs/assets/mockups/feedback-layout');
const batches=[
['entries-wide','entries-cancelled-expanded','entries-manual-pending','entries-empty','cancel-dialog','cancel-dialog-closed','cancel-dialog-busy','cancel-dialog-failed','admit-reason-dialog','admit-reason-typed','add-drawer-search','add-drawer-create','add-drawer-duplicate','add-drawer-adding','add-drawer-failed','toast-admitted','toast-stack','entries-conflict','entries-over-capacity','entries-loading','entries-failed'],
['config-published','config-saved-toast','config-rejected','config-conflict','config-reload-dialog','config-leave-dialog','config-draft','list-wide','list-empty','review-form','organisation-selector','organisation-create','not-found'],
['public-home','catalogue-dialog','catalogue-drawer','catalogue-toast']];
const wide=['entries-wide','list-wide','public-home'];
const captureBatch=process.argv.find(arg=>arg.startsWith('--batch='));
const limit=captureBatch?Number(captureBatch.split('=')[1]):3;
if(![1,2,3].includes(limit))throw Error('Use --batch=1, --batch=2 or --batch=3');
const states=batches.slice(0,limit).flat();
const source='prototypes/frontend/feedback-layout-states.html';
const url=state=>'file://'+root+'/'+source+'?state='+state+'&capture=1';
const assert=(condition,message)=>{if(!condition)throw Error(message);};
(async()=>{
 fs.mkdirSync(directory,{recursive:true});
 const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true});
 try{
 const captures=[];
 for(const state of process.argv.includes('--interactions-only')?[]:states){
  const sizes=[['desktop',1440,1000],['mobile',390,844],...(wide.includes(state)?[['1920',1920,1080]]:[])];
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
   if(width>=1200&&checks.asideWidth)assert(checks.asideWidth===320,'Aside width '+state);
   if(state.startsWith('add-drawer'))assert(checks.modalWidth===(width<700?width:480),'Drawer width');
   const file=`feedback-layout-${state}-${size}.png`;
   await page.screenshot({path:path.join(directory,file),fullPage:true});
   captures.push({state,label:state.replaceAll('-',' '),batch:batches.findIndex(batch=>batch.includes(state))+1,file,source:source+'?state='+state,sourceUrl:page.url(),viewport:[width,height],fullPage:true,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,file))).digest('hex'),checks});
   await context.close();
  }
  console.log('Captured '+state);
 }
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-GB',timezoneId:'Europe/Madrid'});
 const page=await context.newPage();const load=state=>page.goto(url(state));
 const interactions=[];
 await load('unknown');assert(await page.getAttribute('body','data-state')==='entries-wide','Unknown fallback');interactions.push('Unknown query falls back to entries-wide');
 for(const state of ['cancel-dialog','add-drawer-search']){
  await load(state);await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),'Focus wraps backwards');
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),'Focus wraps forwards');
  await page.keyboard.press('Escape');assert(await page.locator('dialog[open]').count()===0,'Escape dismisses');
 }
 interactions.push('Dialog and drawer trap focus and dismiss on Escape');
 await load('entries-wide');await page.getByRole('button',{name:'Cancel entry: Robin Vale',exact:true}).click();await page.keyboard.press('Escape');assert(await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Cancel entry: Robin Vale','Focus returns');interactions.push('Closing cancellation restores its row trigger');
 for(const state of ['cancel-dialog-busy','add-drawer-adding']){await load(state);await page.keyboard.press('Escape');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));assert(await page.locator('dialog[open]').count()===1,'Busy stays open: '+state);assert(await page.locator('dialog [data-action="confirm"]').isDisabled(),'Busy confirm disabled');}
 interactions.push('Busy dialog and drawer prevent dismissal and repeat submission');
 await load('admit-reason-dialog');assert(await page.locator('#confirm-admit').isDisabled(),'Reason required');await page.locator('#admit-reason').fill('  ');assert(await page.locator('#confirm-admit').isDisabled(),'Whitespace reason rejected');await page.locator('#admit-reason').fill('Reviewed priority exception');assert(!await page.locator('#confirm-admit').isDisabled(),'Reason enables');interactions.push('Admission requires a non-whitespace private reason');
 await load('add-drawer-failed');await page.locator('#guest-name').fill('Retained guest');await page.getByRole('button',{name:'Retry add',exact:true}).click();assert(await page.locator('#guest-name').inputValue()==='Retained guest','Retry retains');assert(await page.locator('dialog[open]').count()===1,'Retry stays open');interactions.push('Failed drawer retry retains edited input and stays open');
 await load('entries-wide');assert(!await page.locator('.fl-history').evaluate(e=>e.open),'History collapsed');await page.locator('.fl-history summary').click();assert(await page.locator('.fl-history li').count()===5,'Five cancelled rows');
 for(const state of ['entries-manual-pending','entries-empty']){await load(state);assert(await page.locator('.fl-history').count()===0,'No empty history');}
 interactions.push('Cancelled disclosure opens five compact rows and is omitted when empty');
 await load('toast-stack');assert(await page.locator('.fl-toasts .fl-toast').count()===3,'Three toasts');await page.locator('.fl-toast').last().getByRole('button').click();assert(await page.locator('.fl-toast').count()===2,'Dismiss toast');interactions.push('Toast stack contains three dismissible outcomes');
 if(limit>=2){
 await load('config-rejected');await page.locator('a[href="#t-capacity"]').click();assert(await page.evaluate(()=>document.activeElement.id)==='t-capacity','Summary field focus');
 await load('config-reload-dialog');await page.getByRole('button',{name:'Back',exact:true}).click();assert(await page.locator('#t-title').inputValue()==='Saturday Open · revised','Discard declined retains');
 await load('config-published');await page.locator('#t-title').fill('Retained title');assert(await page.locator('#registration-action').isDisabled(),'Dirty blocks registration');
 interactions.push('Field summary focuses capacity; declining discard keeps input; editing blocks registration');
 }
 for(const width of [699,700,1199,1200]){await page.setViewportSize({width,height:1000});await load('entries-wide');const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.fl-grid')).gridTemplateColumns.split(' ').length}));assert(!layout.overflow,'Boundary overflow '+width);assert(layout.columns===(width>=1200?2:1),'Boundary aside '+width);}
 interactions.push('Aside breakpoint and overflow checked at 699, 700, 1199 and 1200 px');
 await page.clock.install({time:new Date('2026-11-11T10:00:00Z')});
 await page.clock.pauseAt(new Date('2026-11-11T10:00:01Z'));
 await page.goto(url('toast-admitted').replace('&capture=1',''));
 await page.clock.runFor(4999);assert(await page.locator('.fl-toast').count()===1,'Toast lasts five seconds');
 await page.clock.runFor(2);assert(await page.locator('.fl-toast').count()===0,'Toast expires');
 assert(!await page.locator('body').evaluate(e=>e.classList.contains('has-toast')),'Expired toast releases space');
 await page.goto(url('toast-stack').replace('&capture=1',''));
 await page.clock.runFor(6000);assert(await page.locator('.fl-toast').count()===1,'Focused toast pauses expiry');
 assert(await page.evaluate(()=>document.activeElement.classList.contains('fl-toast')),'Focused toast retains focus');
 interactions.push('Toasts last at least five seconds, expire, release reserved space and pause while focused');

 await context.close();
 if(process.argv.includes('--interactions-only')){console.log('Interaction checks passed: '+interactions.join('; '));return;}
 const expected=[43,70,79][limit-1];assert(captures.length===expected,'Capture total');
 assert(new Set(captures.map(c=>c.sha256)).size===expected,'Two captures have identical image data');
 for(const capture of captures)assert(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,capture.file))).digest('hex')===capture.sha256,'Hash mismatch');
 fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({description:'Deterministic feedback and layout documentation captures; review material approves no product default.',batchesDelivered:limit,captureMethod:'Playwright with installed Google Chrome, headless, direct file://, device scale 1, en-GB, Europe/Madrid, local assets and system sans-serif fallback. Toast expiry paused using capture=1.',captures,interactionChecks:interactions,limitations:'Static review fixtures: no backend, persistence, authority, real mutation, revision reconciliation or production accessibility certification.'},null,2)+'\n');
 console.log(`Verified ${captures.length} PNGs across ${states.length} states.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
