/* LearningMirror — APP LOGIC
   Flow: home → common core (6 Q) → AI ROUTER (routeToSet)
   → one question set (8 Q) → interactive task → AI result.
   The trained handwriting CNN lives in tfjs_model/ and is used
   by analyseHandwriting() below. */

/* ---------- STATE ---------- */
let lang = "hi";
let childAge = null;
let phase = "core";        // "core" | "set"
let routedSet = null;       // "A" | "B" | "C" | "D"
let idx = 0;
let coreAnswers = new Array(CORE.length).fill(null);
let setAnswers = [];
let lastResult = null;
let taskData = null;        // machine-measured task result
let taskImage = null;       // {media_type, data} for handwriting photo
const TOTAL_Q = CORE.length + 8;
function ageBand(){ return childAge<=7 ? 0 : 1; }
function tt(){ return TASKTEXT[lang] || TASKTEXT.en; }

/* ---------- API KEY (stored in the browser, never in files) ---------- */
function apiKey(){
  if(typeof ANTHROPIC_API_KEY !== "undefined" && ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== "PASTE_YOUR_API_KEY_HERE") return ANTHROPIC_API_KEY;
  try{ return localStorage.getItem("lm_key") || ""; }catch(e){ return ""; }
}
function aiReady(){ return (typeof PROXY_URL !== "undefined" && PROXY_URL) || !!apiKey(); }
function aiUrl(){ return (typeof PROXY_URL !== "undefined" && PROXY_URL) ? PROXY_URL : "https://api.anthropic.com/v1/messages"; }
function aiHeaders(){
  if(typeof PROXY_URL !== "undefined" && PROXY_URL) return {"content-type":"application/json"};
  return {"content-type":"application/json","x-api-key":apiKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"};
}
function renderKeyPrompt(onDone){
  const body = document.getElementById('resultBody');
  body.innerHTML = `<div class="result-h">One-time setup</div>
    <div class="err">To turn on the AI, paste your Anthropic API key below. It is saved only in this browser — never uploaded anywhere.</div>
    <input id="keyIn" placeholder="sk-ant-..." style="width:100%;box-sizing:border-box;margin-top:14px;padding:14px;border:1.5px solid var(--line);border-radius:12px;font-size:14px">`;
  document.getElementById('resBtn').style.display = "none";
  const rb = document.getElementById('restartBtn');
  rb.textContent = "Save & continue";
  rb.onclick = ()=>{
    const v = (document.getElementById('keyIn').value||"").trim();
    if(!v) return;
    try{ localStorage.setItem("lm_key", v); }catch(e){}
    (onDone || submit)();
  };
  show('result');
}

/* ---------- HELPERS ---------- */
function t(){ return UI[lang] || UI.en; }
function langName(){ return (LANGS.find(x=>x.code===lang)||{name:"English"}).name; }
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  window.scrollTo(0,0);
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* ---------- LANGUAGES (dropdown + AI translation on demand) ----------
   hi and en ship hand-written. Any of the other 20 scheduled languages is
   translated by the AI once when first selected, then cached on the phone. */
function renderLangSel(){
  const s = document.getElementById('langSel');
  s.innerHTML = LANGS.map(x=>`<option value="${x.code}" ${x.code===lang?"selected":""}>${esc(x.native)}</option>`).join("");
}

function mergeLang(code, tr){
  UI[code] = tr.ui;
  TASKTEXT[code] = tr.task;
  RESOURCES[code] = tr.resources;
  CORE.forEach((q,i)=>{ q[code] = tr.core[i]; });
  ["A","B","C","D"].forEach(k=> SETS[k].forEach((q,i)=>{ q[code] = tr.sets[k][i]; }));
  TASKCONTENT.passages[0][code] = tr.passages["0"];
  TASKCONTENT.passages[1][code] = tr.passages["1"];
  TASKCONTENT.copySentence[0][code] = tr.copy["0"];
  TASKCONTENT.copySentence[1][code] = tr.copy["1"];
}

let lastLangError = "";
async function ensureLang(code){
  lastLangError = "";
  if(UI[code]) return true;
  try{
    const cached = localStorage.getItem("lm_tr1_"+code);
    if(cached){ mergeLang(code, JSON.parse(cached)); return true; }
  }catch(e){}
  if(!aiReady()) return false;
  const L = LANGS.find(x=>x.code===code); if(!L) return false;
  const bundle = {
    ui: UI.en,
    core: CORE.map(q=>q.en),
    sets: {A:SETS.A.map(q=>q.en), B:SETS.B.map(q=>q.en), C:SETS.C.map(q=>q.en), D:SETS.D.map(q=>q.en)},
    task: TASKTEXT.en,
    passages: {"0":TASKCONTENT.passages[0].en, "1":TASKCONTENT.passages[1].en},
    copy: {"0":TASKCONTENT.copySentence[0].en, "1":TASKCONTENT.copySentence[1].en},
    resources: RESOURCES.en
  };
  try{
    const ctrl = new AbortController();
    const killer = setTimeout(()=>ctrl.abort(), 360000);   // hard stop after 6 min
    const res = await fetch(aiUrl(),{
      method:"POST", signal:ctrl.signal,
      headers: aiHeaders(),
      body:JSON.stringify({
        model:MODEL, max_tokens:12000, stream:true,
        system:`You translate a parenting app about children's learning into ${L.name}. Translate EVERY string value in the JSON the user sends into simple, warm, everyday ${L.name} that a parent with basic schooling understands — the register a kind school teacher would use, not formal or literary language. Keep the exact same JSON structure, keys, and array lengths. Do not translate: the name "LearningMirror", phone numbers, "API", emoji, or symbols like ▶ ✓ 📞. Keep helpline names recognisable (transliterate). Reading passages and copy sentences should be culturally natural in ${L.name}, age-appropriate, and roughly the same length — adapt rather than translate word-for-word. Return ONLY the JSON.`,
        messages:[{role:"user", content:JSON.stringify(bundle)}]
      })
    });
    if(!res.ok){
      clearTimeout(killer);
      let detail = "HTTP "+res.status;
      try{ const eb = await res.json(); detail += ": "+((eb.error&&eb.error.message)||JSON.stringify(eb)).slice(0,200); }catch(e){}
      lastLangError = detail;
      return false;
    }
    // read the stream chunk by chunk, showing live progress
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", txt = "";
    const progEl = document.getElementById('loadSub');
    while(true){
      const {done, value} = await reader.read();
      if(done) break;
      buf += dec.decode(value, {stream:true});
      const lines = buf.split("\n");
      buf = lines.pop();
      for(const line of lines){
        if(!line.startsWith("data:")) continue;
        try{
          const j = JSON.parse(line.slice(5).trim());
          if(j.type==="content_block_delta" && j.delta && j.delta.text) txt += j.delta.text;
        }catch(e){}
      }
      if(progEl) progEl.textContent = "Translating… "+Math.round(txt.length/10)/100+"k done";
    }
    clearTimeout(killer);
    txt = txt.slice(txt.indexOf("{"), txt.lastIndexOf("}")+1);
    const tr = JSON.parse(txt);
    mergeLang(code, tr);
    try{ localStorage.setItem("lm_tr1_"+code, JSON.stringify(tr)); }catch(e){}
    return true;
  }catch(e){ lastLangError = String(e).slice(0,200); return false; }
}

async function setLang(l){
  if(l === lang) return;
  if(!UI[l]){
    let cached = false;
    try{ cached = !!localStorage.getItem("lm_tr1_"+l); }catch(e){}
    if(!cached && !aiReady()){
      renderKeyPrompt(()=>{ show('home'); setLang(l); });
      renderLangSel();
      return;
    }
    const cur = (document.querySelector('.screen.show')||{}).id || "home";
    show('loading');
    const L = LANGS.find(x=>x.code===l) || {native:l, name:l};
    document.getElementById('loadText').textContent = "Preparing "+L.native+"…";
    document.getElementById('loadSub').textContent = "One moment — this happens only once (about 1 minute).";
    const ok = await ensureLang(l);
    show(cur);
    if(!ok){
      renderLangSel();
      alert("Could not prepare "+L.native+".\n\nReason: "+(lastLangError||"unknown")+"\n\nScreenshot this message and send it to Claude.");
      return;
    }
  }
  lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = (LANGS.find(x=>x.code===l)||{}).rtl ? "rtl" : "ltr";
  renderLangSel();
  renderHome();
  if(document.getElementById('quiz').classList.contains('show')) renderQ();
  if(document.getElementById('task').classList.contains('show')) startTask();
  if(lastResult && document.getElementById('result').classList.contains('show')) renderResult(lastResult);
  if(document.getElementById('resources').classList.contains('show')) renderResources();
  document.getElementById('brandSub').textContent = t().brandSub;
  document.getElementById('footMini').textContent = t().foot;
}

/* ---------- HOME ---------- */
function renderHome(){
  document.getElementById('homeTitle').textContent = t().homeTitle;
  document.getElementById('homeLead').textContent = t().homeLead;
  document.getElementById('agePill').textContent = t().agePill;
  document.getElementById('homeNote').textContent = t().homeNote;
  document.getElementById('startBtn').textContent = t().start;
  const grid = document.getElementById('ageGrid');
  grid.innerHTML = "";
  [5,6,7,8,9,10].forEach(a=>{
    const b = document.createElement('button');
    b.className = "agechip" + (childAge===a ? " sel":"");
    b.textContent = a;
    b.onclick = ()=>{ childAge=a; renderHome(); };
    grid.appendChild(b);
  });
  document.getElementById('startBtn').disabled = childAge===null;
}

/* ---------- QUIZ ---------- */
function startTest(){
  phase = "core"; idx = 0;
  coreAnswers = new Array(CORE.length).fill(null);
  setAnswers = []; routedSet = null; lastResult = null;
  show('quiz');
  renderQ();
}

function currentList(){ return phase==="core" ? CORE : SETS[routedSet]; }
function currentAnswers(){ return phase==="core" ? coreAnswers : setAnswers; }
function globalIndex(){ return phase==="core" ? idx : CORE.length + idx; }

function renderQ(){
  const qs = currentList();
  const q = qs[idx];
  document.getElementById('qPhase').textContent = phase==="core" ? t().phaseCore : t().phaseSet;
  document.getElementById('qCount').textContent = (globalIndex()+1)+" "+t().of+" "+TOTAL_Q;
  document.getElementById('qText').textContent = q[lang] || q.en;
  document.getElementById('progBar').style.width = ((globalIndex()+1)/TOTAL_Q*100)+"%";
  const opts = document.getElementById('qOpts');
  opts.innerHTML = "";
  t().opts.forEach((o,oi)=>{
    const b = document.createElement('button');
    b.className = "opt" + (currentAnswers()[idx]===oi ? " sel":"");
    b.innerHTML = `<span class="dot"></span><span>${esc(o)}</span>`;
    b.onclick = ()=>{ currentAnswers()[idx]=oi; renderQ(); };
    opts.appendChild(b);
  });
  const last = globalIndex() === TOTAL_Q-1;
  const nb = document.getElementById('nextBtn');
  nb.textContent = last ? t().finish : t().next;
  nb.disabled = currentAnswers()[idx]===null;
  document.getElementById('backBtn').style.visibility = (phase==="core" && idx===0) ? "hidden":"visible";
  document.getElementById('quizNote').textContent = t().quizNote;
}

function nextQ(){
  const qs = currentList();
  if(currentAnswers()[idx]===null) return;
  if(idx < qs.length-1){ idx++; renderQ(); return; }
  if(phase==="core"){ routeToSet(); }
  else { startTask(); }
}
function prevQ(){
  if(idx>0){ idx--; renderQ(); return; }
  if(phase==="set"){ phase="core"; idx=CORE.length-1; renderQ(); }
}

/* ---------- SCORING (Always=3 … Never=0; option index 0..3) ---------- */
function scoreOf(optIndex){ return 3 - optIndex; }
function coreAreaScores(){
  const s = {A:0,B:0,C:0,D:0};
  CORE.forEach((q,i)=>{ if(q.area!=="X" && coreAnswers[i]!==null) s[q.area] += scoreOf(coreAnswers[i]); });
  return s;
}
function ruleRoute(){
  const s = coreAreaScores();
  // tie-break order: reading > writing > maths > attention (prevalence)
  return ["A","B","C","D"].reduce((best,k)=> s[k] > s[best] ? k : best, "A");
}

/* ---------- ROUTING (AI with rule-based fallback) ---------- */
function coreSummaryForAI(){
  return CORE.map((q,i)=>`${i+1}. [signal: ${q.area==="A"?"reading":q.area==="B"?"writing":q.area==="C"?"maths":q.area==="D"?"attention":"general"}] "${q.en}" → ${UI.en.opts[coreAnswers[i]]} (score ${scoreOf(coreAnswers[i])})`).join("\n");
}

async function routeToSet(){
  show('loading');
  document.getElementById('loadText').textContent = t().routeText;
  document.getElementById('loadSub').textContent = t().routeSub;

  let chosen = ruleRoute(); // safe default
  if(aiReady()){
    try{
      const ctrl = new AbortController();
      const timer = setTimeout(()=>ctrl.abort(), 8000);
      const res = await fetch(aiUrl(),{
        method:"POST", signal:ctrl.signal,
        headers: aiHeaders(),
        body:JSON.stringify({
          model:MODEL, max_tokens:60,
          system:'You route a learning-difficulties screening. Based on 6 parent answers, pick which question set the parent should get next: "A" (reading difficulties), "B" (writing difficulties), "C" (maths difficulties), "D" (attention difficulties). Weigh the area-specific signals most; general signals (memory, teacher concern) support the strongest area. Reply with ONLY JSON: {"set":"A"}',
          messages:[{role:"user", content:`Child age: ${childAge}. Parent answers:\n${coreSummaryForAI()}\nWhich set?`}]
        })
      });
      clearTimeout(timer);
      if(res.ok){
        const data = await res.json();
        let txt = (data.content && data.content[0] && data.content[0].text || "").replace(/```json/gi,"").replace(/```/g,"").trim();
        const parsed = JSON.parse(txt);
        if(["A","B","C","D"].includes(parsed.set)) chosen = parsed.set;
      }
    }catch(e){ /* fall back to rule-based route silently */ }
  }
  routedSet = chosen;
  phase = "set"; idx = 0;
  setAnswers = new Array(SETS[chosen].length).fill(null);
  show('quiz');
  renderQ();
}

function pick(p){ return Array.isArray(p) ? p[Math.floor(Math.random()*p.length)] : p; }
function rnd(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function genMaths(band){
  const items = [];
  for(let i=0;i<2;i++){
    let x = rnd(band?7:3, band?14:8), y;
    do{ y = rnd(band?7:3, band?14:8); }while(Math.abs(x-y) < 2);
    items.push({t:"dots", a:x, b:y});
  }
  function sum(q, ans){
    const opts = [ans];
    while(opts.length < 3){
      const d = ans + (Math.random()<0.5?-1:1) * rnd(1,3);
      if(d >= 0 && !opts.includes(d)) opts.push(d);
    }
    for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
    items.push({t:"sum", q:q, opts:opts, ans:ans});
  }
  if(band===0){
    let a1=rnd(1,4), b1=rnd(1,5);            sum(a1+" + "+b1, a1+b1);
    let a2=rnd(4,9), b2=rnd(1,3);            sum(a2+" \u2212 "+b2, a2-b2);
    let a3=rnd(2,5), b3=rnd(2,5);            sum(a3+" + "+b3, a3+b3);
  }else{
    let a1=rnd(6,9), b1=rnd(5,9);            sum(a1+" + "+b1, a1+b1);
    let a2=rnd(12,20), b2=rnd(3,9);          sum(a2+" \u2212 "+b2, a2-b2);
    let a3=rnd(2,6), b3=rnd(3,6);            sum(a3+" \u00d7 "+b3, a3*b3);
  }
  return items;
}

/* ---------- INTERACTIVE TASK ENGINE ---------- */
function startTask(){
  taskData = null; taskImage = null;
  document.getElementById('taskPill').textContent = tt().pill;
  const b = document.getElementById('taskBody');
  if(routedSet==="A") renderTaskA(b);
  else if(routedSet==="B") renderTaskB(b);
  else if(routedSet==="C") renderTaskC(b);
  else renderTaskD(b);
  show('task');
}
function skipBtn(){ return `<button class="btn ghost" style="flex:1" onclick="finishTask({skipped:true})">${esc(tt().skip)}</button>`; }
function finishTask(data){ taskData = data; submit(); }

/* Task A — timed read-aloud with SPEECH RECOGNITION (dyslexia: fluency & accuracy).
   The phone listens while the child reads and compares against the passage.
   If the mic is unavailable, falls back to asking the parent. */
function renderTaskA(b){
  const pool = TASKCONTENT.passages[ageBand()][lang] || TASKCONTENT.passages[ageBand()].en;
  const passage = pick(pool);
  const words = passage.split(/\s+/).filter(Boolean).length;
  b.innerHTML = `<div class="taskh">${esc(tt().A_title)}</div>
    <p class="tasklead">${esc(tt().A_lead)}</p>
    <div class="passage">${esc(passage)}</div>
    <div class="bigtime" id="clock" style="display:none">0.0</div>
    <div class="navrow"><button class="btn primary" id="taskGo">${esc(tt().A_start)}</button></div>
    <div class="navrow" id="skipRow">${skipBtn()}</div>`;
  let t0=null, timer=null, rec=null, transcript="";
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function strugglesFallback(seconds){
    // Mic/recognition unavailable — continue with timing only. No parent question.
    finishTask({type:"reading", words:words, seconds:seconds,
      wcpm: Math.round(words/(seconds/60)), speechRecognized:false, note:"mic unavailable - timing only"});
  }
  document.getElementById('taskGo').onclick = function(){
    if(t0===null){
      t0 = Date.now();
      this.textContent = tt().A_done;
      const c = document.getElementById('clock');
      c.style.display = "";
      document.getElementById('skipRow').style.display = "none";
      timer = setInterval(()=>{ c.textContent = ((Date.now()-t0)/1000).toFixed(1); }, 100);
      if(SR){
        try{
          rec = new SR();
          rec.lang = ({hi:"hi-IN",en:"en-IN",bn:"bn-IN",ta:"ta-IN",te:"te-IN",mr:"mr-IN",gu:"gu-IN",kn:"kn-IN",ml:"ml-IN",pa:"pa-IN",ur:"ur-IN"})[lang] || "en-IN";
          rec.continuous = true;
          rec.interimResults = false;
          rec.onresult = e=>{ for(let i=e.resultIndex;i<e.results.length;i++) if(e.results[i].isFinal) transcript += " " + e.results[i][0].transcript; };
          rec.onerror = ()=>{};
          rec.start();
        }catch(e){ rec = null; }
      }
    } else {
      clearInterval(timer);
      const seconds = Math.round((Date.now()-t0)/10)/100;
      if(rec){ try{ rec.stop(); }catch(e){} }
      setTimeout(()=>{
        const clean = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean);
        const heard = clean(transcript);
        if(heard.length >= 3){
          const target = clean(passage);
          const bag = {};
          heard.forEach(w=>{ bag[w]=(bag[w]||0)+1; });
          let matched = 0;
          target.forEach(w=>{ if(bag[w]>0){ matched++; bag[w]--; } });
          finishTask({type:"reading", words:words, seconds:seconds,
            wcpm: Math.round(words/(seconds/60)),
            speechRecognized:true,
            wordsReadCorrectly: matched,
            accuracyPct: Math.round(100*matched/target.length)});
        } else {
          strugglesFallback(seconds);
        }
      }, 800);
    }
  };
}

/* Task B — handwriting photo (dysgraphia: vision-model analysis) */
function renderTaskB(b){
  loadHwModel(); // start fetching the model in the background
  const sentence = pick(TASKCONTENT.copySentence[ageBand()][lang] || TASKCONTENT.copySentence[ageBand()].en);
  b.innerHTML = `<div class="taskh">${esc(tt().B_title)}</div>
    <p class="tasklead">${esc(tt().B_lead)}</p>
    <div class="passage">${esc(sentence)}</div>
    <label class="filebtn">${esc(tt().B_upload)}<input type="file" accept="image/*" capture="environment" id="hwFile" style="display:none"></label>
    <img id="hwPrev" class="photoprev" style="display:none">
    <div class="navrow"><button class="btn primary" id="hwGo" disabled>${esc(tt().cont)}</button></div>
    <div class="navrow">${skipBtn()}</div>`;
  document.getElementById('hwFile').onchange = function(){
    const f = this.files && this.files[0];
    if(!f) return;
    const img = new Image();
    const rd = new FileReader();
    rd.onload = e=>{ img.src = e.target.result; };
    img.onload = ()=>{
      const maxW = 900, sc = Math.min(1, maxW/img.width);
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width*sc); cv.height = Math.round(img.height*sc);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      const durl = cv.toDataURL('image/jpeg',0.65);
      hwDataUrl = durl;
      taskImage = {media_type:"image/jpeg", data:durl.split(",")[1]};
      const pv = document.getElementById('hwPrev');
      pv.src = durl; pv.style.display = "";
      const go = document.getElementById('hwGo');
      go.disabled = false; go.textContent = tt().B_ready;
    };
    rd.readAsDataURL(f);
  };
  document.getElementById('hwGo').onclick = async function(){
    this.disabled = true; this.textContent = "…";
    const findings = await analyseHandwriting();   // Daksh's trained CNN (null if unavailable)
    finishTask({type:"handwriting", sentence:sentence, hasImage:!!taskImage, modelFindings:findings});
  };
}

