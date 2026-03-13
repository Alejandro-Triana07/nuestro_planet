const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const DEFAULT_LANGUAGE = "es-ES";

const NUESTRO_PLANETA_TV_ID = 83880;

const TMDB_API_KEY = "b2b5b414609685cb8e24e2fd7d23c9af";

const themeToggleBtn = document.getElementById("themeToggleBtn");
const messagesEl = document.getElementById("messages");
const formContainer = document.getElementById("formContainer");
const resultsEl = document.getElementById("results");
const heroEl = document.getElementById("hero");
const heroMetaEl = document.getElementById("heroMeta");
const heroOverviewEl = document.getElementById("heroOverview");

let navButtons = document.querySelectorAll(".nav-btn");

let tvDetailsCache = null;
let creditsCache = null;
let imagesCache = null;
let videosCache = null;
let genresListCache = null;
const peopleCache = new Map();

function init() {
  const storedTheme = window.localStorage.getItem("theme") || "light";
  applyTheme(storedTheme);

  themeToggleBtn.addEventListener("click", toggleTheme);

  document
    .querySelectorAll("[data-view]")
    .forEach((btn) =>
      btn.addEventListener("click", () => changeView(btn.dataset.view))
    );

  navButtons = document.querySelectorAll(".nav-btn");

  loadHero().catch(() => {});
  changeView("overview");
}

function showMessage(text, type = "info") {
  messagesEl.innerHTML = "";
  if (!text) return;
  const div = document.createElement("div");
  div.className = `alert alert-${type}`;
  div.textContent = text;
  messagesEl.appendChild(div);
}

function clearResults() {
  resultsEl.innerHTML = "";
}

function applyTheme(theme) {
  const isDarkVariant = theme === "dark";
  document.body.classList.toggle("dark", isDarkVariant);
  themeToggleBtn.textContent = isDarkVariant ? "Modo cian" : "Modo violeta";
  window.localStorage.setItem("theme", isDarkVariant ? "dark" : "light");
}

function toggleTheme() {
  const current = document.body.classList.contains("dark") ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
}

function setActiveNav(view) {
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

async function tmdbGet(endpoint, params = {}) {
  const url = new URL(TMDB_BASE_URL + endpoint);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", DEFAULT_LANGUAGE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Recurso no encontrado (404).");
      }
      throw new Error(`Error en la petición (${response.status}).`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Error de red al llamar a la API.", "error");
    throw error;
  }
}

