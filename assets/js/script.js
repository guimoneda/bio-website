/* script.js — dynamic rendering, localStorage, editing, import/export, theme */
/* Gradient Tech BIO — Vanilla JS, no frameworks. */

const DATA_URL = 'data/site.json'; // primary data source
const LOCAL_KEY = 'gm_bio_profile_v1';

let profile = null;

/* ---------- Utility ---------- */
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
function saveLocal(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(profile)); }
function loadLocal(){ try{ const raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; }catch(e){return null;} }
function download(filename, content){ const blob = new Blob([content], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

/* ---------- Bootstrap ---------- */
async function init(){
// Try load local override first
const local = loadLocal();
if(local){ profile = local; renderAll(); return; }

// Otherwise fetch data JSON
try{
const res = await fetch(DATA_URL);
if(!res.ok) throw new Error('fetch failed');
profile = await res.json();
}catch(err){
// fallback to an embedded default (keeps site working on file:// or broken hosts)
profile = {
name: "Guilherme Moneda",
role: "Technical Program Manager | Agile Coach",
headline: "I help organizations deliver resilient B2B platforms and scale engineering capabilities.",
summary: "I combine technical delivery experience, agile coaching, and program leadership to turn complex roadmaps into measurable business outcomes.",
stats: { engineers: "35+", countries: "19+", golives: 4 },
contact: { email: "[contact@guimoneda.com](mailto:contact@guimoneda.com)", linkedin: "[https://www.linkedin.com/in/guilherme-moneda-b6ba9263](https://www.linkedin.com/in/guilherme-moneda-b6ba9263)", resume: "/mnt/data/Profile.pdf" },
skills: ["Program Management","Agile / Scrum","CI/CD & DevOps","Test Automation","GCP","OKRs & Metrics"],
projects: [
{ title:"Cloud Platform Team Scaling", text:"Led a 35+ cross-functional org to evolve cloud & infra platform enabling B2B operations.", outcome:"Improved reliability and readiness for B2B growth."},
{ title:"BEES — Global Stabilization & Go-lives", text:"Supported QA and automation for product used in 19+ countries.", outcome:"Four successful country go-lives."}
],
experience: [
{ company:"Avenue Code", title:"Principal Project Manager", period:"Dec 2022 – Dec 2023", location:"São Paulo (remote)", outcome:"Managed enterprise delivery streams and aligned program scope."},
{ company:"CI&T", title:"Technical Project Manager | Agile Coach", period:"Aug 2021 – Dec 2022", location:"São Paulo, Brazil", outcome:"Built teams and implemented OKRs & delivery metrics."}
]
};
}
renderAll();
}

/* ---------- Render ---------- */
function renderAll(){
if(!profile) return;
$('#name').textContent = profile.name || '';
$('#role').textContent = profile.role || '';
$('#headline').textContent = profile.headline || '';
$('#summary').textContent = profile.summary || '';
$('#statEngineers').textContent = profile.stats?.engineers || '';
$('#statCountries').textContent = profile.stats?.countries || '';
$('#statGoLive').textContent = profile.stats?.golives || '';
$('#emailLink').href = `mailto:${profile.contact?.email || 'contact@guimoneda.com'}`;
$('#emailContact').href = `mailto:${profile.contact?.email || 'contact@guimoneda.com'}`;
$('#emailLink').textContent = profile.contact?.email || '[contact@guimoneda.com](mailto:contact@guimoneda.com)';
$('#linkedinLink').href = profile.contact?.linkedin || '#';
$('#resumeLink').href = profile.contact?.resume || '/mnt/data/Profile.pdf';

renderList('#projectsList', profile.projects, renderProjectItem, 'projects');
renderList('#experienceList', profile.experience, renderExperienceItem, 'experience');
}

/* generic list renderer */
function renderList(rootSel, items, renderFn, key){
const root = $(rootSel);
root.innerHTML = '';
items.forEach((it, idx) => {
const node = renderFn(it, idx, key);
root.appendChild(node);
});
}

/* project item DOM */
function renderProjectItem(p, i){
const el = document.createElement('div');
el.className = 'project';
el.innerHTML = `     <div class="row">       <div style="flex:1">         <h4 contenteditable="false" data-key="projects" data-index="${i}" data-field="title">${escapeHtml(p.title)}</h4>         <p contenteditable="false" data-key="projects" data-index="${i}" data-field="text">${escapeHtml(p.text)}</p>         <p class="muted"><strong>Outcome:</strong> <span contenteditable="false" data-key="projects" data-index="${i}" data-field="outcome">${escapeHtml(p.outcome)}</span></p>       </div>       <div style="display:flex;flex-direction:column;gap:6px;margin-left:8px">         <button class="btn" data-action="edit" data-key="projects" data-index="${i}">Edit</button>         <button class="btn ghost" data-action="remove" data-key="projects" data-index="${i}">Remove</button>       </div>     </div>
  `;
attachItemHandlers(el);
return el;
}

/* experience item DOM */
function renderExperienceItem(e, i){
const el = document.createElement('div');
el.className = 'project';
el.innerHTML = `     <div class="row">       <div style="flex:1">         <h4 contenteditable="false" data-key="experience" data-index="${i}" data-field="company">${escapeHtml(e.company || '')} — ${escapeHtml(e.title || '')}</h4>         <p class="muted" contenteditable="false" data-key="experience" data-index="${i}" data-field="period">${escapeHtml(e.period || '')} · ${escapeHtml(e.location || '')}</p>         <p class="muted"><strong>Outcome:</strong> <span contenteditable="false" data-key="experience" data-index="${i}" data-field="outcome">${escapeHtml(e.outcome || '')}</span></p>       </div>       <div style="display:flex;flex-direction:column;gap:6px;margin-left:8px">         <button class="btn" data-action="edit" data-key="experience" data-index="${i}">Edit</button>         <button class="btn ghost" data-action="remove" data-key="experience" data-index="${i}">Remove</button>       </div>     </div>
  `;
attachItemHandlers(el);
return el;
}

/* attach handlers for edit/remove */
function attachItemHandlers(el){
el.querySelectorAll('button').forEach(btn=>{
btn.addEventListener('click', (ev)=>{
const action = btn.dataset.action;
const key = btn.dataset.key;
const idx = Number(btn.dataset.index);
if(action === 'remove'){ profile[key].splice(idx,1); saveLocal(); renderAll(); return; }
if(action === 'edit'){ openInlineEditor(key, idx); return; }
});
});
}

/* ---------- Inline editor (modal) ---------- */
function openInlineEditor(key, idx){
const item = profile[key][idx];
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `     <div class="modal-card card">       <h3>Edit ${key} — item #${idx+1}</h3>       <div id="modalForm"></div>       <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">         <button class="btn" id="modalSave">Save</button>         <button class="btn ghost" id="modalCancel">Cancel</button>       </div>     </div>
  `;
document.body.appendChild(modal);

const formRoot = $('#modalForm');
formRoot.innerHTML = '';

// build inputs based on keys present
Object.keys(item).forEach(k=>{
const row = document.createElement('div');
row.className = 'form-row';
row.innerHTML = `<label style="font-weight:600">${k}</label><input id="fld_${k}" value="${escapeHtml(item[k] || '')}" />`;
formRoot.appendChild(row);
});

$('#modalSave').addEventListener('click', ()=>{
Object.keys(item).forEach(k=>{
const v = $(`#fld_${k}`).value;
profile[key][idx][k] = v;
});
saveLocal();
document.body.removeChild(modal);
renderAll();
});
$('#modalCancel').addEventListener('click', ()=> document.body.removeChild(modal));
}

/* ---------- Controls wiring ---------- */
function wireControls(){
$('#addProject').addEventListener('click', ()=>{
profile.projects.unshift({ title:"New Project", text:"Describe project", outcome:"Outcome" });
saveLocal(); renderAll();
});
$('#clearProjects').addEventListener('click', ()=> { if(confirm('Clear all projects?')){ profile.projects=[]; saveLocal(); renderAll(); } });

$('#addExperience').addEventListener('click', ()=>{
profile.experience.unshift({ company:"New Company", title:"New Title", period:"Year–Year", location:"Location", outcome:"Outcome" });
saveLocal(); renderAll();
});
$('#clearExp').addEventListener('click', ()=> { if(confirm('Clear experience?')){ profile.experience=[]; saveLocal(); renderAll(); } });

$('#downloadJSON').addEventListener('click', ()=> download('site-profile.json', JSON.stringify(profile, null, 2)));
$('#exportBtn').addEventListener('click', ()=> download('site-profile.json', JSON.stringify(profile, null, 2)));

$('#importBtn').addEventListener('click', ()=> { $('#importFile').click(); });
$('#importFile').addEventListener('change', (ev)=>{
const f = ev.target.files[0];
if(!f) return;
const reader = new FileReader();
reader.onload = () => {
try{
const parsed = JSON.parse(reader.result);
profile = parsed; saveLocal(); renderAll(); alert('Imported JSON success');
}catch(e){ alert('Invalid JSON'); }
};
reader.readAsText(f);
});

// quick edit save
$('#saveQuick').addEventListener('click', ()=>{
profile.name = $('#editName').value;
profile.headline = $('#editHeadline').value;
profile.summary = $('#editSummary').value;
saveLocal();
renderAll();
alert('Saved');
});

$('#resetBtn').addEventListener('click', ()=>{
if(confirm('Restore defaults from data/site.json? This will overwrite local changes.')){
localStorage.removeItem(LOCAL_KEY);
init();
}
});

$('#themeToggle').addEventListener('click', ()=>{
const b = document.body;
b.dataset.theme = b.dataset.theme === 'dark' ? 'light' : 'dark';
});
}

/* ---------- Helper escape ---------- */
function escapeHtml(str=''){ return String(str).replaceAll('&','&').replaceAll('<','<').replaceAll('>','>'); }

/* ---------- Init + wire ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{
await init();
wireControls();

// populate quick edit placeholders
$('#editName').value = profile.name || '';
$('#editHeadline').value = profile.headline || '';
$('#editSummary').value = profile.summary || '';
});

--- End of script.js