/* Task C — timed number game (dyscalculia: RT + error pattern) */
function renderTaskC(b){
  b.innerHTML = `<div class="taskh">${esc(tt().C_title)}</div>
    <p class="tasklead">${esc(tt().C_lead)}</p>
    <div class="navrow"><button class="btn primary" id="mGo">${esc(tt().C_go)}</button></div>
    <div class="navrow">${skipBtn()}</div>`;
  document.getElementById('mGo').onclick = ()=>{
    const items = genMaths(ageBand());
    const results = [];
    let i = 0, t0 = 0;
    function next(){
      if(i >= items.length){ finishTask({type:"maths", items:results}); return; }
      const it = items[i];
      if(it.t==="dots"){
        b.innerHTML = `<div class="taskh" style="text-align:center">${esc(tt().C_which)}</div>
          <div class="dotrow">
            <div class="dotbox" id="dL">${"●".repeat(it.a)}</div>
            <div class="dotbox" id="dR">${"●".repeat(it.b)}</div>
          </div>`;
        t0 = Date.now();
        const pick = side=>{
          results.push({q:`dots ${it.a} vs ${it.b}`, correct:(side==="L")===(it.a>it.b), ms:Date.now()-t0});
          i++; next();
        };
        document.getElementById('dL').onclick = ()=>pick("L");
        document.getElementById('dR').onclick = ()=>pick("R");
      } else {
        b.innerHTML = `<div class="sumq">${esc(it.q)} = ?</div><div class="opts" id="sOpts"></div>`;
        t0 = Date.now();
        const wrap = document.getElementById('sOpts');
        it.opts.forEach(o=>{
          const bt = document.createElement('button');
          bt.className = "opt";
          bt.innerHTML = `<span class="dot"></span><span>${o}</span>`;
          bt.onclick = ()=>{
            results.push({q:it.q, given:o, correct:o===it.ans, ms:Date.now()-t0});
            i++; next();
          };
          wrap.appendChild(bt);
        });
      }
    }
    next();
  };
}

