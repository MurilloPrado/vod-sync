const PLATFORMS = ["YouTube", "Twitch", "Kick", "Outro"];
const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10);

let state = { projects: {}, activeId: null, showSeconds: false };

/* ---------- Tempo (horas e minutos; segundos opcionais) ---------- */
// Um tempo é { h: "3", m: "48", s: "" } (textos digitados nos campos).
const emptyTime = () => ({ h: "", m: "", s: "" });

// Retorna segundos totais, null (vazio) ou NaN (inválido).
// Com o switch de segundos desligado, o campo "s" é ignorado (vale 0).
function toSeconds(t) {
  const useSec = state.showSeconds;
  const h = (t.h || "").trim();
  const m = (t.m || "").trim();
  const sec = useSec ? (t.s || "").trim() : "";
  if (!h && !m && !sec) return null;
  if ((h && !/^\d+$/.test(h)) || (m && !/^\d+$/.test(m)) || (sec && !/^\d+$/.test(sec))) return NaN;
  const mm = parseInt(m || "0", 10);
  const ss = parseInt(sec || "0", 10);
  if (mm > 59 || ss > 59) return NaN;
  return parseInt(h || "0", 10) * 3600 + mm * 60 + ss;
}
function fmtTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x) => String(x).padStart(2, "0");
  let out = `${h} h ${pad(m)} min`;
  if (state.showSeconds) out += ` ${pad(s)} s`;
  return out;
}

// Campo com caixas: [ horas ] h [ minutos ] min  (+ [ segundos ] s se ativado)
function makeTimeInput(container, time, onChange) {
  container.innerHTML = "";
  container.classList.add("time-input");

  const mk = (key, max, ph, unit, title) => {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = max;
    input.placeholder = ph;
    input.title = title;
    input.value = time[key] || "";
    input.oninput = () => {
      time[key] = input.value;
      const bad = Number.isNaN(toSeconds(time));
      container.querySelectorAll("input").forEach((i) => i.classList.toggle("invalid", bad));
      onChange();
    };
    const label = document.createElement("span");
    label.className = "unit";
    label.textContent = unit;
    container.append(input, label);
  };
  mk("h", 3, "0", "h", "Horas");
  mk("m", 2, "00", "min", "Minutos");
  if (state.showSeconds) mk("s", 2, "00", "s", "Segundos");
}

/* ---------- Persistência ---------- */
const store = chrome.storage.local;
function save() { store.set({ state }); }

// Converte dados antigos ("h:mm:ss") para { h, m, s }
function migrateTime(v) {
  if (v && typeof v === "object") return { h: v.h ?? "", m: v.m ?? "", s: v.s ?? "" };
  const parts = String(v || "").trim().split(":");
  if (parts.length === 3) return { h: parts[0], m: parts[1], s: parts[2] };
  if (parts.length === 2) return { h: "0", m: parts[0], s: parts[1] };
  return emptyTime();
}
function migrate() {
  Object.values(state.projects).forEach((p) => {
    p.sources.forEach((s) => (s.start = migrateTime(s.start)));
    p.current.time = migrateTime(p.current.time);
  });
}

function newProject() {
  const id = uid();
  state.projects[id] = {
    id, title: "",
    sources: [
      { id: uid(), platform: "YouTube", name: "", start: emptyTime() },
      { id: uid(), platform: "Twitch", name: "", start: emptyTime() },
    ],
    current: { sourceId: null, time: emptyTime() },
  };
  state.activeId = id;
}
const active = () => state.projects[state.activeId];

function sourceLabel(src) {
  return src.name ? `${src.platform} — ${src.name}` : src.platform;
}

/* ---------- Renderização ---------- */
function renderProjectSelect() {
  const sel = $("projectSelect");
  sel.innerHTML = "";
  Object.values(state.projects).forEach((p) => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.title || "(sem título)";
    sel.appendChild(o);
  });
  sel.value = state.activeId;
}

function renderSources() {
  const p = active();
  const box = $("sources");
  box.innerHTML = "";
  p.sources.forEach((src) => {
    const row = document.createElement("div");
    row.className = "row";

    const plat = document.createElement("select");
    PLATFORMS.forEach((n) => {
      const o = document.createElement("option");
      o.value = o.textContent = n;
      plat.appendChild(o);
    });
    plat.value = src.platform;
    plat.onchange = () => { src.platform = plat.value; save(); refreshDerived(); };

    const name = document.createElement("input");
    name.className = "name";
    name.placeholder = "Título (opcional)";
    name.value = src.name;
    name.oninput = () => { src.name = name.value; save(); refreshDerived(); };

    const start = document.createElement("div");
    makeTimeInput(start, src.start, () => { save(); renderResults(); });

    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "✕";
    del.title = "Remover origem";
    del.onclick = () => {
      p.sources = p.sources.filter((s) => s.id !== src.id);
      if (p.current.sourceId === src.id) p.current.sourceId = null;
      save(); renderSources(); refreshDerived();
    };

    row.append(plat, name, start, del);
    box.appendChild(row);
  });
}