async function ensureTvDetailsAndCredits() {
  if (!tvDetailsCache || !creditsCache) {
    const [details, credits] = await Promise.all([
      tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}`),
      tmdbGet(`/tv/${NUESTRO_PLANETA_TV_ID}/credits`),
    ]);
    tvDetailsCache = details;
    creditsCache = credits;
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

async function loadHero() {
  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();

    const backdropUrl = tvDetails.backdrop_path
      ? `${TMDB_BACKDROP_BASE}${tvDetails.backdrop_path}`
      : null;

    if (backdropUrl) {
      heroEl.style.backgroundImage = `url(${backdropUrl})`;
    }

    const year = tvDetails.first_air_date?.slice(0, 4) || "s/f";
    const seasons = tvDetails.number_of_seasons ?? 0;
    const episodes = tvDetails.number_of_episodes ?? 0;
    const vote = tvDetails.vote_average?.toFixed(1) ?? "N/A";

    heroMetaEl.textContent = `${year} · ${seasons} temporada(s) · ${episodes} episodios · Puntuación TMDB: ${vote}`;

    heroOverviewEl.textContent =
      tvDetails.overview ||
      "Sin sinopsis disponible en español para esta serie.";
  } catch {
  }
}

function changeView(view) {
  setActiveNav(view);
  messagesEl.innerHTML = "";
  formContainer.innerHTML = "";
  clearResults();

  switch (view) {
    case "overview":
      renderOverviewView();
      break;
    case "seasons":
      renderSeasonsView();
      break;
    case "gallery":
      renderGalleryView();
      break;
    case "videos":
      renderVideosView();
      break;
    case "people":
      renderPeopleView();
      break;
    case "more-like-this":
      renderMoreLikeThisView();
      break;
    default:
      renderOverviewView();
  }
}

async function renderOverviewView() {
  formContainer.innerHTML = `
    <div class="form-header">
      <div>
        <h2>Información general</h2>
        <p>Ficha principal de la serie documental "Nuestro planeta".</p>
      </div>
    </div>
  `;

  clearResults();

  try {
    const { tvDetails, credits } = await ensureTvDetailsAndCredits();
    const genresList = await ensureGenresList();

    const container = document.createElement("article");
    container.className = "card";

    const posterUrl = tvDetails.poster_path
      ? `${TMDB_IMAGE_BASE}${tvDetails.poster_path}`
      : null;

    const left = document.createElement("div");
    if (posterUrl) {
      const img = document.createElement("img");
      img.src = posterUrl;
      img.alt = tvDetails.name;
      img.className = "poster";
      left.appendChild(img);
    }

    const right = document.createElement("div");
    right.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = `${tvDetails.name} (${tvDetails.first_air_date?.slice(0, 4) || "s/f"})`;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Puntuación TMDB: ${tvDetails.vote_average?.toFixed(1) ?? "N/A"} · ${tvDetails.number_of_seasons} temporadas · ${tvDetails.number_of_episodes} episodios`;

    const badges = document.createElement("div");
    if (tvDetails.genres?.length) {
      tvDetails.genres.forEach((g) => {
        const span = document.createElement("span");
        span.className = "badge";
        span.textContent = g.name;
        badges.appendChild(span);
      });
    }

    const overview = document.createElement("p");
    overview.className = "overview";
    overview.textContent =
      tvDetails.overview ||
      "Sin sinopsis disponible en español para esta serie.";

    const twoCol = document.createElement("div");
    twoCol.className = "two-columns";

    const basicCard = document.createElement("div");
    const basicTitle = document.createElement("div");
    basicTitle.className = "section-title";
    basicTitle.textContent = "Detalles básicos";
    const basicList = document.createElement("ul");
    basicList.className = "list";

    basicList.innerHTML = `
      <li><strong>Estado:</strong> ${tvDetails.status || "Desconocido"}</li>
      <li><strong>País de origen:</strong> ${(tvDetails.origin_country || []).join(", ") || "N/D"}</li>
      <li><strong>Idioma original:</strong> ${tvDetails.original_language || "N/D"}</li>
      <li><strong>Cadena(s):</strong> ${(tvDetails.networks || []).map((n) => n.name).join(", ") || "N/D"}</li>
    `;

    basicCard.appendChild(basicTitle);
    basicCard.appendChild(basicList);

    const genresCard = document.createElement("div");
    const genresTitle = document.createElement("div");
    genresTitle.className = "section-title";
    genresTitle.textContent = "Géneros en TMDB";
    const genresListEl = document.createElement("ul");
    genresListEl.className = "list";

    (genresList || []).forEach((genre) => {
      const li = document.createElement("li");
      const isOfShow = tvDetails.genres?.some((g) => g.id === genre.id);
      li.textContent = `${genre.id} — ${genre.name}${isOfShow ? " (pertenece a la serie)" : ""}`;
      genresListEl.appendChild(li);
    });

    genresCard.appendChild(genresTitle);
    genresCard.appendChild(genresListEl);

    twoCol.appendChild(basicCard);
    twoCol.appendChild(genresCard);

    const peopleCard = document.createElement("div");
    peopleCard.className = "two-columns";

    const castCard = document.createElement("div");
    const castTitle = document.createElement("div");
    castTitle.className = "section-title";
    castTitle.textContent = "Reparto principal";
    const castList = document.createElement("ul");
    castList.className = "list";

    (credits.cast || []).slice(0, 6).forEach((person) => {
      const li = document.createElement("li");
      li.textContent = `${person.name} — ${person.character}`;
      castList.appendChild(li);
    });

    castCard.appendChild(castTitle);
    castCard.appendChild(castList);

    const crewCard = document.createElement("div");
    const crewTitle = document.createElement("div");
    crewTitle.className = "section-title";
    crewTitle.textContent = "Equipo creativo";
    const crewList = document.createElement("ul");
    crewList.className = "list";

    (credits.crew || [])
      .filter((c) => ["Director", "Writer", "Producer", "Narrator"].includes(c.job))
      .slice(0, 6)
      .forEach((person) => {
        const li = document.createElement("li");
        li.textContent = `${person.name} — ${person.job}`;
        crewList.appendChild(li);
      });

    if (!crewList.children.length) {
      const li = document.createElement("li");
      li.textContent = "No hay información destacada de equipo creativo.";
      crewList.appendChild(li);
    }

    crewCard.appendChild(crewTitle);
    crewCard.appendChild(crewList);

    peopleCard.appendChild(castCard);
    peopleCard.appendChild(crewCard);

    right.appendChild(title);
    right.appendChild(meta);
    right.appendChild(badges);
    right.appendChild(overview);
    right.appendChild(twoCol);
    right.appendChild(peopleCard);

    container.appendChild(left);
    container.appendChild(right);

    resultsEl.appendChild(container);
  } catch {
  }
}

async function renderSeasonsView() {
  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();

    const seasonsOptions = (tvDetails.seasons || [])
      .filter((s) => s.season_number !== 0)
      .map(
        (s) =>
          `<option value="${s.season_number}">Temporada ${s.season_number} — ${s.episode_count} episodios</option>`
      )
      .join("");

    formContainer.innerHTML = `
      <div class="form-header">
        <div>
          <h2>Temporadas y episodios</h2>
          <p>Explora los episodios de cada temporada de "Nuestro planeta".</p>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label for="seasonNumber">Temporada</label>
          <select id="seasonNumber">
            <option value="">Selecciona una temporada</option>
            ${seasonsOptions}
          </select>
        </div>
        <div class="form-actions">
          <button id="loadSeasonBtn" class="btn btn-primary">Ver episodios</button>
        </div>
      </div>
    `;

    document.getElementById("loadSeasonBtn").addEventListener("click", async () => {
      const seasonNumber = document.getElementById("seasonNumber").value.trim();
      if (!seasonNumber) return;
      await loadSeason(seasonNumber);
    });

    if (tvDetails.number_of_seasons >= 1) {
      await loadSeason(1);
    } else {
      clearResults();
    }
  } catch {
  }
}

