// ─────────────────────────────────────────────────────────────────────────────
// main.js — Explorador TMDB · Serie "Nuestro Planeta"
// La API Key NO está en el código: se pide al usuario en la pantalla de entrada
// y se guarda en localStorage. La app muestra exclusivamente datos de la serie
// "Nuestro Planeta" (TMDB ID 83880).
// ─────────────────────────────────────────────────────────────────────────────

const TMDB_BASE_URL     = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE   = "https://image.tmdb.org/t/p/w300";
const TMDB_BACKDROP_BASE= "https://image.tmdb.org/t/p/w1280";
const DEFAULT_LANGUAGE  = "es-ES";
const NUESTRO_PLANETA_TV_ID = 83880;
const LS_API_KEY        = "tmdb_api_key";
const LS_THEME          = "tmdb_theme";

// ── Referencias DOM ──────────────────────────────────────────────────────────
const apiGateEl      = document.getElementById("apiGate");
const appRootEl      = document.getElementById("appRoot");
const gateApiKeyEl   = document.getElementById("gateApiKey");
const gateEnterBtn   = document.getElementById("gateEnterBtn");
const gateErrorEl    = document.getElementById("gateError");
const gateToggleBtn  = document.getElementById("gateToggleVisible");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const logoutBtn      = document.getElementById("logoutBtn");
const messagesEl     = document.getElementById("messages");
const formContainer  = document.getElementById("formContainer");
const resultsEl      = document.getElementById("results");
const heroEl         = document.getElementById("hero");
const heroMetaEl     = document.getElementById("heroMeta");
const heroOverviewEl = document.getElementById("heroOverview");

let navButtons = document.querySelectorAll(".nav-btn");

// ── Estado ───────────────────────────────────────────────────────────────────
let TMDB_API_KEY = "";

// Caché en memoria para evitar peticiones repetidas
let tvDetailsCache  = null;
let creditsCache    = null;
let imagesCache     = null;
let videosCache     = null;
let genresListCache = null;
const peopleCache   = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function init() {
  applyTheme(localStorage.getItem(LS_THEME) || "dark");

  // Si ya hay una API Key guardada, saltar la pantalla de entrada
  const savedKey = localStorage.getItem(LS_API_KEY);
  if (savedKey) {
    TMDB_API_KEY = savedKey;
    showApp();
  } else {
    showGate();
  }

  // Listeners del gate
  gateEnterBtn.addEventListener("click", handleGateEnter);
  gateApiKeyEl.addEventListener("keydown", (e) => { if (e.key === "Enter") handleGateEnter(); });
  gateToggleBtn.addEventListener("click", () => {
    gateApiKeyEl.type = gateApiKeyEl.type === "password" ? "text" : "password";
  });

  // Listeners del app
  themeToggleBtn.addEventListener("click", toggleTheme);
  logoutBtn.addEventListener("click", handleLogout);

  document.querySelectorAll("[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => changeView(btn.dataset.view))
  );

  navButtons = document.querySelectorAll(".nav-btn");
}

// ── Gate: validar API Key ─────────────────────────────────────────────────────
async function handleGateEnter() {
  const key = gateApiKeyEl.value.trim();
  if (!key) {
    gateErrorEl.textContent = "Introduce una API Key antes de continuar.";
    gateErrorEl.hidden = false;
    return;
  }

  gateEnterBtn.disabled = true;
  gateEnterBtn.querySelector("span").textContent = "Verificando…";
  gateErrorEl.hidden = true;

  // Validamos haciendo una petición real de bajo coste
  const ok = await validateApiKey(key);

  if (ok) {
    TMDB_API_KEY = key;
    localStorage.setItem(LS_API_KEY, key);
    // Animación de salida del gate y entrada del app
    apiGateEl.classList.add("is-exiting");
    setTimeout(() => {
      apiGateEl.style.display = "none";
      showApp();
    }, 500);
  } else {
    gateErrorEl.textContent = "API Key inválida o error de conexión. Revísala e inténtalo de nuevo.";
    gateErrorEl.hidden = false;
    gateEnterBtn.disabled = false;
    gateEnterBtn.querySelector("span").textContent = "Entrar";
  }
}