/* Task D — go/no-go tap game (attention: RT variability, wrong taps) */
function renderTaskD(b){
  b.innerHTML = `<div class="taskh">${esc(tt().D_title)}</div>
    <p class="tasklead">${esc(tt().D_lead)}</p>
    <div class="navrow"><button class="btn primary" id="gGo">${esc(tt().D_go)}</button></div>
    <div class="navrow">${skipBtn()}</div>`;
  document.getElementById('gGo').onclick = ()=>{
    b.innerHTML = `<p class="tasklead" style="text-align:center">${esc(tt().D_running)}</p>
      <div class="gamewrap"><button class="gamecircle idle" id="circle"></button></div>
      <div class="gamestat" id="gLeft"></div>`;
    const circle = document.getElementById('circle');
    const trials = 18;
    let n = 0, cur = null, shownAt = 0, tapped = false;
    const stats = {hits:0, misses:0, falseTaps:0, rts:[]};
    circle.onclick = ()=>{
      if(cur==="green" && !tapped){ tapped=true; stats.hits++; stats.rts.push(Date.now()-shownAt); circle.className="gamecircle idle"; }
      else if(cur==="red" && !tapped){ tapped=true; stats.falseTaps++; circle.className="gamecircle idle"; }
    };
    function trial(){
      if(n >= trials){
        const mean = stats.rts.length ? Math.round(stats.rts.reduce((a,v)=>a+v,0)/stats.rts.length) : null;
        const sd = stats.rts.length>1 ? Math.round(Math.sqrt(stats.rts.map(r=>(r-mean)**2).reduce((a,v)=>a+v,0)/stats.rts.length)) : null;
        finishTask({type:"attention", trials:trials, hits:stats.hits, misses:stats.misses, falseTaps:stats.falseTaps, meanRT_ms:mean, rtSD_ms:sd});
        return;
      }
      n++;
      document.getElementById('gLeft').textContent = n+" / "+trials;
      cur = Math.random() < 0.7 ? "green" : "red";
      tapped = false;
      circle.className = "gamecircle "+cur;
      shownAt = Date.now();
      setTimeout(()=>{
        if(cur==="green" && !tapped) stats.misses++;
        circle.className = "gamecircle idle";
        cur = null;
        setTimeout(trial, 350 + Math.random()*250);
      }, 850);
    }
    trial();
  };
}

