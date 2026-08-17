/*
  OUR LITTLE SPACE
  Put your Supabase project URL and anon key below.
  Find them in Supabase: Project Settings -> API.
*/
const SUPABASE_URL = "https://rhjfdxrbzoavnghiccxl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i11o-INoXb3yxznsiovCPA_RxpCQOhr";

/* These are the two simple site passcodes.
   Change them before publishing. This is a front-end gate, not true authentication. */
const PASSCODES = {
  KRUTIKA: "victor2105",
  VICTOR: "krutika2701"
};

const BUCKET = "our-little-space";
let sb = null;
if (SUPABASE_URL.startsWith("http") && !SUPABASE_ANON_KEY.startsWith("PASTE_")) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentRole = null;

const $ = id => document.getElementById(id);
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = d => new Date(d).toLocaleString([], {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

document.querySelectorAll("[data-role]").forEach(btn => btn.onclick = () => {
  currentRole = btn.dataset.role;
  $("passwordBox").classList.remove("hidden");
  $("passwordLabel").textContent = `${currentRole} password`;
  $("passwordInput").focus();
});
$("unlockBtn").onclick = () => {
  if ($("passwordInput").value === PASSCODES[currentRole]) {
    $("gate").classList.add("hidden");
    $("app").classList.remove("hidden");
    loadAll();
  } else $("loginError").textContent = "That password doesn't match this key. ♡";
};
$("passwordInput").addEventListener("keydown", e => { if(e.key === "Enter") $("unlockBtn").click(); });

function showSection(id) {
  document.querySelectorAll(".section").forEach(x => x.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x.dataset.section === id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav").forEach(x => x.onclick = () => showSection(x.dataset.section));
document.querySelectorAll("[data-go]").forEach(x => x.onclick = () => showSection(x.dataset.go));

function openForm(type) {
  const titles = {letter:"New Letter", diary:"New Diary Entry", memory:"Add Memory", voice:"New Voice Note", little:"Add Little Thing"};
  let extra = "";
  if(type === "memory") extra = `<label>Photo <input id="f_file" type="file" accept="image/*"></label>`;
  if(type === "voice") extra = `<label>Audio <input id="f_file" type="file" accept="audio/*"></label>`;
  $("formMount").innerHTML = `<form class="form" id="entryForm">
    <h2>${titles[type]} ♡</h2>
    <input id="f_title" placeholder="${type==="diary"?"Title":"Title"}" required>
    ${type==="diary"?`<input id="f_date" type="date" value="${new Date().toISOString().slice(0,10)}">`:""}
    <textarea id="f_content" placeholder="${type==="memory"?"Caption / memory":"Write it here..."}" required></textarea>
    ${extra}
    <button>Save to our little space ♡</button>
    <p class="meta" id="formStatus"></p>
  </form>`;
  $("modal").classList.remove("hidden");
  $("entryForm").onsubmit = async e => {
    e.preventDefault();
    await saveEntry(type);
  };
}
document.querySelectorAll("[data-open]").forEach(x => x.onclick = () => openForm(x.dataset.open.replace("Form","")));

$("closeModal").onclick = () => $("modal").classList.add("hidden");
$("modal").onclick = e => { if(e.target === $("modal")) $("modal").classList.add("hidden"); };

async function saveEntry(type) {
  if(!sb) return $("formStatus").textContent = "Add your Supabase URL and anon key in app.js first.";
  const status = $("formStatus");
  status.textContent = "Saving...";
  let media_url = null;
  const file = $("f_file")?.files?.[0];

  if(file) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path = `${type}/${Date.now()}-${safe}`;
    const {error:upErr} = await sb.storage.from(BUCKET).upload(path,file);
    if(upErr) return status.textContent = upErr.message;
    const {data} = sb.storage.from(BUCKET).getPublicUrl(path);
    media_url = data.publicUrl;
  }

  const row = {
    type,
    title: $("f_title").value,
    content: $("f_content").value,
    media_url,
    author: currentRole || "KRUTIKA",
    created_at: $("f_date")?.value ? new Date($("f_date").value).toISOString() : new Date().toISOString()
  };
  const {error} = await sb.from("entries").insert(row);
  if(error) return status.textContent = error.message;
  $("modal").classList.add("hidden");
  loadAll();
}

async function loadAll() {
  if(!sb) {
    ["lettersList","diaryList","memoriesList","voiceList","littleList"].forEach(id => $(id).innerHTML = `<div class="empty">Connect Supabase in app.js to load your saved things. ♡</div>`);
    return;
  }
  const {data,error} = await sb.from("entries").select("*").order("created_at",{ascending:false});
  if(error) {
    console.error(error);
    return;
  }
  render(data || []);
}
function render(rows) {
  const groups = {letter:[],diary:[],memory:[],voice:[],little:[]};
  rows.forEach(r => { if(groups[r.type]) groups[r.type].push(r); });
  $("lettersList").innerHTML = groups.letter.length ? groups.letter.map(r=>`
    <article class="paper"><h3>${escapeHtml(r.title)}</h3><div class="meta">${escapeHtml(r.author)} · ${fmtDate(r.created_at)}</div><div class="content">${escapeHtml(r.content)}</div></article>`).join("") : `<div class="empty">No letters yet. Maybe the first one should be yours. ♡</div>`;
  $("diaryList").innerHTML = groups.diary.length ? groups.diary.map(r=>`
    <article class="diary-entry"><h3>${escapeHtml(r.title)}</h3><div class="meta">${fmtDate(r.created_at)}</div><div class="content">${escapeHtml(r.content)}</div></article>`).join("") : `<div class="empty">The first page is still waiting. ♡</div>`;
  $("memoriesList").innerHTML = groups.memory.length ? groups.memory.map(r=>`
    <article class="memory-card"><div class="memory-image">${r.media_url?`<img src="${escapeHtml(r.media_url)}" alt="">`:"♡"}</div><h3>${escapeHtml(r.title)}</h3><div class="meta">${fmtDate(r.created_at)}</div><div>${escapeHtml(r.content)}</div></article>`).join("") : `<div class="empty">No memories yet. ♡</div>`;
  $("voiceList").innerHTML = groups.voice.length ? groups.voice.map(r=>`
    <article class="voice-card"><button class="play" onclick="this.nextElementSibling.play()">▶</button><div style="flex:1"><h3>${escapeHtml(r.title)}</h3><div class="meta">${fmtDate(r.created_at)}</div>${r.media_url?`<audio controls src="${escapeHtml(r.media_url)}"></audio>`:""}</div></article>`).join("") : `<div class="empty">No voice notes yet. ♡</div>`;
  $("littleList").innerHTML = groups.little.length ? groups.little.map(r=>`
    <article class="little-card"><h3>${escapeHtml(r.title)}</h3><div class="content">${escapeHtml(r.content)}</div></article>`).join("") : `<div class="empty">Add one tiny thing you never want to forget. ♡</div>`;
}