function renderCurrentSelect() {
  const p = active();
  const sel = $("curSource");
  sel.innerHTML = "";
  p.sources.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = sourceLabel(s);
    sel.appendChild(o);
  });
  if (!p.sources.some((s) => s.id === p.current.sourceId)) {
    p.current.sourceId = p.sources[0]?.id ?? null;
  }
  sel.value = p.current.sourceId ?? "";
}

function renderResults() {
  const p = active();
  const box = $("results");
  box.innerHTML = "";

  const cur = p.sources.find((s) => s.id === p.current.sourceId);
  const t = toSeconds(p.current.time);
  const startCur = cur ? toSeconds(cur.start) : null;

  if (!cur || t === null || Number.isNaN(t) || startCur === null || Number.isNaN(startCur)) {
    box.innerHTML = '<div class="empty">Preencha o início da origem atual e a minutagem atual.</div>';
    return;
  }

  // Posição no "tempo do conteúdo" = minutagem atual - início da origem atual
  const content = t - startCur;
  const others = p.sources.filter((s) => s.id !== cur.id);
  if (!others.length) {
    box.innerHTML = '<div class="empty">Adicione outra origem para ver a conversão.</div>';
    return;
  }

  others.forEach((s) => {
    const st = toSeconds(s.start);
    const row = document.createElement("div");
    row.className = "result";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = sourceLabel(s);

    const value = document.createElement("div");
    value.className = "value";

    if (st === null || Number.isNaN(st)) {
      value.textContent = "sem início";
      value.classList.add("warn");
    } else {
      const target = st + content;
      if (target < 0) {
        value.textContent = "antes do início deste vídeo";
        value.classList.add("warn");
      } else {
        value.textContent = fmtTime(target);
      }
    }

    row.append(label, value);

    if (!value.classList.contains("warn")) {
      const copy = document.createElement("button");
      copy.textContent = "Copiar";
      copy.onclick = async () => {
        await navigator.clipboard.writeText(value.textContent);
        copy.textContent = "✓";
        setTimeout(() => (copy.textContent = "Copiar"), 900);
      };
      row.appendChild(copy);
    }
    box.appendChild(row);
  });
}

// Atualiza partes que dependem dos dados, sem recriar os inputs (mantém o foco)
function refreshDerived() {
  const keep = active().current.sourceId;
  renderCurrentSelect();
  $("curSource").value = keep ?? "";
  renderResults();
}

function renderAll() {
  const p = active();
  $("showSeconds").checked = !!state.showSeconds;
  renderProjectSelect();
  $("title").value = p.title;
  renderSources();
  renderCurrentSelect();
  makeTimeInput($("curTime"), p.current.time, () => { save(); renderResults(); });
  renderResults();
}

/* ---------- Eventos ---------- */
$("showSeconds").onchange = (e) => { state.showSeconds = e.target.checked; save(); renderAll(); };

$("title").oninput = (e) => { active().title = e.target.value; save(); renderProjectSelect(); };

$("projectSelect").onchange = (e) => { state.activeId = e.target.value; save(); renderAll(); };

$("newProject").onclick = () => { newProject(); save(); renderAll(); $("title").focus(); };

$("deleteProject").onclick = () => {
  const p = active();
  if (!confirm(`Excluir "${p.title || "(sem título)"}"?`)) return;
  delete state.projects[p.id];
  const ids = Object.keys(state.projects);
  if (ids.length) state.activeId = ids[0]; else newProject();
  save(); renderAll();
};

$("addSource").onclick = () => {
  active().sources.push({ id: uid(), platform: "Kick", name: "", start: emptyTime() });
  save(); renderSources(); refreshDerived();
};

$("curSource").onchange = (e) => { active().current.sourceId = e.target.value; save(); renderResults(); };

/* ---------- Início ---------- */
store.get("state").then((data) => {
  if (data.state && Object.keys(data.state.projects || {}).length) {
    state = data.state;
    state.showSeconds = !!state.showSeconds;
    migrate();
    if (!state.projects[state.activeId]) state.activeId = Object.keys(state.projects)[0];
  } else {
    newProject();
  }
  renderAll();
});