/* ---------- FINAL ANALYSIS ---------- */
const SLD_OF = {A:"dyslexia (reading)", B:"dysgraphia (writing)", C:"dyscalculia (maths)", D:"attention-related difficulty (ADHD-linked)"};

const SYSTEM_PROMPT = `You are a gentle screening-analysis tool for LearningMirror, which helps parents in India notice possible signs of Specific Learning Differences (SLD) in children aged 5-10. You are NOT a doctor and you do NOT diagnose.

You receive: (1) six general observation answers, (2) eight answers from a focused question set chosen adaptively for this child, with the pattern that set screens for, (3) scores (Always=3, Often=2, Sometimes=1, Never=0; set maximum 24), and (4) an objective task result. Higher set totals mean the pattern is more strongly present. As a guide: 60%+ of maximum = clear pattern worth acting on; 40-59% = mild pattern worth watching and re-checking; below 40% = not strongly indicated.

TASK DATA (weigh together with the questionnaire; if skipped, rely on the questionnaire alone):
- reading: words, seconds, wcpm. If speechRecognized is true, the phone listened while the child read: wordsReadCorrectly and accuracyPct compare the child's speech against the passage (speech recognition is imperfect - treat accuracy below ~60% as a signal, not proof). If false, the microphone was unavailable and only timing data exists. Rough oral-reading-fluency guides: ages 5-7 ~30-60 wcpm; ages 8-10 ~60-100 wcpm. Well below range, or low accuracy, supports a reading-difficulty pattern.
- handwriting: an image of the child copying a known sentence is attached. Examine it for letter reversals/mirroring, very uneven letter size, floating above/below the line, unusual spacing, omitted letters or matras, overall legibility. Describe what you see in plain parent language. If more than about a quarter is unreadable, that strongly supports a writing-difficulty pattern. If "modelFindings" is present, it comes from a custom CNN classifier (trained on ~138,000 handwriting samples, classes Normal/Reversal/Corrected) that analysed each detected letter: use lettersAnalysed, counts and reversalPct as a second opinion alongside your own reading of the image. The model is letter-level and approximate — if it conflicts with what you clearly see, trust your own reading and say so gently.
- maths: per-item correctness and response times (ms). Many errors on dot-comparison (magnitude) items, or very slow/erratic times on simple sums for age, support a maths-difficulty pattern.
- attention: go/no-go game — hits, misses, falseTaps, mean reaction time and its variability (rtSD). Many false taps and highly variable reaction times support an attention-difficulty pattern.

HARD RULES:
- Write in plain language a parent with Class 10 education understands. No jargon, no scary words. Never say "DSM", "disorder", "diagnosis", "clinical".
- In the "finding", DO name the specific SLD once, plainly explained — e.g. "patterns often linked with dyslexia (difficulty with reading)", "dysgraphia (difficulty with writing)", "dyscalculia (difficulty with maths)". For set D say "attention difficulties (often called ADHD)". The parent deserves the real name so they can seek help — but only here at the result, never as a diagnosis.
- NEVER say "your child has" or "is diagnosed with". ALWAYS frame as "your child shows patterns that are often linked with...".
- If the set is D (attention), recommend talking to a children's doctor rather than an educational psychologist, and do not present attention difficulty as an SLD.
- Be warm and strengths-first. Always include genuine likely strengths.
- Write the ENTIRE response in the language requested in the user message (Hindi or English).
- Keep next steps practical and doable at home today, and mention gently that it helps to check again after 8-12 weeks of practising at home.

Return ONLY valid JSON, no extra text, in this exact shape:
{
  "flagged": true/false,
  "finding": "one short plain-language line naming the pattern AND the SLD, e.g. 'patterns often linked with dyslexia (difficulty with reading)'. If none, say everything looks broadly on track.",
  "meaning": "2-3 warm sentences explaining what this pattern means in everyday terms, reassuring and non-scary.",
  "strengths": ["3 short plain-language strengths the child is likely to have"],
  "steps": ["3 to 5 short, concrete things the parent can do at home today"],
  "homeAdvice": ["5 short practical tips for the help page, tailored to THIS child's specific pattern — e.g. reading tips for a reading flag, writing-strengthening for a writing flag"],
  "summary": "one warm plain-language paragraph for the parent."
}
Translate ALL of the above field values into the requested language.`;

