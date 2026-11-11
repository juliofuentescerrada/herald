const path=require('path');
const root=path.resolve(__dirname,'../../..');
const {chromium}=require(path.join(root,'e2e/node_modules/@playwright/test'));
const fs=require('fs'); const crypto=require('crypto');
const dir=root+'/docs/assets/mockups/entries';fs.mkdirSync(dir,{recursive:true});
const states=['entries-empty-open','entries-not-open','entries-automatic-full','entries-manual-team','entries-closed','add-existing','add-new','add-duplicate','adding','add-failed','admit-unavailable','admit-out-of-order','cancel-confirm','cancel-confirm-closed','conflict','over-capacity','loading','failed','entries-link','fields-locked','capacity-rejected','list-with-entries'];
(async()=>{
 const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true});
 const captures=[];
 for(const state of states)for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'en-GB',timezoneId:'Europe/Madrid'});const page=await context.newPage(); const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 const source='prototypes/frontend/entries-states.html?state='+state;await page.goto('file://'+root+'/'+source);await page.evaluate(()=>document.fonts.ready);
 const checks=await page.evaluate(()=>({horizontalOverflow:document.documentElement.scrollWidth>innerWidth,unlabelledControls:[...document.querySelectorAll('input,select,textarea')].filter(e=>!e.labels.length).map(e=>e.id),duplicateIds:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((id,i,a)=>a.indexOf(id)!==i),heading:document.querySelector('h1').textContent,railVisible:document.querySelector('.rail').getBoundingClientRect().height>0,targetsUnder44px:[...document.querySelectorAll('button,a,summary,input,select,textarea')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height<44).map(e=>e.textContent.trim())}));checks.pageErrors=errors;checks.networkRequests=requests;
 if(checks.targetsUnder44px.length||checks.horizontalOverflow||errors.length||requests.length||checks.unlabelledControls.length||checks.duplicateIds.length)throw Error(JSON.stringify({state,size,checks}));
 const file=`entries-${state}-${size}.png`;await page.screenshot({path:dir+'/'+file,fullPage:true});captures.push({state,label:state.replaceAll('-',' '),file,source,sourceUrl:page.url(),viewport:[width,height],fullPage:true,sha256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+file)).digest('hex'),checks});await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 const load=s=>page.goto('file://'+root+'/prototypes/frontend/entries-states.html?state='+s);
 await load('capacity-rejected');await page.locator('a[href="#capacity"]').click();if(await page.evaluate(()=>document.activeElement.id)!=='capacity')throw Error('field focus');
 await load('fields-locked');await page.locator('#title').fill('Retained title');if(!await page.locator('#registration-action').isDisabled())throw Error('dirty blocker');
 await load('add-failed');await page.locator('#guest-name').fill('Retained guest');await page.getByRole('button',{name:'Retry add'}).click();if(await page.locator('#guest-name').inputValue()!=='Retained guest')throw Error('retry retention');
 await load('entries-empty-open');await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({width:getComputedStyle(document.activeElement).outlineWidth,style:getComputedStyle(document.activeElement).outlineStyle}));if(focus.width!=='3px'||focus.style!=='solid')throw Error('focus outline '+JSON.stringify(focus));
 await load('admit-out-of-order');if(!await page.locator('#confirm-admit').isDisabled())throw Error('reason required');await page.locator('#reason').fill('Reviewed priority exception');if(await page.locator('#confirm-admit').isDisabled())throw Error('reason enables confirmation');
 await load('adding');if(!await page.getByRole('button',{name:'Adding…'}).isDisabled())throw Error('repeat blocked');
 await load('entries-manual-team');if(await page.locator('h1').textContent()!=='Entries · Saturday Team League')throw Error('team');
 fs.writeFileSync(dir+'/manifest.json',JSON.stringify({description:'Deterministic entries documentation captures; review material approves no product default.',captureMethod:'Playwright with installed Google Chrome, headless, direct file://, device scale 1, en-GB, Europe/Madrid, local assets and system sans-serif fallback.',captures,interactionChecks:['Capacity summary focuses its field','Editing configuration disables the registration action','Retry retains guest input','Keyboard focus has a visible 3px solid outline','Out-of-order admission requires a non-empty private reason','Adding prevents repeat submissions','Team fixture has the expected tournament title'],limitations:'Static snapshots: no backend, persistence, automatic transitions or real revision reconciliation.'},null,2)+'\n');
 await browser.close();console.log('Captured '+captures.length+' images; layout, local loading, labels, IDs, focus and retention checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
