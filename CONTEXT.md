# PokéVerse 2.0 — contexto del proyecto

## Propósito

PokéVerse es una Pokédex web en español. Permite buscar y filtrar Pokémon, consultar su ficha completa, navegar por su línea evolutiva y explorar cartas reales del juego de cartas coleccionables.

La versión 2.0 reemplaza la implementación anterior en HTML, CSS y JavaScript imperativo por una aplicación React con TypeScript. El objetivo de la migración es que el proyecto sea más mantenible, predecible y fácil de ampliar.

## Stack actual

- React con componentes funcionales y hooks.
- TypeScript en modo estricto.
- Vite para desarrollo y compilación de producción.
- Motion para entradas, salidas, cambios de layout y microinteracciones.
- React Router para rutas compartibles: `/` (Pokédex), `/mercado` (precios de todas las cartas) y `/pokemon/{nombre|id}` (ficha).
- TanStack Query (`@tanstack/react-query`) para caché, reintentos y estados de carga de **todos** los datos remotos.
- TanStack Virtual (`@tanstack/react-virtual`) para virtualizar la cuadrícula de Pokémon.
- CSS propio con variables, responsive y soporte para `prefers-reduced-motion`.

No se utilizan librerías de componentes visuales. Todo el sistema gráfico es propio.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
npm run cards    # regenera public/cards.json (precios de todas las cartas, ~5–15 min)
```

Las dependencias están fijadas con `^` a las versiones probadas (React 19.3, Vite 8.3, TypeScript 7.0, Motion 13.4, React Router 7.18, TanStack Query 5.103, TanStack Virtual 3.14). Para actualizar, usa `npm outdated` y actualiza de forma deliberada: no vuelvas a poner `"latest"`.

El servidor de desarrollo muestra la URL local, normalmente `http://localhost:5173`.

`npm run build` ejecuta primero la comprobación de TypeScript y después genera los archivos optimizados en `dist/`.

## Estructura

```text
.
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── .github/workflows/cards.yml   # job diario que ejecuta npm run cards
├── public/
│   └── cards.json                # snapshot de precios (generado)
├── scripts/
│   └── build-cards.ts            # genera public/cards.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api.ts
    ├── pricing.ts
    ├── data.ts
    ├── types.ts
    ├── styles.css
    └── components/
        ├── SearchFilters.tsx
        ├── PokemonGrid.tsx
        ├── PokemonCard.tsx
        ├── PokemonDetail.tsx
        ├── CardCollection.tsx
        ├── Market.tsx
        └── Evolution.tsx
```

## Responsabilidades

- `main.tsx`: monta `QueryClientProvider` (datos frescos durante 1 h, sin recarga al volver a la pestaña, 2 reintentos salvo en los 404, para que un Pokémon inexistente muestre el error enseguida) y `BrowserRouter`.
- `App.tsx`: portada, índice completo con `useQuery`, estado y lógica de filtros, rutas y apertura del detalle.
- `api.ts`: acceso a PokéAPI (REST y GraphQL) y TCGdex, caché en memoria y funciones de consulta.
- `pricing.ts`: precio de referencia de cada carta (`priceOf`), rangos de precio, nombres de variantes y formato de moneda.
- `PokemonGrid.tsx`: cuadrícula virtualizada con `useWindowVirtualizer`, que agrupa las tarjetas en filas de 5, 4 o 2 columnas.
- `CardCollection.tsx`: cartas TCG con filtros de precio (`CardCollection`) y visor con el desglose de precios (`CardViewer`).
- `Market.tsx`: página `/mercado` sobre `public/cards.json`, con búsqueda, filtros, ranking y enlace a la Pokédex.
- `data.ts`: tipos, generaciones, traducciones, colores y rutas de imágenes.
- `types.ts`: contratos TypeScript de las respuestas principales.
- `SearchFilters.tsx`: buscador accesible, sugerencias y filtros.
- `PokemonCard.tsx`: tarjeta y animación de entrada. Usa los tipos del índice y solo los pide a la API si el índice vino del respaldo REST.
- `PokemonDetail.tsx`: ficha, estadísticas, habilidades, efectividad, audio y shiny. Monta `CardCollection` y abre `CardViewer` mediante un portal.
- `Evolution.tsx`: dibuja la cadena evolutiva como **árbol** (`evo-tree` / `evo-node` / `evo-children` / `evo-branch`), no como lista plana. Las ramas se muestran en paralelo (Wurmple, Ralts→Gardevoir/Gallade), y con más de 2 ramas (Eevee) el padre va arriba con los hijos en grilla (`evo-many`). En móvil todo va en vertical. Traduce las condiciones: nivel, objeto, intercambio, amistad, hora, género, Ataque/Defensa (Tyrogue), lugar, etc. Si hay varias formas de evolucionar según el juego, muestra hasta 2.
- `scripts/build-cards.ts`: script de Node (sin build, Node 22.18+ ejecuta TypeScript) que genera el snapshot de precios reutilizando `priceOf` de `src/pricing.ts`.