function buildPrompt(){
  const setLines = SETS[routedSet].map((q,i)=>`${i+1}. "${q.en}" → ${UI.en.opts[setAnswers[i]]} (score ${scoreOf(setAnswers[i])})`).join("\n");
  const setTotal = setAnswers.reduce((a,v)=>a+scoreOf(v),0);
  const taskLine = taskData ? `\n\nObjective task result: ${JSON.stringify(taskData)}${taskImage ? " (handwriting image attached — analyse it)" : ""}` : "";
  return `The parent is using the website in ${langName()}. Write your entire response in ${langName()}.\n\nChild age: ${childAge} years.\n\nGeneral observation answers:\n${coreSummaryForAI()}\n\nFocused set: ${routedSet} — screens for patterns linked with ${SLD_OF[routedSet]}.\nAnswers:\n${setLines}\nSet total: ${setTotal} of 24.${taskLine}\n\nAnalyse the overall pattern and return your screening result as JSON only.`;
}

async function submit(){
  show('loading');
  document.getElementById('loadText').textContent = t().loadText;
  document.getElementById('loadSub').textContent = t().loadSub;

  if(!aiReady()){
    renderKeyPrompt();
    return;
  }
  try{
    const res = await fetch(aiUrl(),{
      method:"POST",
      headers: aiHeaders(),
      body:JSON.stringify({
        model:MODEL, max_tokens:1100,
        system:SYSTEM_PROMPT,
        messages:[{role:"user", content: taskImage
          ? [{type:"image", source:{type:"base64", media_type:taskImage.media_type, data:taskImage.data}}, {type:"text", text:buildPrompt()}]
          : buildPrompt()}]
      })
    });
    if(!res.ok){
      let detail = "HTTP "+res.status;
      try{ const eb = await res.json(); detail += ": "+((eb.error&&eb.error.message)||JSON.stringify(eb)).slice(0,200); }catch(e){}
      throw new Error(detail);
    }
    const data = await res.json();
    let txt = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : "";
    txt = txt.replace(/```json/gi,"").replace(/```/g,"").trim();
    const parsed = JSON.parse(txt);
    lastResult = parsed;
    renderResult(parsed);
    show('result');
  }catch(e){
    renderError(t().errBody + "\n\nReason: " + String(e.message||e).slice(0,250));
  }
}

