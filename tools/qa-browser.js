'use strict';
// QA-only; the published offline index.html is not modified.
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
async function main(){
 const root=path.resolve(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const checks=[],errors=[],requests=[];
 const test=(label,ok,detail='')=>{
  checks.push({label,pass:!!ok,detail});
  console.log((ok?'PASS ':'FAIL ')+label+(detail?' — '+detail:''));
 };
 test('single self-contained HTML file',/<script>\s*"use strict";/.test(html)&&!/<script[^>]+src\s*=/.test(html));
 test('existing saved-state keys preserved',['mirrorwork.best','mirrorwork.muted','mirrorwork.prefs'].every(k=>html.includes(k)));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.route(/^https?:\/\//,route=>{requests.push(route.request().url());return route.abort();});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e.message)));
  const file=pathToFileURL(path.join(root,'index.html')).href;
  await page.goto(file,{waitUntil:'load'});
  test('game starts without network',await page.title()==='Mirrorwork — a memory game');
  test('five playable decks',await page.locator('#decks [data-deck]').count()===5);
  test('three selectable board sizes',await page.locator('#sizes [data-size]').count()===3);
  for(const size of [4,5,6]){
   await page.locator('#sizes [data-size="'+size+'"]').click();
   const names=await page.locator('#board .scene').evaluateAll(nodes=>nodes.map(n=>n.dataset.uid));
   const count=size===5?24:size*size;
   test(size+'x'+size+' expected card count',names.length===count,'cards='+names.length);
   test(size+'x'+size+' exactly two of each pair',
    new Set(names).size===count&&names.every(n=>/^\d+[ab]$/.test(n))&&
    [...new Set(names.map(n=>n.slice(0,-1)))].every(i=>names.includes(i+'a')&&names.includes(i+'b')));
   test(size+'x'+size+' correct ornament',await page.locator('#board .ornament').count()===(size===5?1:0));
   const dims=await page.evaluate(()=>({w:document.documentElement.scrollWidth,viewport:innerWidth}));
   test(size+'x'+size+' mobile overflow',dims.w<=dims.viewport+3,JSON.stringify(dims));
  }
  for(const deck of ['signal','facet','bloom','circuitry','rosette']){
   await page.locator('#decks [data-deck="'+deck+'"]').click();
   test(deck+' deck selection',await page.locator('#decks [data-deck="'+deck+'"]').getAttribute('aria-pressed')==='true');
  }
  await page.locator('#sizes [data-size="4"]').click();
  await page.locator('#decks [data-deck="signal"]').click();
  const arrangement=await page.locator('#board .scene').evaluateAll(nodes=>nodes.map(n=>n.dataset.uid).join(','));
  const hash=new URL(page.url()).hash;
  await page.reload({waitUntil:'load'});
  test('URL shuffle code survives reload',new URL(page.url()).hash===hash);
  test('identical card positions after reload',arrangement===
   await page.locator('#board .scene').evaluateAll(nodes=>nodes.map(n=>n.dataset.uid).join(',')));
  // Play a full round by clicking real buttons. Card IDs are test-only clues.
  const ids=await page.locator('#board .scene').evaluateAll(nodes=>nodes.map(n=>n.dataset.uid));
  const pairs=[...new Set(ids.map(id=>id.slice(0,-1)))];
  for(let i=0;i<pairs.length;i++){
   const a=page.locator('#board .scene[data-uid="'+pairs[i]+'a"]');
   const b=page.locator('#board .scene[data-uid="'+pairs[i]+'b"]');
   await a.click();
   await b.click();
   await page.waitForFunction(expected=>document.querySelectorAll('#board .scene.matched').length===expected,2*(i+1),{timeout:4000});
  }
  test('matching finishes and shows results',await page.locator('#win').isVisible());
  test('exactly eight moves for eight pairs',(await page.locator('#wMoves').innerText()).trim()==='8');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mirrorwork.best')||'{}'));
  test('completed round writes best score',Object.keys(saved).some(k=>k.startsWith('signal:4')));
  await page.reload({waitUntil:'load'});
  test('best score survives reload',await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('mirrorwork.best')||'{}')).some(k=>k.startsWith('signal:4'))));
  test('deck and size preferences survive reload',
   await page.locator('#decks [data-deck="signal"]').getAttribute('aria-pressed')==='true'&&
   await page.locator('#sizes [data-size="4"]').getAttribute('aria-pressed')==='true');
  // Starting a turn, pause must block cards, then resume.
  await page.locator('#board .scene').first().click();
  await page.locator('#pause').click();
  test('pause overlay appears',await page.locator('#veil').isVisible());
  const before=await page.locator('#moves').innerText();
  test('paused game disables cards',await page.locator('#board .scene').evaluateAll(nodes=>nodes.every(n=>n.disabled)));
  await page.locator('#veil').click();
  test('resume restores board',!(await page.locator('#veil').isVisible()));
  test('pause does not invent moves',(await page.locator('#moves').innerText())===before);
  for(const viewport of [{width:320,height:700},{width:768,height:1024},{width:1280,height:800}]){
   await page.setViewportSize(viewport);
   await page.waitForTimeout(100);
   const v=await page.evaluate(()=>({w:document.documentElement.scrollWidth,viewport:innerWidth}));
   test(viewport.width+'px viewport no horizontal overflow',v.w<=v.viewport+3,JSON.stringify(v));
  }
  test('no unhandled JavaScript errors',errors.length===0,errors.slice(0,3).join(' | '));
  test('no remote requests',requests.length===0,requests.slice(0,3).join(' | '));
  await context.close();
 }finally{await browser.close()}
 const fail=checks.filter(c=>!c.pass);
 console.log('RESULT:',checks.length-fail.length+'/'+checks.length,'QA checks passed');
 if(fail.length)process.exitCode=1;
}
main().catch(e=>{console.error('QA ERROR:',e.stack||e);process.exitCode=1});