async function loadSeason(seasonNumber) {
  clearResults();
  try {
    const season = await tmdbGet(
      `/tv/${NUESTRO_PLANETA_TV_ID}/season/${seasonNumber}`
    );
    renderSeason(season);
  } catch {
  }
}

function renderSeason(season) {
  const headerCard = document.createElement("article");
  headerCard.className = "card card-compact";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.textContent = `${season.name || "Temporada"} · ${season.season_number}`;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `Episodios: ${season.episodes?.length ?? 0}`;

  const overview = document.createElement("p");
  overview.className = "overview";
  overview.textContent =
    season.overview ||
    "Sin descripción disponible para esta temporada en este idioma.";

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(overview);
  headerCard.appendChild(body);
  resultsEl.appendChild(headerCard);

  if (!season.episodes?.length) return;

  const episodesGrid = document.createElement("div");
  episodesGrid.className = "episodes-grid";

  season.episodes.forEach((ep) => {
    const epCard = document.createElement("div");
    epCard.className = "episode-card";

    const header = document.createElement("div");
    header.className = "episode-header";
    const titleEl = document.createElement("div");
    titleEl.className = "episode-title";
    titleEl.textContent = `${ep.episode_number}. ${ep.name}`;
    const airEl = document.createElement("div");
    airEl.className = "meta";
    airEl.textContent = ep.air_date || "Fecha no disponible";
    header.appendChild(titleEl);
    header.appendChild(airEl);

    const overviewEl = document.createElement("div");
    overviewEl.textContent =
      ep.overview || "Sin sinopsis disponible para este episodio.";

    epCard.appendChild(header);
    epCard.appendChild(overviewEl);

    episodesGrid.appendChild(epCard);
  });

  resultsEl.appendChild(episodesGrid);
}