function renderError(msg){
  const body = document.getElementById('resultBody');
  body.innerHTML = `<div class="result-h">${esc(t().errTitle)}</div><div class="err">${esc(msg)}</div>`;
  document.getElementById('resBtn').style.display = "none";
  const rb = document.getElementById('restartBtn');
  rb.textContent = t().tryAgain;
  rb.onclick = submit;
  show('result');
}

/* ---------- RESULT ---------- */
function renderResult(r){
  document.getElementById('resBtn').style.display = "";
  const body = document.getElementById('resultBody');
  const badgeClass = r.flagged ? "flag" : "clear";
  const badgeText = r.flagged ? t().badgeFlag : t().badgeClear;
  let html = `<span class="badge ${badgeClass}">${badgeText}</span>`;
  html += `<div class="result-h">${esc(r.finding||"")}</div>`;
  if(r.meaning) html += `<div class="sec"><h3>${esc(t().meaning)}</h3><p>${esc(r.meaning)}</p></div>`;
  if(r.strengths && r.strengths.length){
    html += `<div class="sec"><h3>${esc(t().strengths)}</h3><ul class="clean strength">`;
    r.strengths.forEach(s=> html += `<li><span class="n">★</span><span>${esc(s)}</span></li>`);
    html += `</ul></div>`;
  }
  if(r.steps && r.steps.length){
    html += `<div class="sec"><h3>${esc(t().steps)}</h3><ul class="clean">`;
    r.steps.forEach((s,i)=> html += `<li><span class="n">${i+1}</span><span>${esc(s)}</span></li>`);
    html += `</ul></div>`;
  }
  if(r.summary) html += `<div class="sec"><h3>${esc(t().summary)}</h3><p>${esc(r.summary)}</p></div>`;
  const disc = t().disc;
  html += `<div class="disc">${disc}</div>`;
  body.innerHTML = html;
  document.getElementById('resBtn').textContent = t().seeResources;
  const rb2 = document.getElementById('restartBtn');
  rb2.textContent = t().restart;
  rb2.onclick = restart;
}

