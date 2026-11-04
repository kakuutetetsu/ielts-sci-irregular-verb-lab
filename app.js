'use strict';
const KEY = 'ielts-sci-irregular-verbs-v1';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => s.trim().toLowerCase();
let verbs = [], byId, run = null, view = 'landing', libraryMode = 'overview', hideEnglish = false;
let state = {stats:{}, favorites:[], current:null, theme:'dark'};
try { const saved=JSON.parse(localStorage.getItem(KEY)); if(saved && typeof saved==='object') state={...state,...saved}; } catch {}
if(!state.stats || typeof state.stats!=='object') state.stats={};
if(!Array.isArray(state.favorites)) state.favorites=[];
function save(){state.current=run;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('error').hidden=false;$('error').textContent='浏览器未允许保存记录；本次练习仍可继续。';}}
function stat(id){return state.stats[id] ||= {attempts:0,correct:0,wrong:0,lastWrong:0,masteredForms:[]};}
function mastered(id){const s=stat(id);return ['past','pastParticiple'].every(f=>(s.masteredForms||[]).includes(f));}
function show(id){view=id;for(const x of ['landing','setup','practice','library','finished'])$(x).hidden=x!==id;window.scrollTo(0,0);}
function shuffle(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function fresh(){return {drafts:[],assisted:false,counted:false,solved:false,revealed:false,hint:false,fieldHints:[],outcomes:[],hadWrong:false,usedHelp:false};}
function current(){return byId.get(run.queue[run.pos].verbId);}
function exercise(){return current().exercises.find(e=>e.id===run.queue[run.pos].exerciseId);}
function formKeys(){return exercise()?[exercise().form]:['past','pastParticiple'];}
function answers(){return exercise()?[exercise().answers]:[current().past,current().pastParticiple];}
function start(mode, ids){const list=ids?ids.map(id=>byId.get(id)):verbs;let queue=[];
 if(mode==='ielts'||mode==='academic')queue=list.flatMap(v=>v.exercises.filter(e=>e.domain===mode).map(e=>({verbId:v.id,exerciseId:e.id})));
 else queue=list.map(v=>({verbId:v.id}));
 if(mode==='challenge'){queue=[];while(queue.length<10)queue.push(...shuffle(list).map(v=>({verbId:v.id})));queue=queue.slice(0,10);}
 run={mode,queue,pos:0,round:[],...fresh()};save();renderPractice();}
function renderPractice(){show('practice');const v=current(),e=exercise();$('position').textContent=`${({forms:'三态默写',ielts:'雅思填空',academic:'科研训练',challenge:'分类闯关',review:'错题重练'})[run.mode]} · 第 ${run.pos+1}/${run.queue.length} 题`;
 $('progress').max=run.queue.length;$('progress').value=run.pos;$('title').textContent=e?'根据语境，填入正确词形':'回忆这个动词的过去式与过去分词';
 $('context').textContent=e?`${e.context || (e.domain === 'ielts' ? '雅思学习语境' : '实验与科研语境')} · 目标动词：${v.base}`:`${v.pattern} 型 · 原形`;
 $('question').textContent=e?e.sentence:v.base;$('meaning').textContent=e?'先识别时间线索和助动词，再填写。':v.chinese;
 $('inputs').innerHTML=answers().map((a,i)=>`<div class="field"><label for="answer${i}">${e?'填写动词':i===0?'过去式':'过去分词'}</label><input id="answer${i}" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="fieldFeedback${i}" value="${esc(run.drafts[i]||'')}"><button type="button" data-initial="${i}">提示首字母</button><p id="fieldFeedback${i}" aria-live="polite"></p></div>`).join('');
 $('inputs').style.gridTemplateColumns=e?'1fr':'';
 $('inputs').querySelectorAll('input').forEach((input,i)=>input.addEventListener('input',()=>{run.drafts[i]=input.value;run.counted=false;run.solved=false;run.outcomes=[];run.revealed=false;clearFeedback();save();updateNext();}));
 $('inputs').querySelectorAll('[data-initial]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.initial);run.fieldHints[i]=true;run.assisted=true;run.usedHelp=true;run.solved=false;save();renderHints();updateNext();});
 clearFeedback();renderHints();if(run.outcomes.length)paintOutcomes();if(run.revealed||run.solved)renderResult();updateFavorite();updateStats();updateNext();
}
function clearFeedback(){$('feedback').textContent='';$('feedback').className='';$('result').hidden=true;answers().forEach((a,i)=>{$(`fieldFeedback${i}`).textContent='';$(`answer${i}`).className='';$(`answer${i}`).removeAttribute('aria-invalid');});}
function renderHints(){const e=exercise();$('hint').hidden=!run.hint;$('hint').textContent=e?`线索：${e.clue}；句型：${e.structure}`:'过去式用于过去的事件；过去分词与 have/has/had 或被动结构中的 be 搭配。be 可填 was 或 were；具体选择取决于主语。';run.fieldHints.forEach((yes,i)=>{if(yes)$(`fieldFeedback${i}`).textContent=`首字母：${[...new Set(answers()[i].map(a=>a[0]))].join(' / ')}`;});}
function updateFavorite(){$('favorite').textContent=state.favorites.includes(current().id)?'★ 已收藏':'☆ 收藏';}
function updateStats(){const s=stat(current().id);$('stats').textContent=`${s.attempts} 次有效提交 · ${s.correct} 次独立全对 · ${s.wrong} 次错误 · ${mastered(current().id)?'两种词形已独立答对':'仍需巩固'}`;}
function updateNext(){$('next').disabled=run.mode==='challenge'&&!run.solved;$('next').textContent=run.pos===run.queue.length-1?'完成本轮':'下一题';}
function paintOutcomes(){run.outcomes.forEach((ok,i)=>{const input=$(`answer${i}`);input.classList.toggle('correct',ok);input.setAttribute('aria-invalid',String(!ok));$(`fieldFeedback${i}`).textContent=ok?'词形正确':'词形不正确，请检查拼写或语境。';});const all=run.outcomes.every(Boolean);$('feedback').className=all?'good':'bad';$('feedback').textContent=all?(run.assisted?'填写正确。本次使用了帮助；重置后独立完成，才能记为掌握。':'正确！已记录独立作答。'):'请修改标红的答案，再试一次。';}
function renderResult(){const v=current(),e=exercise();$('result').hidden=false;$('result').innerHTML=e?`<h2>${esc(e.fullSentence)}</h2><p>${esc(e.chinese)}</p><p>${esc(e.explanation)}</p><p><b>时间与结构线索：</b>${esc(e.clue)}</p><p>${esc(e.structure)}</p><p>允许答案：${esc(e.answers.join(' / '))}</p>`:`<h2>${esc(v.base)} — ${esc(v.past.join(' / '))} — ${esc(v.pastParticiple.join(' / '))}</h2><p>${esc(v.chinese)}</p><p>${esc(v.notes)}</p>`;}
function check(event){event.preventDefault();if(run.counted)return;run.drafts=answers().map((a,i)=>$(`answer${i}`).value);if(run.drafts.some(x=>!norm(x))){$('feedback').className='bad';$('feedback').textContent='请填写全部输入框；空白提交不会计入练习次数。';save();return;}
 run.outcomes=answers().map((a,i)=>a.some(x=>norm(x)===norm(run.drafts[i])));const all=run.outcomes.every(Boolean),s=stat(current().id);s.attempts++;s.masteredForms ||= [];
 if(!all){s.wrong++;s.lastWrong=Date.now();run.hadWrong=true;formKeys().forEach((f,i)=>{if(!run.outcomes[i])s.masteredForms=s.masteredForms.filter(x=>x!==f);});}
 if(!run.assisted){formKeys().forEach((f,i)=>{if(run.outcomes[i]&&!s.masteredForms.includes(f))s.masteredForms.push(f);});if(all)s.correct++;}
 run.counted=true;run.solved=all&&!run.assisted;save();paintOutcomes();if(all)renderResult();updateStats();updateNext();}
function reset(){const history={hadWrong:run.hadWrong,usedHelp:run.usedHelp};Object.assign(run,fresh(),history);save();renderPractice();}
function next(){if(run.mode==='challenge'&&!run.solved)return;run.round[run.pos]={id:current().id,correct:run.solved,firstTry:run.solved&&!run.hadWrong&&!run.usedHelp};if(run.pos+1===run.queue.length){show('finished');$('score').textContent=`完成 ${run.queue.length} 题 · 独立答对 ${run.round.filter(x=>x?.correct).length} 题 · 无错误且未使用帮助 ${run.round.filter(x=>x?.firstTry).length} 题。`;$('roundErrors').innerHTML=run.round.filter(x=>!x.firstTry).map(x=>`<p>${esc(x.id)}：需要继续巩固</p>`).join('')||'<p>本轮全部独立完成。</p>';run.finished=true;save();return;}run.pos++;Object.assign(run,fresh());save();renderPractice();}
function toggleFavorite(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();}
function home(){show('landing');$('homeStats').textContent=`60 个动词 · 246 道语境题 · 已独立答对两种词形 ${verbs.filter(v=>mastered(v.id)).length}/60`;$('resume').hidden=!run||run.finished;}
function library(mode){libraryMode=mode;show('library');$('libraryTitle').textContent=({overview:'动词总览',compare:'句型对照学习',review:'错题本与待掌握'})[mode];renderLibrary();}
function renderLibrary(){let list=verbs.filter(v=>($('filter').value==='all'||v.pattern===$('filter').value)&&(!$('favoritesOnly').checked||state.favorites.includes(v.id))&&`${v.base} ${v.chinese}`.toLowerCase().includes($('search').value.trim().toLowerCase()));if(libraryMode==='review')list=list.filter(v=>!mastered(v.id)).sort((a,b)=>stat(b.id).lastWrong-stat(a.id).lastWrong||stat(b.id).wrong-stat(a.id).wrong);
 $('libraryInfo').textContent=`${list.length} 个动词${libraryMode==='review'?' · 最近答错优先；未练习的词也列为待掌握':''}`;$('hide').textContent=hideEnglish?'显示英文':'隐藏英文';
 let reviewStart=$('reviewStart');if(!reviewStart){reviewStart=document.createElement('button');reviewStart.id='reviewStart';reviewStart.className='primary';$('libraryInfo').after(reviewStart);}reviewStart.hidden=libraryMode!=='review'||!list.length;reviewStart.textContent='依次重练当前列表';reviewStart.onclick=()=>start('review',list.map(v=>v.id));
 $('list').innerHTML=list.length?list.map(v=>{const s=stat(v.id),pair=v.exercises.filter(e=>e.domain==='academic');return `<article class="card" data-verb="${v.id}"><div class="pattern">${v.pattern} 型</div><h3>${esc(v.chinese)}</h3><div data-english ${hideEnglish?'hidden':''}><p class="english">${esc(v.base)} — ${esc(v.past.join(' / '))} — ${esc(v.pastParticiple.join(' / '))}</p>${libraryMode==='compare'?pair.map(e=>`<div class="comparison"><b>${esc(e.tense)}</b><p>${esc(e.fullSentence)}</p><p>${esc(e.chinese)}</p><p>${esc(e.explanation)}</p><small>${esc(e.structure)}</small></div>`).join(''):`<p>${esc(pair[0].fullSentence)}</p><p>${esc(pair[0].chinese)}</p>`}<p>${esc(v.notes)}</p></div><small>${s.attempts} 次练习 · 独立全对率 ${s.attempts?Math.round(s.correct/s.attempts*100):0}% · ${mastered(v.id)?'已独立答对两种词形':'待掌握'}</small><div class="controls"><button data-peek>显示/隐藏英文</button><button data-star>${state.favorites.includes(v.id)?'★ 已收藏':'☆ 收藏'}</button><button data-practice>练习此词</button></div></article>`;}).join(''):'<p class="card">当前筛选下没有语料。</p>';
 $('list').querySelectorAll('[data-verb]').forEach(card=>{const id=card.dataset.verb;card.querySelector('[data-peek]').onclick=()=>{const el=card.querySelector('[data-english]');el.hidden=!el.hidden;};card.querySelector('[data-star]').onclick=()=>{toggleFavorite(id);renderLibrary();};card.querySelector('[data-practice]').onclick=()=>start(libraryMode==='review'?'review':'forms',[id]);});}
async function init(){try{const response=await fetch('./verbs.json');if(!response.ok)throw Error('HTTP '+response.status);verbs=await response.json();if(verbs.length!==60||new Set(verbs.map(v=>v.id)).size!==60)throw Error('题库数量异常');byId=new Map(verbs.map(v=>[v.id,v]));
 const candidate=state.current;if(candidate&&Array.isArray(candidate.queue)&&candidate.queue.length&&Number.isInteger(candidate.pos)&&candidate.pos>=0&&candidate.pos<candidate.queue.length&&candidate.queue.every(q=>byId.has(q.verbId)&&(!q.exerciseId||byId.get(q.verbId).exercises.some(e=>e.id===q.exerciseId))))run={...fresh(),...candidate};
 document.body.classList.toggle('light',state.theme==='light');$('theme').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';document.body.classList.toggle('light',state.theme==='light');save();};$('home').onclick=home;
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>library(b.dataset.view));$('challenge').onclick=()=>show('setup');$('startChallenge').onclick=()=>start('challenge',verbs.filter(v=>$('group').value==='all'||v.pattern===$('group').value).map(v=>v.id));
 $('resume').onclick=renderPractice;$('favorite').onclick=()=>{toggleFavorite(current().id);updateFavorite();};$('form').onsubmit=check;$('reset').onclick=reset;$('next').onclick=next;$('hintBtn').onclick=()=>{run.hint=true;run.assisted=true;run.usedHelp=true;run.solved=false;save();renderHints();updateNext();};$('reveal').onclick=()=>{run.assisted=true;run.usedHelp=true;run.revealed=true;run.solved=false;save();renderResult();$('feedback').textContent='已查看答案。重置后重新独立作答，才能记为掌握。';updateNext();};
 $('hide').onclick=()=>{hideEnglish=!hideEnglish;renderLibrary();};['search','filter','favoritesOnly'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderLibrary));$('restart').onclick=()=>{if(run.mode==='challenge')show('setup');else home();};
 if(run&&!run.finished)renderPractice();else home();
 }catch(error){$('error').hidden=false;$('error').textContent=`无法加载题库：${error.message}。请通过本地 HTTP 服务打开，不能直接双击 HTML。`;}}
init();