async function validateApiKey(key) {
  try {
    const url = new URL(`${TMDB_BASE_URL}/genre/tv/list`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", DEFAULT_LANGUAGE);
    const res = await fetch(url.toString());
    return res.ok;
  } catch {
    return false;
  }
}

// ── Mostrar / ocultar pantallas ───────────────────────────────────────────────
function showGate() {
  apiGateEl.style.display = "";
  apiGateEl.hidden = false;
  appRootEl.hidden  = true;
}

function showApp() {
  apiGateEl.hidden = true;
  appRootEl.hidden = false;
  loadHero().catch(() => {});
  changeView("overview");
}

function handleLogout() {
  localStorage.removeItem(LS_API_KEY);
  TMDB_API_KEY = "";
  // Limpia caché para que el siguiente usuario empiece limpio
  tvDetailsCache = creditsCache = imagesCache = videosCache = genresListCache = null;
  peopleCache.clear();
  // Regresa a la pantalla de entrada
  apiGateEl.classList.remove("is-exiting");
  apiGateEl.style.display = "";
  apiGateEl.hidden = false;
  appRootEl.hidden = true;
  gateApiKeyEl.value = "";
  gateErrorEl.hidden = true;
  gateEnterBtn.disabled = false;
  gateEnterBtn.querySelector("span").textContent = "Entrar";
}

// ── Tema ──────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem(LS_THEME, theme);
}

function toggleTheme() {
  const current = document.body.classList.contains("light") ? "light" : "dark";
  applyTheme(current === "light" ? "dark" : "light");
}

// ── Navegación ────────────────────────────────────────────────────────────────
function setActiveNav(view) {
  navButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === view)
  );
}

function changeView(view) {
  setActiveNav(view);
  messagesEl.innerHTML  = "";
  formContainer.innerHTML = "";
  clearResults();

  switch (view) {
    case "overview":       renderOverviewView();      break;
    case "seasons":        renderSeasonsView();       break;
    case "gallery":        renderGalleryView();       break;
    case "videos":         renderVideosView();        break;
    case "people":         renderPeopleView();        break;
    case "more-like-this": renderMoreLikeThisView();  break;
    default:               renderOverviewView();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA API TMDB
// ─────────────────────────────────────────────────────────────────────────────
async function tmdbGet(endpoint, params = {}) {
  const url = new URL(TMDB_BASE_URL + endpoint);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", DEFAULT_LANGUAGE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(res.status === 404
        ? "Recurso no encontrado (404)."
        : `Error en la petición (${res.status}).`
      );
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    showMessage(err.message || "Error de red al llamar a la API.", "error");
    throw err;
  }
}

// ── Funciones de caché (lazy) ─────────────────────────────────────────────────
async function ensureTvDetailsAndCredits() {
  if (!tvDetailsCache || !creditsCache) {
    const [d, c] = await Promise.all([
      tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}`),
      tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}/credits`),
    ]);
    tvDetailsCache = d;
    creditsCache   = c;
  }
  return { tvDetails: tvDetailsCache, credits: creditsCache };
}

async function ensureImages() {
  if (!imagesCache) {
    imagesCache = await tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}/images`, {
      include_image_language: "es,null",
    });
  }
  return imagesCache;
}

async function ensureVideos() {
  if (!videosCache) {
    videosCache = await tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}/videos`);
  }
  return videosCache;
}