/* ---------- RESOURCES ---------- */
function goResources(){ renderResources(); show('resources'); }
function renderResources(){
  const R = RESOURCES[lang] || RESOURCES.en;
  document.getElementById('resTitle').textContent = t().resTitle;
  document.getElementById('resLead').textContent = t().resLead;
  document.getElementById('resBack').textContent = t().resBack;
  let html = "";
  const tips = (lastResult && lastResult.homeAdvice && lastResult.homeAdvice.length) ? lastResult.homeAdvice : t().advice;
  html += `<div class="advice"><h3>${esc(t().adviceTitle)}</h3><ul class="clean">`;
  tips.forEach(a=> html += `<li><span class="n">✓</span><span>${esc(a)}</span></li>`);
  html += `</ul></div>`;
  html += `<div class="ressub">${esc(t().helplinesTitle)}</div>`;
  R.helplines.forEach(r=>{
    html += `<div class="res-item"><div class="rt">${esc(r.t)}</div><div class="rs">${esc(r.s)}</div>`+
            `<a class="callbtn" href="tel:${r.tel}">📞 ${esc(t().callLabel)} ${esc(r.disp)}</a></div>`;
  });
  html += `<div class="ressub">${esc(t().placesTitle)}</div>`;
  R.places.forEach(r=>{
    html += `<div class="res-item"><div class="rt">${esc(r.t)}</div><div class="rs">${esc(r.s)}</div></div>`;
  });
  document.getElementById('resList').innerHTML = html;
}

/* ---------- RESTART ---------- */
function restart(){
  childAge=null; phase="core"; routedSet=null; idx=0;
  coreAnswers=new Array(CORE.length).fill(null); setAnswers=[]; lastResult=null;
  taskData=null; taskImage=null;
  renderHome();
  show('home');
}

/* ---------- INIT ---------- */
renderLangSel();
document.getElementById('langSel').onchange = e => setLang(e.target.value);
renderHome();
document.getElementById('brandSub').textContent = t().brandSub;
document.getElementById('footMini').textContent = t().foot;
