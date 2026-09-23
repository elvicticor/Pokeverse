import { API, GQL, GENS, MAX_SPECIES, TCG, idFromUrl } from './data'
import type { IndexPokemon, Pokemon, Species, TcgCard } from './types'

const cache = new Map<string, Promise<unknown>>()
export function fetchJSON<T>(url:string, signal?:AbortSignal):Promise<T> {
  if (signal) return fetch(url,{signal}).then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
  if (!cache.has(url)) {
    const request = fetch(url).then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    request.catch(() => cache.delete(url)); cache.set(url,request)
  }
  return cache.get(url) as Promise<T>
}

// Índice REST: solo nombre + id. Se usa como respaldo si falla GraphQL (los tipos se cargan por tarjeta).
export async function getIndex():Promise<IndexPokemon[]> {
  const data = await fetchJSON<{results:{name:string;url:string}[]}>(`${API}/pokemon?limit=2000`)
  return data.results.map(p => {
    const id = idFromUrl(p.url)
    return { id, name:p.name, search:p.name.replaceAll('-',' '), types:[], gen:GENS.find(g => id>=g.from && id<=g.to)?.n ?? 0,
      isDefault:id<=MAX_SPECIES, legendary:false, mythical:false }
  })
}

// Índice completo (especies + formas) con tipos, generación y rareza en UNA sola llamada.
// Se guarda 24 h en localStorage porque el endpoint GraphQL de PokéAPI es beta y tiene límite de uso.
const INDEX_KEY = 'pokeverse:index:v1', DAY = 864e5
type GqlPokemon = {
  id:number; name:string; is_default:boolean
  pokemon_v2_pokemonspecy:{ generation_id:number; is_legendary:boolean; is_mythical:boolean }
  pokemon_v2_pokemontypes:{ pokemon_v2_type:{ name:string } }[]
}
export async function getAllPokemon():Promise<IndexPokemon[]> {
  try { const saved = JSON.parse(localStorage.getItem(INDEX_KEY) ?? 'null'); if (saved && Date.now()-saved.at < DAY) return saved.items } catch { /* sin caché */ }
  try {
    const query = `{ pokemon_v2_pokemon(limit: 3000, order_by: {id: asc}) { id name is_default
      pokemon_v2_pokemonspecy { generation_id is_legendary is_mythical }
      pokemon_v2_pokemontypes(order_by: {slot: asc}) { pokemon_v2_type { name } } } }`
    const r = await fetch(GQL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})})
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { data } = await r.json() as { data:{ pokemon_v2_pokemon:GqlPokemon[] } }
    const items:IndexPokemon[] = data.pokemon_v2_pokemon.map(p => ({
      id:p.id, name:p.name, search:p.name.replaceAll('-',' '), isDefault:p.is_default,
      gen:p.pokemon_v2_pokemonspecy.generation_id,
      legendary:p.pokemon_v2_pokemonspecy.is_legendary, mythical:p.pokemon_v2_pokemonspecy.is_mythical,
      types:p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
    }))
    try { localStorage.setItem(INDEX_KEY, JSON.stringify({at:Date.now(),items})) } catch { /* almacenamiento lleno o bloqueado */ }
    return items
  } catch {
    return getIndex()
  }
}

export const getPokemon = (key:string|number) => fetchJSON<Pokemon>(`${API}/pokemon/${String(key).toLowerCase()}`)
export const getSpecies = (url:string) => fetchJSON<Species>(url)
export const getTypeIds = async (type:string) => {
  const data = await fetchJSON<{pokemon:{pokemon:{url:string}}[]}>(`${API}/type/${type}`)
  return new Set(data.pokemon.map(p => idFromUrl(p.pokemon.url)))
}
export const getEvolution = (url:string) => fetchJSON<any>(url)
export const getCards = (id:number) => fetchJSON<TcgCard[]>(`${TCG}/cards?dexId=eq:${id}`)
export const getCard = (id:string) => fetchJSON<TcgCard>(`${TCG}/cards/${id}`)
export const getAbility = (url:string) => fetchJSON<any>(url)
export const getType = (name:string) => fetchJSON<any>(`${API}/type/${name}`)

// El listado de TCGdex no trae precios: se pide el detalle de cada carta con 6 peticiones en paralelo como máximo.
export async function getCardsWithPrices(dexId:number, onProgress?:(done:number,total:number)=>void):Promise<TcgCard[]> {
  const list = (await getCards(dexId)).filter(c => c.image)
  const out:TcgCard[] = new Array(list.length); let next = 0, done = 0
  onProgress?.(0,list.length)
  const worker = async () => {
    while (next < list.length) {
      const i = next++
      try { out[i] = await getCard(list[i].id) } catch { out[i] = list[i] }
      onProgress?.(++done,list.length)
    }
  }
  await Promise.all(Array.from({length:Math.min(6,list.length)},worker))
  return out
}