async function ensureGenresList() {
  if (!genresListCache) {
    const data = await tmdbGet("/genre/tv/list");
    genresListCache = data.genres || [];
  }
  return genresListCache;
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
async function loadHero() {
  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();

    if (tvDetails.backdrop_path) {
      heroEl.style.backgroundImage = `url(${TMDB_BACKDROP_BASE}${tvDetails.backdrop_path})`;
    }

    const year     = tvDetails.first_air_date?.slice(0, 4) || "s/f";
    const seasons  = tvDetails.number_of_seasons  ?? 0;
    const episodes = tvDetails.number_of_episodes ?? 0;
    const vote     = tvDetails.vote_average?.toFixed(1) ?? "N/A";

    heroMetaEl.textContent = `${year}  ·  ${seasons} temporada${seasons !== 1 ? "s" : ""}  ·  ${episodes} episodios  ·  ★ ${vote}`;
    heroOverviewEl.textContent = tvDetails.overview || "Sin sinopsis disponible en español.";
  } catch { /* el hero queda en blanco si falla */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES UI
// ─────────────────────────────────────────────────────────────────────────────
function showMessage(text, type = "info") {
  messagesEl.innerHTML = "";
  if (!text) return;
  const div = document.createElement("div");
  div.className = `alert alert-${type}`;
  div.textContent = text;
  messagesEl.appendChild(div);
}

function clearResults() { resultsEl.innerHTML = ""; }

function makeSectionHeader(title, subtitle) {
  const wrap = document.createElement("div");
  wrap.className = "section-header";
  const h = document.createElement("h2");
  h.textContent = title;
  wrap.appendChild(h);
  if (subtitle) {
    const p = document.createElement("p");
    p.textContent = subtitle;
    wrap.appendChild(p);
  }
  return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: INFORMACIÓN GENERAL
// ─────────────────────────────────────────────────────────────────────────────
async function renderOverviewView() {
  formContainer.appendChild(
    makeSectionHeader("Información general", "Ficha completa de la serie documental «Nuestro Planeta».")
  );
  clearResults();

  try {
    const { tvDetails, credits } = await ensureTvDetailsAndCredits();
    const genresList = await ensureGenresList();

    // ── Tarjeta principal ──────────────────────────────────────────────────
    const card = document.createElement("article");
    card.className = "detail-card";

    // Columna izquierda: póster
    const left = document.createElement("div");
    if (tvDetails.poster_path) {
      const img = document.createElement("img");
      img.src = `${TMDB_IMAGE_BASE}${tvDetails.poster_path}`;
      img.alt = tvDetails.name;
      img.className = "detail-poster";
      left.appendChild(img);
    }

    // Columna derecha: datos
    const right = document.createElement("div");
    right.className = "detail-body";

    const title = document.createElement("h2");
    title.className = "detail-title";
    title.textContent = `${tvDetails.name} (${tvDetails.first_air_date?.slice(0, 4) || "s/f"})`;

    const meta = document.createElement("div");
    meta.className = "detail-meta";
    meta.textContent = `★ ${tvDetails.vote_average?.toFixed(1) ?? "N/A"}  ·  ${tvDetails.number_of_seasons} temporadas  ·  ${tvDetails.number_of_episodes} episodios`;

    // Badges de géneros
    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";
    (tvDetails.genres || []).forEach((g) => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = g.name;
      badgeRow.appendChild(span);
    });

    const overview = document.createElement("p");
    overview.className = "detail-overview";
    overview.textContent = tvDetails.overview || "Sin sinopsis disponible en español.";

    // Grid de info en dos columnas
    const infoGrid = document.createElement("div");
    infoGrid.className = "info-grid";

    // Bloque 1: detalles básicos
    infoGrid.appendChild(makeInfoBlock("Detalles", [
      { label: "Estado",           value: tvDetails.status || "Desconocido" },
      { label: "País de origen",   value: (tvDetails.origin_country || []).join(", ") || "N/D" },
      { label: "Idioma original",  value: tvDetails.original_language?.toUpperCase() || "N/D" },
      { label: "Cadena(s)",        value: (tvDetails.networks || []).map((n) => n.name).join(", ") || "N/D" },
    ]));

    // Bloque 2: géneros TMDB
    const genreItems = (genresList || []).map((g) => ({
      label: `${g.id}`,
      value: g.name,
      highlight: tvDetails.genres?.some((sg) => sg.id === g.id),
    }));
    infoGrid.appendChild(makeInfoBlock("Géneros TMDB", genreItems));

    // Bloque 3: reparto
    const castItems = (credits.cast || []).slice(0, 6).map((p) => ({
      label: p.name, value: p.character || "—",
    }));
    infoGrid.appendChild(makeInfoBlock("Reparto principal", castItems));

    // Bloque 4: equipo
    const crewFiltered = (credits.crew || [])
      .filter((c) => ["Director", "Writer", "Producer", "Narrator"].includes(c.job))
      .slice(0, 6);
    const crewItems = crewFiltered.length
      ? crewFiltered.map((p) => ({ label: p.name, value: p.job }))
      : [{ label: "—", value: "Sin datos de equipo creativo" }];
    infoGrid.appendChild(makeInfoBlock("Equipo creativo", crewItems));

    right.appendChild(title);
    right.appendChild(meta);
    right.appendChild(badgeRow);
    right.appendChild(overview);
    right.appendChild(infoGrid);
    card.appendChild(left);
    card.appendChild(right);
    resultsEl.appendChild(card);
  } catch { /* errores mostrados en tmdbGet */ }
}

function makeInfoBlock(title, items) {
  const wrap = document.createElement("div");
  wrap.className = "info-block";

  const t = document.createElement("div");
  t.className = "info-block__title";
  t.textContent = title;
  wrap.appendChild(t);

  const ul = document.createElement("ul");
  ul.className = "info-list";
  items.forEach(({ label, value, highlight }) => {
    const li = document.createElement("li");
    if (highlight) li.classList.add("is-match");
    li.innerHTML = `<strong>${label}</strong> — ${value}`;
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: TEMPORADAS Y EPISODIOS
// ─────────────────────────────────────────────────────────────────────────────
async function renderSeasonsView() {
  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();

    const options = (tvDetails.seasons || [])
      .filter((s) => s.season_number !== 0)
      .map((s) => `<option value="${s.season_number}">Temporada ${s.season_number} — ${s.episode_count} ep.</option>`)
      .join("");

    const wrap = document.createElement("div");
    wrap.appendChild(makeSectionHeader("Temporadas y episodios", "Explora los episodios de cada temporada."));
    wrap.innerHTML += `
      <div class="form-row" style="margin-top:0.75rem">
        <div class="form-field">
          <label for="seasonNumber">Temporada</label>
          <select id="seasonNumber">${options}</select>
        </div>
        <div style="padding-top:1.4rem">
          <button id="loadSeasonBtn" class="btn btn-primary">Ver episodios</button>
        </div>
      </div>
    `;
    formContainer.appendChild(wrap);

    document.getElementById("loadSeasonBtn").addEventListener("click", async () => {
      const n = document.getElementById("seasonNumber").value;
      if (n) await loadSeason(n);
    });

    if (tvDetails.number_of_seasons >= 1) await loadSeason(1);
    else clearResults();
  } catch { }
}

async function loadSeason(n) {
  clearResults();
  try {
    const season = await tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}/season/${n}`);
    renderSeason(season);
  } catch { }
}

function renderSeason(season) {
  // Cabecera de la temporada
  const header = document.createElement("div");
  header.className = "season-header";
  header.innerHTML = `
    <h3>${season.name || "Temporada"} ${season.season_number}</h3>
    <div class="meta">${season.episodes?.length ?? 0} episodios</div>
    <p class="overview">${season.overview || "Sin descripción disponible."}</p>
  `;
  resultsEl.appendChild(header);

  if (!season.episodes?.length) return;

  const grid = document.createElement("div");
  grid.className = "episodes-grid";

  season.episodes.forEach((ep, i) => {
    const card = document.createElement("div");
    card.className = "episode-card";
    card.style.animationDelay = `${i * 0.04}s`;
    card.innerHTML = `
      <div class="episode-number">EP. ${String(ep.episode_number).padStart(2, "0")}</div>
      <div class="episode-title">${ep.name}</div>
      <div class="episode-date">${ep.air_date || "Fecha desconocida"}</div>
      <div class="episode-overview">${ep.overview || "Sin sinopsis disponible."}</div>
    `;
    grid.appendChild(card);
  });

  resultsEl.appendChild(grid);
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: GALERÍA
// ─────────────────────────────────────────────────────────────────────────────
async function renderGalleryView() {
  formContainer.appendChild(
    makeSectionHeader("Galería de imágenes", "Backdrops oficiales de la serie en TMDB.")
  );
  clearResults();

  try {
    const images   = await ensureImages();
    const backdrops = images.backdrops || [];

    if (!backdrops.length) {
      showMessage("No hay imágenes disponibles para esta serie.", "info");
      return;
    }

    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = `${Math.min(backdrops.length, 20)} imágenes destacadas`;
    resultsEl.appendChild(label);

    const scroller = document.createElement("div");
    scroller.className = "gallery-scroller";

    backdrops.slice(0, 20).forEach((img) => {
      const card = document.createElement("div");
      card.className = "gallery-card";
      const image = document.createElement("img");
      image.className = "gallery-img";
      image.src  = `${TMDB_BACKDROP_BASE}${img.file_path}`;
      image.alt  = "Imagen de la serie";
      image.loading = "lazy";
      card.appendChild(image);
      scroller.appendChild(card);
    });

    resultsEl.appendChild(scroller);
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: VÍDEOS
// ─────────────────────────────────────────────────────────────────────────────
async function renderVideosView() {
  formContainer.appendChild(
    makeSectionHeader("Tráilers y vídeos", "Vídeos oficiales de «Nuestro Planeta» en TMDB (YouTube).")
  );
  clearResults();

  try {
    const videos       = await ensureVideos();
    const youtubeVids  = (videos.results || []).filter((v) => v.site === "YouTube");

    if (!youtubeVids.length) {
      showMessage("No hay vídeos disponibles para esta serie.", "info");
      return;
    }

    const grid = document.createElement("div");
    grid.className = "video-grid";

    youtubeVids.slice(0, 6).forEach((video, i) => {
      const card = document.createElement("article");
      card.className = "video-card";
      card.style.animationDelay = `${i * 0.07}s`;

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${video.key}`;
      iframe.title = video.name;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;

      const body = document.createElement("div");
      body.className = "video-body";
      body.innerHTML = `
        <div class="video-title">${video.name}</div>
        <div class="video-meta">${video.type || "Vídeo"}  ·  ${video.published_at?.slice(0, 10) || "Fecha desconocida"}</div>
      `;

      card.appendChild(iframe);
      card.appendChild(body);
      grid.appendChild(card);
    });

    resultsEl.appendChild(grid);
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: REPARTO Y EQUIPO
// ─────────────────────────────────────────────────────────────────────────────
async function renderPeopleView() {
  formContainer.appendChild(
    makeSectionHeader("Reparto y equipo", "Haz clic en cualquier persona para ver su ficha completa.")
  );
  clearResults();

  try {
    const { credits } = await ensureTvDetailsAndCredits();

    const people = [
      ...(credits.cast || []).slice(0, 8),
      ...(credits.crew || [])
        .filter((c) => ["Director", "Writer", "Producer", "Narrator"].includes(c.job))
        .slice(0, 8),
    ];

    if (!people.length) {
      showMessage("No hay información de reparto o equipo disponible.", "info");
      return;
    }

    const grid = document.createElement("div");
    grid.className = "person-grid";

    people.forEach((person, i) => {
      const card = document.createElement("article");
      card.className = "person-card";
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.personId = person.id;

      if (person.profile_path) {
        const img = document.createElement("img");
        img.className = "person-photo";
        img.src  = `${TMDB_IMAGE_BASE}${person.profile_path}`;
        img.alt  = person.name;
        img.loading = "lazy";
        card.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "person-photo skeleton";
        card.appendChild(ph);
      }

      const info = document.createElement("div");
      info.className = "person-info";
      info.innerHTML = `
        <div class="person-name">${person.name}</div>
        <div class="person-role">${person.character || person.job || "Participación"}</div>
      `;
      card.appendChild(info);
      card.addEventListener("click", () => loadPersonDetail(person.id));
      grid.appendChild(card);
    });

    resultsEl.appendChild(grid);
  } catch { }
}

async function loadPersonDetail(personId) {
  try {
    let person = peopleCache.get(personId);
    if (!person) {
      person = await tmdbGet(`/person/${personId}`);
      peopleCache.set(personId, person);
    }
    renderPersonDetail(person);
  } catch { }
}

function renderPersonDetail(person) {
  // Elimina ficha anterior si existe
  resultsEl.querySelector(".person-detail")?.remove();

  const card = document.createElement("article");
  card.className = "person-detail";

  const left = document.createElement("div");
  if (person.profile_path) {
    const img = document.createElement("img");
    img.src = `${TMDB_IMAGE_BASE}${person.profile_path}`;
    img.alt = person.name;
    img.className = "person-detail__photo";
    left.appendChild(img);
  }

  const right = document.createElement("div");
  right.innerHTML = `
    <div class="person-detail__name">${person.name}</div>
    <div class="person-detail__meta">
      ${person.known_for_department ? `Conocido por: ${person.known_for_department}<br/>` : ""}
      ${person.birthday ? `Nacimiento: ${person.birthday}<br/>` : ""}
      ${person.place_of_birth ? `Lugar: ${person.place_of_birth}` : ""}
    </div>
    <p class="person-detail__bio">${person.biography || "No hay biografía disponible en español para esta persona."}</p>
  `;

  card.appendChild(left);
  card.appendChild(right);
  resultsEl.prepend(card);
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: MÁS COMO ESTA
// ─────────────────────────────────────────────────────────────────────────────
async function renderMoreLikeThisView() {
  formContainer.appendChild(
    makeSectionHeader("Más como esta", "Series y documentales similares según los géneros de «Nuestro Planeta».")
  );
  clearResults();

  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();
    const mainGenre = (tvDetails.genres || [])[0];

    if (!mainGenre) {
      showMessage("La serie no tiene géneros asociados en TMDB.", "info");
      return;
    }

    const data    = await tmdbGet("/discover/tv", {
      with_genres: mainGenre.id,
      sort_by:     "popularity.desc",
    });
    const results = (data.results || []).filter((tv) => tv.id !== NUESTRO_PLANETA_TV_ID);

    if (!results.length) {
      showMessage("No se encontraron series similares.", "info");
      return;
    }

    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = `Más títulos del género "${mainGenre.name}"`;
    resultsEl.appendChild(label);

    const scroller = document.createElement("div");
    scroller.className = "poster-scroller";

    results.slice(0, 20).forEach((tv) => {
      const card = document.createElement("article");
      card.className = "poster-card";

      if (tv.poster_path) {
        const img = document.createElement("img");
        img.className = "poster-img";
        img.src  = `${TMDB_IMAGE_BASE}${tv.poster_path}`;
        img.alt  = tv.name;
        img.loading = "lazy";
        card.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "poster-body";
      body.innerHTML = `
        <div class="poster-title">${tv.name}</div>
        <div class="poster-score">★ ${tv.vote_average?.toFixed(1) ?? "N/A"}</div>
      `;
      card.appendChild(body);
      scroller.appendChild(card);
    });

    resultsEl.appendChild(scroller);
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);