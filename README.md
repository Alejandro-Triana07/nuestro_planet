# Explorador TMDB - Serie "Nuestro planeta"

Aplicación web sencilla (HTML + CSS + JavaScript) para practicar el uso de la API de [The Movie Database (TMDB)](https://www.themoviedb.org/), centrada **exclusivamente** en la serie documental **"Nuestro planeta"**

La app permite:

- Consultar la información principal de la serie *Nuestro planeta* a pantalla completa (hero tipo Netflix).
- Ver temporadas y episodios de la serie.
- Ver una galería de imágenes (backdrops) oficiales.
- Ver tráilers y vídeos (YouTube) asociados a la serie.
- Explorar reparto y equipo, y ver detalle de una persona concreta.
- Ver más documentales/series similares según los géneros de TMDB.
- Alternar entre dos paletas neón (cian/violeta) para el tema oscuro.

Se utilizan al menos estos **endpoints** de la API de TMDB:

- `GET /tv/{tv_id}` — detalle de la serie "Nuestro planeta".
- `GET /tv/{tv_id}/credits` — créditos (reparto y equipo) de la serie.
- `GET /tv/{tv_id}/season/{season_number}` — detalle de una temporada y sus episodios.
- `GET /tv/{tv_id}/images` — imágenes (backdrops, posters) de la serie.
- `GET /tv/{tv_id}/videos` — vídeos (tráilers, clips) de la serie.
- `GET /genre/tv/list` — listado de géneros de TV (para contextualizar los géneros de la serie).
- `GET /discover/tv` — descubrir otras series filtrando por el género principal de "Nuestro planeta".
- `GET /person/{person_id}` — detalle de una persona del reparto/equipo (biografía, lugar de nacimiento, etc.).

## 1. Requisitos

- Navegador moderno (Chrome, Edge, Firefox, etc.).
- Conexión a Internet.
- Una **API Key de TMDB (v3)** (gratuita).

### Cómo obtener tu API Key

1. Regístrate en `https://www.themoviedb.org/`.
2. En tu perfil ve a **Settings → API** o directamente a `https://www.themoviedb.org/settings/api`.
3. Solicita una **API Key para desarrolladores**.
4. Una vez aprobada copia tu clave (formato similar a `abcd1234...`).

> **Importante**: No subas tu API Key real a GitHub ni la compartas públicamente.

## 2. Cómo configurar y ejecutar el proyecto

1. Clona o copia la carpeta del proyecto.
2. Abre el archivo `index.html` directamente en tu navegador (doble clic o "Abrir con...").
   - No es obligatorio usar servidor local; las peticiones a TMDB se hacen vía HTTPS con CORS habilitado.
3. En la parte superior de la página:
   - Pega tu **API Key** en el campo *"API Key TMDB"*.
   - Pulsa **"Guardar"**. La clave se guardará de forma local en `localStorage` de tu navegador.
4. En el código de `main.js`, busca la constante:

   ```js
   const NUESTRO_PLANETA_TV_ID = 0;
   ```

   y reemplaza `0` por el ID real de la serie **"Nuestro planeta"** en TMDB (por ejemplo, si la URL de TMDB es `https://www.themoviedb.org/tv/12345`, el ID es `12345`).

5. Usa el **menú principal horizontal** para moverte entre las secciones (Información general, Temporadas, Galería, Vídeos, Reparto, Más como esta).

## 3. Funcionalidades principales

- **Información general**
  - Vista principal tipo Netflix (hero con imagen de fondo).
  - Muestra sinopsis, número de temporadas, episodios, géneros, países de origen y principales personas implicadas (reparto y equipo).
  - Utiliza `GET /tv/{tv_id}`, `GET /tv/{tv_id}/credits` y `GET /genre/tv/list`.

- **Temporadas y episodios** (`GET /tv/{tv_id}/season/{season_number}`)
  - Selector de temporada.
  - Muestra una tarjeta con la descripción de la temporada y un listado de episodios (número, título, fecha, sinopsis).

- **Galería de imágenes** (`GET /tv/{tv_id}/images`)
  - Carrusel horizontal de imágenes (backdrops) en alta calidad, al estilo Netflix.

- **Tráilers y vídeos** (`GET /tv/{tv_id}/videos`)
  - Muestra tarjetas con iframes de YouTube para los vídeos oficiales (tráilers, clips, etc.).

- **Reparto y equipo** (`GET /tv/{tv_id}/credits` + `GET /person/{person_id}`)
  - Cuadrícula con personas destacadas del reparto y equipo.
  - Al hacer clic se carga una ficha con información más detallada de la persona (biografía, lugar de nacimiento…).

- **Más como esta** (`GET /discover/tv`)
  - Muestra un carrusel de otras series/documentales filtrados por el género principal de "Nuestro planeta".
  - Sirve como recomendaciones relacionadas con la serie principal.

- **Modo neón (cian / violeta)**
  - Botón en la cabecera que alterna entre dos variantes de tema oscuro, ambas con fondo negro y acentos neón.

## 4. Manejo de errores

La app gestiona varios tipos de errores:

- Falta de API Key (se muestra mensaje indicando que debes introducirla).
- ID inexistente o recurso no encontrado (404).
- Series o personas no encontradas (búsquedas vacías).
- Problemas de conexión o errores genéricos de red (códigos HTTP ≥ 400).

Los mensajes se muestran en un área de notificaciones en la parte superior del contenido.

## 5. Configuración de la API Key (seguridad)

- La API Key **no está guardada en el código**.
- Se introduce desde la interfaz y se almacena únicamente en el navegador (`localStorage`).
- Si subes este proyecto a GitHub, no se sube ninguna clave.

Si quisieras usar variables de entorno en un proyecto más grande (por ejemplo, con un backend en Node.js o un bundler como Vite/React), la recomendación sería:

- Guardar la clave como `TMDB_API_KEY` en un archivo `.env` (no subirlo al repositorio).
- Leer esa variable desde el servidor y hacer las peticiones a TMDB desde el backend.

## 6. Notas para el informe

En tu informe puedes comentar, por ejemplo:

- **Qué es una API REST** y cómo la usas (método GET, URL + parámetros, cabeceras, etc.).
- **Cómo use cada endpoint**:
  - `/tv/{tv_id}` y `/tv/{tv_id}/credits` para obtener toda la información base de *Nuestro planeta* (ficha general, géneros, reparto, equipo).
  - `/tv/{tv_id}/season/{season_number}` para listar episodios por temporada.
  - `/tv/{tv_id}/images` para construir la galería de imágenes.
  - `/tv/{tv_id}/videos` para mostrar los tráilers y vídeos de YouTube.
  - `/genre/tv/list` para obtener la lista completa de géneros de TV y contextualizar los géneros de la serie.
  - `/discover/tv` para encontrar series/documentales similares según el género principal.
  - `/person/{person_id}` para ampliar información de personas del reparto/equipo.
- Cómo procesas el **JSON** recibido (propiedades como `genres`, `episodes`, `backdrops`, `results`, etc.).
- Cómo presentas los datos de forma organizada e incluyes **imágenes** usando `poster_path`, `backdrop_path` o `profile_path`.
- Cómo manejas errores y validaciones de entrada del usuario (falta de API Key, ID sin configurar, 404, problemas de red, etc.).

## 7. Capturas de pantalla sugeridas

Para la entrega, se recomiendan capturas de:

1. Vista principal con el **hero** de *Nuestro planeta* (información general).
2. Vista de **Temporadas y episodios** mostrando el listado de episodios de una temporada.
3. Vista de **Galería de imágenes** con el carrusel tipo Netflix.
4. Vista de **Tráilers y vídeos** mostrando al menos un vídeo.
5. Vista de **Reparto y equipo**, con el detalle abierto de alguna persona.
6. Vista de **Más como esta**, mostrando recomendaciones relacionadas.