async function renderGalleryView() {
  formContainer.innerHTML = `
    <div class="form-header">
      <div>
        <h2>Galería de imágenes</h2>
        <p>Backdrops y fotografías oficiales de la serie en TMDB.</p>
      </div>
    </div>
  `;

  clearResults();

  try {
    const images = await ensureImages();
    const backdrops = images.backdrops || [];

    if (!backdrops.length) {
      showMessage("No hay imágenes disponibles para esta serie.", "info");
      return;
    }

    const row = document.createElement("section");
    row.className = "row";

    const title = document.createElement("h3");
    title.className = "row-title";
    title.textContent = "Imágenes destacadas";

    const scroller = document.createElement("div");
    scroller.className = "row-scroller";

    backdrops.slice(0, 20).forEach((img) => {
      const card = document.createElement("article");
      card.className = "poster-card";

      const imageEl = document.createElement("img");
      imageEl.className = "poster-img";
      imageEl.src = `${TMDB_BACKDROP_BASE}${img.file_path}`;
      imageEl.alt = "Imagen de la serie";

      card.appendChild(imageEl);
      scroller.appendChild(card);
    });

    row.appendChild(title);
    row.appendChild(scroller);
    resultsEl.appendChild(row);
  } catch {
  }
}

async function renderVideosView() {
  formContainer.innerHTML = `
    <div class="form-header">
      <div>
        <h2>Tráilers y vídeos</h2>
        <p>Vídeos oficiales de "Nuestro planeta" disponibles en TMDB (YouTube).</p>
      </div>
    </div>
  `;

  clearResults();

  try {
    const videos = await ensureVideos();
    const youtubeVideos = (videos.results || []).filter(
      (v) => v.site === "YouTube"
    );

    if (!youtubeVideos.length) {
      showMessage("No hay vídeos disponibles para esta serie.", "info");
      return;
    }

    const grid = document.createElement("section");
    grid.className = "video-grid";

    youtubeVideos.slice(0, 6).forEach((video) => {
      const card = document.createElement("article");
      card.className = "video-card";

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${video.key}`;
      iframe.title = video.name;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;

      const body = document.createElement("div");
      body.className = "video-body";

      const titleEl = document.createElement("div");
      titleEl.className = "section-title";
      titleEl.textContent = video.name;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${video.type || "Vídeo"} · ${video.published_at?.slice(0, 10) || "Fecha desconocida"}`;

      body.appendChild(titleEl);
      body.appendChild(meta);

      card.appendChild(iframe);
      card.appendChild(body);
      grid.appendChild(card);
    });

    resultsEl.appendChild(grid);
  } catch {
  }
}