## APIs

### PokéAPI

Base: `https://pokeapi.co/api/v2`

- `/pokemon?limit=2000`: índice de respaldo, con solo nombre e id, que se usa si falla GraphQL.
- `/pokemon/{id|nombre}`: tipos, estadísticas, habilidades, sprites y gritos.
- `/pokemon-species/{id}`: traducciones, descripción, generación y evolución.
- `/type/{tipo}`: filtrado y cálculo de debilidades/resistencias.
- `/ability/{id}`: nombre y descripción en español.
- `/evolution-chain/{id}`: línea evolutiva.

### PokéAPI GraphQL (índice completo)

Base: `https://beta.pokeapi.co/graphql/v1beta` (POST)

`getAllPokemon()` pide en **una sola consulta** los 1302 Pokémon (1025 especies + formas Mega, Gmax y regionales) con id, nombre, tipos ordenados por slot, generación, legendario y singular. La respuesta pesa unos 290 KB y tarda cerca de medio segundo.

- El resultado se guarda **24 h en `localStorage`** con la clave `pokeverse:index:v1`, porque el endpoint es beta y tiene límite de uso. Si cambia la forma de `IndexPokemon`, hay que subir la versión de la clave.
- Si GraphQL falla, se usa el índice REST. En ese caso las tarjetas cargan sus tipos una por una y el filtro por tipo usa `/type/{tipo}` (`hasTypes` en `App.tsx`).
- Gracias a esto, la cuadrícula ya no hace una petición por tarjeta, y los filtros de generación, tipo, formas y legendarios o singulares se aplican en el navegador sin nuevas peticiones.

### TCGdex

Base: `https://api.tcgdex.net/v2/en`

- `/cards?dexId=eq:{id}`: listado de las cartas de una especie, **sin precios**.
- `/cards/{id}`: detalle de la carta con `rarity`, `set`, `illustrator` y **`pricing`**.
- Las imágenes se solicitan con `/low.webp` en la cuadrícula y `/high.webp` en el visor.

#### Precios de las cartas

`pricing` trae dos mercados, que se actualizan a diario:

- `cardmarket` en EUR: `trend`, `avg`, `low`, `avg30` y sus versiones `-holo`.
- `tcgplayer` en USD: un objeto por variante (`normal`, `holofoil`, `reverse-holofoil`, `1st-edition`…) con `lowPrice`, `midPrice`, `highPrice` y `marketPrice`.

Limitaciones comprobadas: TCGdex **no permite filtrar ni ordenar por precio**, el listado no incluye `pricing` y su GraphQL tampoco expone los precios. Por eso:

1. `getCardsWithPrices(dexId)` pide el listado y luego el detalle de cada carta, con **6 peticiones en paralelo como máximo**, e informa del progreso. Charizard, por ejemplo, son 110 cartas.
2. React Query guarda el resultado 6 h (`['cards-prices', id]`). Mientras tanto se muestran las cartas del listado con una barra de progreso de los precios.
3. `priceOf(card, currency)` calcula el precio de referencia, que es **el mayor entre las variantes**: `trend ?? avg` de la normal y de la holo en EUR, o `marketPrice ?? midPrice` en USD. Si no hay precio devuelve `null`.
4. Los filtros se aplican en el navegador: moneda (€ Cardmarket o $ TCGPlayer), rangos (`< 1`, `1–10`, `10–50`, `50+`, con el mínimo incluido y el máximo excluido), rareza, orden (precio de mayor a menor, de menor a mayor, o expansión A–Z) y "Solo con precio". Las cartas sin precio solo se muestran con el rango "Todos".

#### Snapshot de precios de todas las cartas (`public/cards.json`)

Para vistas de mercado con **todas** las cartas, como un ranking de las más caras o un filtro global por precio, no se consulta TCGdex desde el navegador, porque serían unas 22.000 peticiones. En su lugar:

- `npm run cards` ejecuta `scripts/build-cards.ts`: pide `/cards` y luego el detalle de cada carta con imagen (8 en paralelo, reintentos con espera creciente, sin reintentar los 404). Tarda entre 5 y 15 minutos (la primera ejecución completa: 21.987 cartas, 18.953 con precio y 0 fallidas en 320 s). El JSON pesa ~4,5 MB, unos 600 KB con gzip.
- Opciones: `npm run cards -- --limit 200` para una prueba rápida y `--concurrency 4` para bajar la carga.
- Salida: `{ generatedAt, count, cards: CardSnapshot[] }`, ordenada por precio en EUR de mayor a menor. Cada carta tiene `id, name, image, category, dexId, set {id,name}, rarity, eur, usd`, y los precios salen de `priceOf`, así que coinciden con los de la ficha.
- Si falla más del 5 % de las cartas, el script termina con código 1 para que el job quede en rojo.
- `.github/workflows/cards.yml` lo ejecuta a diario a las 06:00 UTC y hace commit del JSON si cambió (también se puede lanzar a mano con *Run workflow*). Solo funciona cuando el proyecto está en GitHub. Hoy la carpeta no es un repositorio git.
#### Página `/mercado` (`src/components/Market.tsx`)

- Carga `/cards.json` con `useQuery(['cards-snapshot'])` (`staleTime: Infinity`) y filtra las ~22.000 cartas en memoria. La búsqueda usa `useDeferredValue` para no bloquear la escritura.
- Arriba muestra el total de cartas, cuántas tienen precio, la fecha del snapshot y la carta más cara (que abre el visor).
- Filtros: nombre, moneda (€/$), rangos de `PRICE_RANGES`, categoría (Pokémon/Entrenador/Energía), rareza, expansión, orden (precio ↓/↑, nombre) y **"Solo precios en € y $"**, activado por defecto.
- Ese filtro existe porque las cartas que cotizan en un solo mercado suelen tener precios de ventas aisladas: sin él, el ranking lo encabezaban promos de Mewtwo a 5550 € sin precio en $. Si se desactiva, esas cartas llevan la marca "⚠ un mercado". Aun con ambos precios puede haber diferencias grandes entre mercados (Rocket's Mewtwo ex: 5167 € / 550 $).
- Se muestran 48 cartas y se añaden de 48 en 48 con "Ver más". Las 3 primeras llevan la medalla #1–#3 cuando se ordena por precio ↓ sin búsqueda ni rango.
- Cada carta abre `CardViewer` (con portal) y, si tiene `dexId`, enlaza a la ficha con "Pokédex #0006 →".
- **Ficha sobre el mercado:** `open()` en `App.tsx` pasa `state: { from: '/mercado' }` al navegar. Con ese estado, la ficha se pinta sobre el mercado (`inMarket`) y al cerrarla se vuelve a `/mercado` conservando la búsqueda y los filtros. Desde la Pokédex se sigue volviendo a `/`.
- Si `cards.json` no existe, la página muestra un error que indica ejecutar `npm run cards`.

Las dos APIs son públicas y no requieren clave.

## Experiencia visual

El nuevo diseño usa una dirección más editorial y menos efectos permanentes:

- Hero compacto con jerarquía clara.
- La mejor coincidencia de búsqueda se presenta como una tarjeta destacada y las demás se ordenan por relevancia.
- Las tarjetas usan color por tipo, marca de agua Pokéball, número de fondo, sombra de contacto, tilt 3D, brillo reactivo y datos adicionales en hover.
- Superficies oscuras, bordes discretos y color contextual por tipo.
- Animación escalonada de tarjetas y transición de layout al filtrar.
- Detalle presentado como una hoja completa con entrada/salida suave.
- Barras de estadísticas animadas al entrar en pantalla.
- Microinteracciones en tarjetas y cartas TCG.
- El visor TCG abre con una transición elástica e incluye inclinación 3D, brillo y efecto holográfico que siguen al mouse.
- El Pokémon de la ficha tiene entrada elástica, flotación continua, luz pulsante, órbitas y reacción al hover.
- Fondos ambientales estáticos en lugar de un canvas continuo de partículas.

La mayor parte del movimiento utiliza `transform` y `opacity`. Si el usuario activa reducción de movimiento en el sistema operativo, las animaciones se reducen prácticamente a cero.

## Navegación y accesibilidad

- `/` enfoca el buscador.
- `Escape` cierra el visor de carta o la ficha.
- Flechas izquierda/derecha navegan entre Pokémon desde la ficha.
- Filtros extra de la portada: "Incluir formas" (por defecto solo se muestran las 1025 especies, y las formas también aparecen al buscar por texto), "★ Legendarios" y "✦ Singulares". Se combinan con los de generación y tipo.
- Todos los elementos interactivos son botones o enlaces reales.
- Se incluyen estilos visibles de foco.
- El documento impide el scroll de fondo mientras el detalle está abierto.
- La interfaz se adapta a escritorio, tableta y móvil.

## Rendimiento

- La capa de API reutiliza promesas ya solicitadas mediante una caché en memoria. Encima, React Query cachea el índice y las cartas.
- **Cuadrícula virtualizada**: solo se montan las filas visibles más 3 de margen, entre 20 y 50 tarjetas en el DOM aunque haya 1302 resultados. Los cortes de columnas de `PokemonGrid.tsx` (`columnsFor`) deben coincidir con las media queries de `.pokemon-grid` en `styles.css`.
- Por la virtualización, las tarjetas ya no usan la animación `layout` de Motion y solo animan su entrada al montarse.
- Las imágenes usan carga diferida.
- La portada no hace peticiones por tarjeta, porque los tipos vienen en el índice GraphQL.
- Vite divide, transforma y comprime los recursos para producción.

## Despliegue

Publicada en **GitHub Pages**: https://elvicticor.github.io/Pokeverse/ (repo: https://github.com/elvicticor/Pokeverse).

- `.github/workflows/pages.yml` compila y publica con cada push a `main`. También lo hace con `workflow_run` al terminar "Actualizar precios de cartas", porque los commits hechos con `GITHUB_TOKEN` no disparan `push`, y sin eso el mercado no mostraría los precios nuevos. Se puede lanzar a mano (`workflow_dispatch`).
- **Subcarpeta:** Pages sirve la app en `/Pokeverse/`. `vite.config.ts` toma `base` de la variable `BASE_PATH` (por defecto `/`), `BrowserRouter` usa `basename={import.meta.env.BASE_URL}` y el mercado pide `${import.meta.env.BASE_URL}cards.json`.
- Reglas para que la app siga funcionando en la subcarpeta: nada de `href="/..."` ni `fetch('/...')` con rutas absolutas. Hay que usar `<Link>` o `navigate()` del router, y `import.meta.env.BASE_URL` para los archivos de `public/`.
- **Rutas al recargar:** el workflow copia `dist/index.html` a `dist/404.html`. Pages lo sirve en cualquier ruta desconocida (con estado 404) y React Router muestra la página correcta.
- **Probar en local como en Pages:** `MSYS_NO_PATHCONV=1 BASE_PATH=/Pokeverse/ npm run build`. En Git Bash de Windows, `MSYS_NO_PATHCONV=1` es obligatorio: sin él, `/Pokeverse/` se convierte en `C:/Program Files/Git/Pokeverse/` y la app queda en blanco.
- Otro hosting (Vercel, Netlify): compilar sin `BASE_PATH` y configurar un fallback de SPA hacia `index.html`.

## Detalles técnicos a recordar

- `.detail-overlay` tiene `backdrop-filter`, y eso hace que los hijos con `position: fixed` se posicionen respecto al overlay y no a la ventana. Por eso el visor de cartas se renderiza con `createPortal` en `document.body`. Cualquier modal nuevo dentro de la ficha debe usar un portal.
- `html { scroll-behavior: smooth }` afecta a `scrollTo`. En pruebas automáticas hay que usar `behavior: 'instant'`.
- Todas las cargas usan React Query (`useAsync` se eliminó). Claves usadas: `['pokemon-index']`, `['pokemon', nombre|id]`, `['species', url]`, `['abilities', urls]`, `['types', ...tipos]`, `['evolution', url]`, `['cards', id]`, `['cards-prices', id]` y `['card', id]`. La consulta de la especie depende de la del Pokémon (`enabled: !!speciesUrl`).
- Debajo de React Query, `fetchJSON` sigue cacheando promesas en memoria. Es redundante pero inofensivo, y lo usa el índice REST de respaldo.

## Constantes que deben mantenerse

- `MAX_SPECIES = 1025` en `src/data.ts`.
- Rangos de `GENS` al publicarse una nueva generación.
- Traducciones y colores de `TYPES`.
- Tipos de respuesta si PokéAPI o TCGdex cambian su contrato.
- `PRICE_RANGES` y `TCGPLAYER_VARIANTS` en `src/pricing.ts`.
- La clave `pokeverse:index:v1` de `localStorage` en `src/api.ts`.

## Posibles siguientes mejoras

- Favoritos persistentes con `localStorage`.
- Comparador de estadísticas.
- Tests con Vitest y Testing Library.
- Mercado: virtualizar la cuadrícula si se quieren mostrar miles de cartas a la vez, y guardar los filtros en la URL para poder compartirlos.
- Service worker para una experiencia instalable y caché offline.
- División dinámica del bundle del detalle si el proyecto crece.
