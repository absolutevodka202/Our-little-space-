const SUPABASE_URL="https://rhjfdxrbzoavnghiccxl.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_i11o-INoXb3yxznsiovCPA_RxpCQOhr";
const PASSCODES={KRUTIKA:"victor2105",VICTOR:"krutika2701"};
let currentRole=null;
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const date=d=>new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{currentRole=b.dataset.role;$("passwordBox").classList.remove("hidden");$("passwordLabel").textContent=currentRole+" password";$("passwordInput").focus()});
$("unlockBtn").onclick=()=>{if($("passwordInput").value===PASSCODES[currentRole]){$("gate").classList.add("hidden");$("app").classList.remove("hidden");loadAll()}else $("loginError").textContent="Wrong password ♡"};
$("passwordInput").onkeydown=e=>{if(e.key==="Enter")$("unlockBtn").click()};
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>show(b.dataset.section));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
function show(id){document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.section===id))}

const typeMap={letterForm:"letter",diaryForm:"diary",memoryForm:"memory",voiceForm:"voice",littleForm:"little"};
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openForm(typeMap[b.dataset.open]));
function openForm(type){
 const names={letter:"New Letter",diary:"New Diary Entry",memory:"Add Memory",voice:"New Voice Note",little:"Things That Remind Me of You"};
 const dateField=type==="diary"||type==="little"?`<label>Date<input id="f_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label>`:"";
 const file=type==="memory"?`<label>Photo<input id="f_file" type="file" accept="image/*"></label>`:type==="voice"?`<label>Voice note<input id="f_file" type="file" accept="audio/*"></label>`:"";
 $("formMount").innerHTML=`<form class="form" id="entryForm"><h2>${names[type]} ♡</h2><label>Title<input id="f_title" required placeholder="${type==="little"?"e.g. Your laugh, chai, that song…":"Title"}"></label>${dateField}<label>${type==="little"?"Caption / note":"Message"}<textarea id="f_content" required placeholder="Write here…"></textarea>${file}<button class="primary">Save ♡</button><p id="status" class="meta"></p></form>`;
 $("modal").classList.remove("hidden");
 $("entryForm").onsubmit=async e=>{e.preventDefault();await save(type)};
}
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")};

async function save(type){
 $("status").textContent="Saving…";
 let media_url=null; const f=$("f_file")?.files?.[0];
 if(f){
   const path=`${type}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const up=await sb.storage.from("our-little-space").upload(path,f);
   if(up.error){$("status").textContent=up.error.message;return}
   media_url=sb.storage.from("our-little-space").getPublicUrl(path).data.publicUrl;
 }
 const created=$("f_date")?.value?new Date($("f_date").value+"T12:00:00").toISOString():new Date().toISOString();
 const {error}=await sb.from("entries").insert({type,title:$("f_title").value.trim(),content:$("f_content").value.trim(),media_url,author:currentRole,created_at:created});
 if(error){$("status").textContent=error.message;return}
 $("modal").classList.add("hidden");loadAll();
}
async function loadAll(){
 const {data,error}=await sb.from("entries").select("*").order("created_at",{ascending:false});
 if(error){console.error(error);return}
 render(data||[]);
}
function replies(r){return `<div class="replies"><div id="r-${r.id}" class="meta">Loading replies…</div><div style="display:flex;gap:8px;margin-top:10px"><input id="i-${r.id}" placeholder="Write a reply…"><button class="primary" onclick="reply('${r.id}')">Reply</button></div></div>`}
async function getReplies(id){
 const {data}=await sb.from("replies").select("*").eq("entry_id",id).order("created_at");
 const el=$("r-"+id);if(el)el.innerHTML=(data||[]).map(x=>`<div class="meta"><b>${esc(x.author)}</b> · ${date(x.created_at)}<br>${esc(x.content)}</div>`).join("")||"No replies yet. ♡";
}
async function reply(id){
 const i=$("i-"+id),v=i.value.trim();if(!v)return;
 const {error}=await sb.from("replies").insert({entry_id:id,content:v,author:currentRole});
 if(error){alert(error.message);return}i.value="";getReplies(id);
}
window.reply=reply;

function render(rows){
 const g={letter:[],diary:[],memory:[],voice:[],little:[]};rows.forEach(r=>{if(g[r.type])g[r.type].push(r)});
 $("lettersList").innerHTML=g.letter.map(r=>`<details class="paper collapsible-entry ${String(r.author).toUpperCase()==="KRUTIKA"?"author-krutika":"author-victor"}"><summary><h3>${esc(r.title)}</h3><div class="meta">${esc(r.author)} · ${date(r.created_at)}</div><span class="open-hint">Click to open ♡</span></summary><div class="entry-body"><div class="content">${esc(r.content)}</div>${replies(r)}</div></details>`).join("")||empty("No letters yet. ♡");
 $("diaryList").innerHTML=g.diary.map(r=>`<details class="diary-entry collapsible-entry ${String(r.author).toUpperCase()==="KRUTIKA"?"author-krutika":"author-victor"}"><summary><h3>${esc(r.title)}</h3><div class="meta">${date(r.created_at)} · ${esc(r.author)}</div><span class="open-hint">Click to open ♡</span></summary><div class="entry-body"><div class="content">${esc(r.content)}</div>${replies(r)}</div></details>`).join("")||empty("The first page is waiting. ♡");
  $("memoriesList").innerHTML=g.memory.map(r=>`<details class="memory-card collapsible-entry ${String(r.author).toUpperCase()==="KRUTIKA"?"author-krutika":"author-victor"}"><summary><h3>${esc(r.title)}</h3><div class="meta">${date(r.created_at)} · ${esc(r.author)}</div><span class="open-hint">Click to open ♡</span></summary><div class="entry-body"><div class="memory-image">${r.media_url?`<img src="${esc(r.media_url)}">`:"♡"}</div><div class="content">${esc(r.content)}</div>${replies(r)}</div></details>`).join("")||empty("No memories yet. ♡");
  $("voiceList").innerHTML=g.voice.map(r=>`<details class="voice-card collapsible-entry ${String(r.author).toUpperCase()==="KRUTIKA"?"author-krutika":"author-victor"}"><summary><h3>${esc(r.title)}</h3><div class="meta">${date(r.created_at)} · ${esc(r.author)}</div><span class="open-hint">Click to open ♡</span></summary><div class="entry-body">${r.media_url?`<audio controls src="${esc(r.media_url)}"></audio>`:""}<div class="content">${esc(r.content)}</div>${replies(r)}</div></details>`).join("")||empty("No voice notes yet. ♡");
  $("littleList").innerHTML=g.little.map(r=>`<details class="little-card collapsible-entry ${String(r.author).toUpperCase()==="KRUTIKA"?"author-krutika":"author-victor"}"><summary><h3>☆ ${esc(r.title)}</h3><div class="meta">${date(r.created_at)} · ${esc(r.author)}</div><span class="open-hint">Click to open ♡</span></summary><div class="entry-body"><div class="content">${esc(r.content)}</div>${replies(r)}</div></details>`).join("")||empty("Add a little thing that reminds you of them. ♡");
 rows.forEach(r=>getReplies(r.id));
}
function empty(x){return `<div class="empty">${x}</div>`}