async function renderPeopleView() {
  formContainer.innerHTML = `
    <div class="form-header">
      <div>
        <h2>Reparto y equipo</h2>
        <p>Personas que participan en la serie. Haz clic para ver más detalles.</p>
      </div>
    </div>
  `;

  clearResults();

  try {
    const { credits } = await ensureTvDetailsAndCredits();

    const grid = document.createElement("section");
    grid.className = "person-grid";

    const mainPeople = [
      ...(credits.cast || []).slice(0, 8),
      ...(credits.crew || [])
        .filter((c) =>
          ["Director", "Writer", "Producer", "Narrator"].includes(c.job)
        )
        .slice(0, 8),
    ];

    if (!mainPeople.length) {
      showMessage("No hay información de reparto o equipo disponible.", "info");
      return;
    }

    mainPeople.forEach((person) => {
      const card = document.createElement("article");
      card.className = "poster-card";
      card.dataset.personId = person.id;

      const profileUrl = person.profile_path
        ? `${TMDB_IMAGE_BASE}${person.profile_path}`
        : null;

      if (profileUrl) {
        const img = document.createElement("img");
        img.className = "poster-img";
        img.src = profileUrl;
        img.alt = person.name;
        card.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "poster-body";

      const title = document.createElement("div");
      title.className = "poster-title";
      title.textContent = person.name;

      const meta = document.createElement("div");
      meta.className = "poster-meta";
      meta.textContent =
        person.character || person.job || "Participación en la serie";

      body.appendChild(title);
      body.appendChild(meta);
      card.appendChild(body);

      card.addEventListener("click", () => loadPersonDetail(person.id));

      grid.appendChild(card);
    });

    resultsEl.appendChild(grid);
  } catch {
  }
}

async function loadPersonDetail(personId) {
  try {
    let person = peopleCache.get(personId);
    if (!person) {
      person = await tmdbGet(`/person/${personId}`);
      peopleCache.set(personId, person);
    }
    renderPersonDetail(person);
  } catch {
  }
}

function renderPersonDetail(person) {
  const card = document.createElement("article");
  card.className = "card card-compact";

  const profileUrl = person.profile_path
    ? `${TMDB_IMAGE_BASE}${person.profile_path}`
    : null;

  const left = document.createElement("div");
  if (profileUrl) {
    const img = document.createElement("img");
    img.src = profileUrl;
    img.alt = person.name;
    img.className = "poster";
    left.appendChild(img);
  }

  const right = document.createElement("div");
  right.className = "card-body";

  const title = document.createElement("h3");
  title.textContent = person.name;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `Conocido por: ${person.known_for_department || "N/D"} · Lugar de nacimiento: ${person.place_of_birth || "No disponible"} · Nacimiento: ${person.birthday || "N/D"}`;

  const overview = document.createElement("p");
  overview.className = "overview";
  overview.textContent =
    person.biography ||
    "No hay biografía disponible en español para esta persona.";

  right.appendChild(title);
  right.appendChild(meta);
  right.appendChild(overview);

  card.appendChild(left);
  card.appendChild(right);

  resultsEl.prepend(card);
}

async function renderMoreLikeThisView() {
  formContainer.innerHTML = `
    <div class="form-header">
      <div>
        <h2>Más como esta</h2>
        <p>Documentales y series similares según los géneros de "Nuestro planeta".</p>
      </div>
    </div>
  `;

  clearResults();

  try {
    const { tvDetails } = await ensureTvDetailsAndCredits();
    const mainGenre = (tvDetails.genres || [])[0];

    if (!mainGenre) {
      showMessage(
        "La serie no tiene géneros asociados en TMDB, no se pueden buscar similares.",
        "info"
      );
      return;
    }

    const data = await tmdbGet("/discover/tv", {
      with_genres: mainGenre.id,
      sort_by: "popularity.desc",
    });

    const results = (data.results || []).filter(
      (tv) => tv.id !== NUESTRO_PLANETA_TV_ID
    );

    if (!results.length) {
      showMessage("No se encontraron otras series similares para mostrar.", "info");
      return;
    }

    const row = document.createElement("section");
    row.className = "row";

    const title = document.createElement("h3");
    title.className = "row-title";
    title.textContent = `Más títulos del género "${mainGenre.name}"`;

    const scroller = document.createElement("div");
    scroller.className = "row-scroller";

    results.slice(0, 20).forEach((tv) => {
      const card = document.createElement("article");
      card.className = "poster-card";

      const posterUrl = tv.poster_path
        ? `${TMDB_IMAGE_BASE}${tv.poster_path}`
        : null;

      if (posterUrl) {
        const img = document.createElement("img");
        img.className = "poster-img";
        img.src = posterUrl;
        img.alt = tv.name;
        card.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "poster-body";

      const titleEl = document.createElement("div");
      titleEl.className = "poster-title";
      titleEl.textContent = tv.name;

      const meta = document.createElement("div");
      meta.className = "poster-meta";
      meta.textContent = `Puntuación: ${tv.vote_average?.toFixed(1) ?? "N/A"}`;

      body.appendChild(titleEl);
      body.appendChild(meta);

      card.appendChild(body);
      scroller.appendChild(card);
    });

    row.appendChild(title);
    row.appendChild(scroller);
    resultsEl.appendChild(row);
  } catch {
  }
}

document.addEventListener("DOMContentLoaded", init);