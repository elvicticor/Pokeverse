import { getEvolution } from '../api'
import { TYPES, artwork, idFromUrl, pad, pretty } from '../data'
import { useQuery } from '@tanstack/react-query'

type EvoDetail = {
  trigger?:{name:string}; min_level?:number|null; item?:{name:string}|null; held_item?:{name:string}|null
  min_happiness?:number|null; min_affection?:number|null; time_of_day?:string; gender?:number|null
  known_move?:{name:string}|null; known_move_type?:{name:string}|null; location?:{name:string}|null
  needs_overworld_rain?:boolean; turn_upside_down?:boolean; relative_physical_stats?:number|null
}
type EvoNode = { species:{name:string;url:string}; evolution_details:EvoDetail[]; evolves_to:EvoNode[] }

const ITEMS:Record<string,string>={'fire-stone':'Piedra Fuego','water-stone':'Piedra Agua','thunder-stone':'Piedra Trueno','leaf-stone':'Piedra Hoja','moon-stone':'Piedra Lunar','sun-stone':'Piedra Solar','shiny-stone':'Piedra Día','dusk-stone':'Piedra Noche','dawn-stone':'Piedra Alba','ice-stone':'Piedra Hielo','kings-rock':'Roca del Rey','metal-coat':'Revestimiento Metálico','dragon-scale':'Escama Dragón','up-grade':'Mejora','linking-cord':'Cordón Unión'}
const item=(name:string)=>ITEMS[name]??pretty(name)

// Texto de una forma de evolucionar ("Nivel 30 · Macho", "Usar Piedra Alba"…)
const describe=(d:EvoDetail)=>{
  const bits:string[]=[]
  if(d.min_level)bits.push(`Nivel ${d.min_level}`)
  if(d.item)bits.push(`Usar ${item(d.item.name)}`)
  if(d.trigger?.name==='trade')bits.push('Intercambio')
  if(d.held_item)bits.push(`Con ${item(d.held_item.name)}`)
  if(d.min_happiness)bits.push('Amistad')
  if(d.min_affection)bits.push('Afecto')
  if(d.known_move_type)bits.push(`Mov. ${TYPES[d.known_move_type.name]?.es??d.known_move_type.name}`)
  if(d.known_move)bits.push(`Sabiendo ${pretty(d.known_move.name)}`)
  if(d.location)bits.push(`En ${pretty(d.location.name)}`)
  if(d.time_of_day==='day')bits.push('De día')
  if(d.time_of_day==='night')bits.push('De noche')
  if(d.relative_physical_stats===1)bits.push('Ataque > Defensa')
  if(d.relative_physical_stats===-1)bits.push('Ataque < Defensa')
  if(d.relative_physical_stats===0)bits.push('Ataque = Defensa')
  if(d.gender===1)bits.push('Hembra')
  if(d.gender===2)bits.push('Macho')
  if(d.needs_overworld_rain)bits.push('Con lluvia')
  if(d.turn_upside_down)bits.push('Consola al revés')
  if(!bits.length&&d.trigger)bits.push(pretty(d.trigger.name))
  return bits.join(' · ')
}
// Una especie puede evolucionar de varias formas según el juego (p. ej. Leafeon): se muestran hasta 2 distintas.
const condition=(details:EvoDetail[])=>[...new Set(details.map(describe).filter(Boolean))].slice(0,2).join(' / ')

// La cadena se dibuja como árbol: cada especie seguida de sus evoluciones, y las ramas (Eevee, Wurmple, Ralts…) en paralelo.
export default function Evolution({url,current,onOpen}:{url:string;current:number;onOpen:(id:number)=>void}) {
  const {data,isPending:loading}=useQuery({queryKey:['evolution',url],queryFn:()=>getEvolution(url)}); if(loading)return <div className="loading-line"/>;if(!data)return <p className="muted">Sin datos de evolución.</p>
  const chain=data.chain as EvoNode
  const node=(n:EvoNode)=>{const id=idFromUrl(n.species.url),kids=n.evolves_to
    return <div className={`evo-node${kids.length>2?' evo-many':''}`}>
      <button className={`evo-card${id===current?' current':''}`} onClick={()=>onOpen(id)} aria-current={id===current||undefined}><img src={artwork(id)} alt="" loading="lazy"/><b>{pretty(n.species.name)}</b><small>{pad(id)}</small></button>
      {kids.length>0&&<div className="evo-children">{kids.map(k=><div className="evo-branch" key={k.species.name}>
        <div className="evo-link"><span aria-hidden="true">→</span><small>{condition(k.evolution_details)}</small></div>{node(k)}
      </div>)}</div>}
    </div>}
  return <div className="evo-tree">{node(chain)}{!chain.evolves_to.length&&<p className="muted evo-none">Este Pokémon no evoluciona.</p>}</div>
}
