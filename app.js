/* Goal Overlays. 100% statische Client-App; keine Twitch-Verbindung im Dashboard. */
(() => {
  'use strict';
  const KEY='subboost-studio-v1';
  const kinds=['subs','followers','timer'];
  const choices=['neon','glass','fill','sharp','outline','transparent','image'];
  const labels={subs:'Abo-Ziel',followers:'Follower-Ziel',timer:'Stream-Timer'};
  const createWidgets=()=>Object.fromEntries(kinds.map(kind=>[kind,{style:'neon',accent:'#7863ee',title:'STREAM GOALS',bgUrl:'',bgData:''}]));
  const defaultState={style:'neon',accent:'#7863ee',title:'STREAM GOALS',subs:24,subsTarget:50,followers:128,followersTarget:200,durationMs:43200000,remainingMs:43200000,running:false,startedAt:null,bgUrl:'',bgData:'',selectedWidget:'subs',widgets:createWidgets()};
  const get=id=>document.getElementById(id);
  const clamp=(val,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(val))?Number(val):min));
  function load(){
    try{
      const old=JSON.parse(localStorage.getItem('subboost-studio-v1'))||{};
      const d={...defaultState,...old};
      if(!old.widgets){
        let prior={};try{prior=JSON.parse(localStorage.getItem('subboost-studio-independent-widgets-v1'))||{}}catch(_){}
        const base={style:old.style||'neon',accent:old.accent||'#7863ee',title:old.title||'STREAM GOALS',bgUrl:old.bgUrl||'',bgData:old.bgData||''};
        d.widgets=Object.fromEntries(kinds.map(kind=>[kind,{...base,style:prior[kind]?.style||base.style,accent:prior[kind]?.accent||base.accent}]));
        if(prior.subs){if(prior.subs.current!==undefined)d.subs=prior.subs.current;if(prior.subs.target!==undefined)d.subsTarget=prior.subs.target}
        if(prior.followers){if(prior.followers.current!==undefined)d.followers=prior.followers.current;if(prior.followers.target!==undefined)d.followersTarget=prior.followers.target}
        if(prior.timer?.hours&&!old.running){d.durationMs=clamp(prior.timer.hours,1,240)*3600000;d.remainingMs=d.durationMs}
      }
      return d;
    }catch(_){return {...defaultState,widgets:createWidgets()}}
  }
  function normalize(obj){
    const d={...defaultState,...obj};
    d.style=choices.includes(d.style)?d.style:'neon';
    d.accent=/^#[a-f0-9]{6}$/i.test(d.accent)?d.accent:'#7863ee';
    d.title=String(d.title||'STREAM GOALS').slice(0,32);
    d.subs=clamp(d.subs,0,1000000);d.subsTarget=clamp(d.subsTarget,1,1000000);
    d.followers=clamp(d.followers,0,1000000);d.followersTarget=clamp(d.followersTarget,1,1000000);
    d.durationMs=clamp(d.durationMs,3600000,240*3600000);d.remainingMs=clamp(d.remainingMs,0,240*3600000);
    d.running=Boolean(d.running);d.startedAt=Number(d.startedAt)||null;
    d.selectedWidget=kinds.includes(d.selectedWidget)?d.selectedWidget:'subs';
    d.widgets=Object.fromEntries(kinds.map(kind=>{
      const w=d.widgets?.[kind]||{};
      return [kind,{style:choices.includes(w.style)?w.style:d.style,accent:/^#[a-f0-9]{6}$/i.test(w.accent)?w.accent:d.accent,
        title:String(w.title||d.title).slice(0,32),bgUrl:String(w.bgUrl||d.bgUrl||'').slice(0,2048),bgData:String(w.bgData||'').slice(0,1250000)}];
    }));
    return d;
  }
  let state=normalize(load());
  const params=new URLSearchParams(window.location.search),obsView=params.get('overlay');
  const overlayMode=['all','subs','followers','timer'].includes(obsView);
  if(overlayMode){try{const raw=params.get('config');if(raw&&raw.length<12000)state=normalize({...state,...JSON.parse(raw),bgData:''})}catch(_){}}
  const widget=kind=>state.widgets[kind||state.selectedWidget];
  const safePct=(cur,total)=>Math.min(100,Math.max(0,Math.round(cur/Math.max(1,total)*100)));
  const fmt=(ms)=>{const s=Math.max(0,Math.ceil(ms/1000));const hrs=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return `${String(hrs).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`};
  const currentTimer=()=>state.running&&state.startedAt?Math.max(0,state.remainingMs-(Date.now()-state.startedAt)):state.remainingMs;
  function persist(){if(overlayMode)return;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){notify('Speicher voll: Bild bitte kleiner wählen.')}}
  function persistAndRender(){persist();render()}
  function timerText(){let ms=currentTimer();if(state.running&&ms===0){state.running=false;state.startedAt=null;state.remainingMs=0;persist()}return fmt(ms)}
  function stateText(){return state.running?'Timer läuft': currentTimer()<=0?'Zeit abgelaufen':currentTimer()===state.durationMs?'Bereit zum Starten':'Pausiert'}
  function renderOverlay(el){
    if(!el)return;
    const view=overlayMode?obsView:state.selectedWidget,all=view==='all',w=widget(all?'subs':view);
    el.className=all?'overlay-content mixed-mode':'overlay-content style-'+w.style;
    el.style.setProperty('--accent',w.accent);
    el.querySelector('#preview-title').textContent=all?state.title:w.title;
    el.querySelector('#preview-subs').innerHTML=`${state.subs} <small>/ ${state.subsTarget}</small>`;
    el.querySelector('#preview-followers').innerHTML=`${state.followers} <small>/ ${state.followersTarget}</small>`;
    el.querySelector('#subs-progress').style.width=safePct(state.subs,state.subsTarget)+'%';
    el.querySelector('#followers-progress').style.width=safePct(state.followers,state.followersTarget)+'%';
    el.querySelector('#preview-timer').textContent=timerText();
    el.querySelector('#timer-state-label').textContent=stateText();
    for(const [kind,cls] of [['subs','subs-card'],['followers','followers-card'],['timer','timer-card']]){
      const card=el.querySelector('.'+cls),c=widget(kind);
      card.hidden=!all&&kind!==view;
      card.className='goal-card '+cls+' style-'+c.style;
      card.style.setProperty('--accent',c.accent);
      const bg=c.bgUrl||c.bgData;
      card.style.backgroundImage=all&&c.style==='image'&&bg?`linear-gradient(#12203255,#12203255),url(${JSON.stringify(bg)})`:'';
    }
    const bg=w.bgUrl||w.bgData;
    el.style.backgroundImage=!all&&w.style==='image'&&bg?`linear-gradient(#12203228,#12203228),url(${JSON.stringify(bg)})`:'';
  }
  function render(){
    if(overlayMode){renderOverlay(get('obs-content')?.querySelector('.overlay-content'));return}
    renderOverlay(get('overlay-preview'));
    get('sum-subs').innerHTML=`${state.subs} <span>/ ${state.subsTarget}</span>`;
    get('sum-followers').innerHTML=`${state.followers} <span>/ ${state.followersTarget}</span>`;
    get('sum-subs-line').style.width=safePct(state.subs,state.subsTarget)+'%';
    get('sum-followers-line').style.width=safePct(state.followers,state.followersTarget)+'%';
    get('sum-timer').textContent=timerText();get('timer-control-display').textContent=timerText();
    get('sum-timer-status').textContent=stateText();
    get('sum-timer-line').style.width=(100-Math.round(currentTimer()/Math.max(1,state.durationMs)*100))+'%';
    get('timer-toggle').textContent=state.running?'Ⅱ Timer pausieren':currentTimer()===0?'↺ Neu starten':'▶ Timer '+(currentTimer()===state.durationMs?'starten':'fortsetzen');
    const selected=state.selectedWidget,w=widget();
    document.querySelectorAll('[data-widget]').forEach(button=>{
      const active=button.dataset.widget===selected;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
    });
    get('subs-settings-row').hidden=selected!=='subs';get('followers-settings-row').hidden=selected!=='followers';
    get('goal-counter-settings').hidden=selected==='timer';get('timer-settings').hidden=selected!=='timer';get('goals-divider').hidden=true;
    get('active-preview-label').textContent='· '+labels[selected];
    get('active-design-label').textContent='· '+labels[selected];
    document.querySelectorAll('[data-style]').forEach(tile=>{tile.classList.toggle('selected',tile.dataset.style===w.style);tile.setAttribute('aria-pressed',String(tile.dataset.style===w.style))});
    document.querySelectorAll('[data-hours]').forEach(b=>b.classList.toggle('active',!state.running&&state.durationMs===Number(b.dataset.hours)*3600000));
    get('hex-label').textContent=w.accent.toUpperCase();
    const copyLabel=get('copy-overlay-all');if(copyLabel.firstChild)copyLabel.firstChild.textContent=labels[selected]+'-OBS-Link kopieren ';
  }
  function syncFields(){
    const w=widget();
    for(const [id,v] of [['subs-current',state.subs],['subs-target',state.subsTarget],['followers-current',state.followers],['followers-target',state.followersTarget],['label-name',w.title],['accent',w.accent],['background-url',w.bgUrl]]){
      const el=get(id);if(el)el.value=v;
    }
    get('custom-hours').value=String(state.durationMs/3600000);
  }
  function selectWidget(kind){
    if(!kinds.includes(kind))return;
    state.selectedWidget=kind;persist();syncFields();render();
  }
  function changeNum(id,prop,min){get(id).addEventListener('input',ev=>{state[prop]=clamp(ev.target.value,min,1000000);persistAndRender()})}
  function chooseDuration(hours){if(state.running){notify('Timer zuerst pausieren, um die Dauer zu ändern.');return}const ms=clamp(hours,1,240)*3600000;state.durationMs=ms;state.remainingMs=ms;state.startedAt=null;persistAndRender()}
  function toggleTimer(){if(state.running){state.remainingMs=currentTimer();state.running=false;state.startedAt=null}else{if(state.remainingMs<=0)state.remainingMs=state.durationMs;state.running=true;state.startedAt=Date.now()}persistAndRender()}
  function resetTimer(){state.running=false;state.startedAt=null;state.remainingMs=state.durationMs;persistAndRender()}
  let toastTimeout;function notify(message){let el=get('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3200)}
  function linkFor(view){
    const widgets=Object.fromEntries(kinds.map(k=>[k,{...widget(k),bgData:''}]));
    const obj={...state,widgets,bgData:'',remainingMs:currentTimer(),startedAt:state.running?Date.now():null};
    if(!/^https?:$/i.test(location.protocol))notify('Für OBS-Link zuerst auf GitHub Pages veröffentlichen.');
    const url=new URL(window.location.href);url.search='';url.hash='';
    url.searchParams.set('overlay',view);url.searchParams.set('config',JSON.stringify(obj));return url.toString();
  }
  async function copy(view){const url=linkFor(view);try{await navigator.clipboard.writeText(url);notify('Overlay-Link kopiert. In OBS als Browser-Quelle einfügen.')}catch(_){window.prompt('Diesen OBS-Link kopieren:',url)}}
  if(overlayMode){document.body.classList.add('obs-mode');get('obs-overlay-root').hidden=false;get('obs-overlay-root').dataset.view=obsView;get('obs-overlay-root').classList.toggle('has-timer',['all','timer'].includes(obsView));const cloned=get('overlay-preview').cloneNode(true);get('obs-content').appendChild(cloned);const s=document.createElement('style');s.textContent=obsView==='subs'?'.obs-root .followers-card,.obs-root .timer-card,.obs-root .preview-heading{display:none}':obsView==='followers'?'.obs-root .subs-card,.obs-root .timer-card,.obs-root .preview-heading{display:none}':obsView==='timer'?'.obs-root .subs-card,.obs-root .followers-card,.obs-root .preview-heading{display:none}':'';document.head.appendChild(s);get('obs-start-pause').addEventListener('click',toggleTimer);get('obs-reset').addEventListener('click',resetTimer);render();setInterval(render,300);return}
  syncFields();
  document.querySelectorAll('[data-widget]').forEach(el=>el.addEventListener('click',()=>selectWidget(el.dataset.widget)));document.querySelectorAll('[data-style]').forEach(el=>el.addEventListener('click',()=>{widget().style=el.dataset.style;persistAndRender()}));changeNum('subs-current','subs',0);changeNum('subs-target','subsTarget',1);changeNum('followers-current','followers',0);changeNum('followers-target','followersTarget',1);
  get('test-sub').addEventListener('click',()=>{state.subs=Math.min(1000000,state.subs+1);get('subs-current').value=state.subs;persistAndRender()});get('test-follower').addEventListener('click',()=>{state.followers=Math.min(1000000,state.followers+1);get('followers-current').value=state.followers;persistAndRender()});
  get('accent').addEventListener('input',ev=>{widget().accent=ev.target.value;persistAndRender()});get('label-name').addEventListener('input',ev=>{widget().title=ev.target.value;persistAndRender()});get('background-url').addEventListener('input',ev=>{widget().bgUrl=ev.target.value.trim().slice(0,2048);persistAndRender()});
  get('background-file').addEventListener('change',ev=>{const file=ev.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){notify('Bitte eine Bilddatei auswählen.');return}if(file.size>800000){notify('Maximal 800 KB: bitte Bild verkleinern oder Bild-URL nutzen.');return}const reader=new FileReader();reader.onload=()=>{widget().bgData=String(reader.result);widget().bgUrl='';get('background-url').value='';widget().style='image';persistAndRender()};reader.readAsDataURL(file)});
  get('timer-toggle').addEventListener('click',toggleTimer);get('timer-reset').addEventListener('click',resetTimer);document.querySelectorAll('[data-hours]').forEach(b=>b.addEventListener('click',()=>chooseDuration(b.dataset.hours)));get('custom-hours').addEventListener('change',ev=>{if(Number(ev.target.value)>0)chooseDuration(ev.target.value)});
  get('copy-overlay-all').addEventListener('click',()=>copy(state.selectedWidget));for(const [id,view] of [['copy-all','all'],['copy-subs','subs'],['copy-followers','followers'],['copy-timer','timer']])get(id).addEventListener('click',()=>copy(view));get('open-preview').addEventListener('click',()=>window.open(linkFor(state.selectedWidget),'_blank','noopener,noreferrer'));
  get('reset-all').addEventListener('click',()=>{if(window.confirm('Alle lokalen Einstellungen zurücksetzen?')){state=normalize({...defaultState,widgets:createWidgets()});try{localStorage.removeItem('subboost-studio-independent-widgets-v1')}catch(_){}persist();syncFields();render();notify('Einstellungen zurückgesetzt.')}});render();setInterval(render,300);
})();
