import { useEffect, useMemo, useRef, useState } from 'react'
import { GENS, MAX_SPECIES, TYPES, pad, pretty, sprite } from '../data'
import type { IndexPokemon } from '../types'

export type Special=''|'legendary'|'mythical'
type Props={items:IndexPokemon[];query:string;setQuery:(v:string)=>void;gen:number;setGen:(v:number)=>void;type:string;setType:(v:string)=>void;forms:boolean;setForms:(v:boolean)=>void;special:Special;setSpecial:(v:Special)=>void;onOpen:(name:string)=>void}
export default function SearchFilters(p:Props) {
  const [focus,setFocus]=useState(false); const input=useRef<HTMLInputElement>(null)
  const resetAll=()=>{p.setQuery('');p.setGen(0);p.setType('');p.setForms(false);p.setSpecial('');setFocus(false);input.current?.blur()}
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==='/'&&document.activeElement!==input.current){e.preventDefault();input.current?.focus()}};addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn)},[])
  const suggestions=useMemo(()=>{const q=p.query.trim().toLowerCase();if(!q)return[];return p.items.filter(x=>x.search.includes(q)||String(x.id)===q.replace(/^#?0*/,'' )).slice(0,6)},[p.items,p.query])
  return <>
    <div className="search-box">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input ref={input} value={p.query} onChange={e=>p.setQuery(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>setTimeout(()=>setFocus(false),150)} placeholder="Busca por nombre o número" aria-label="Buscar Pokémon"/>
      <kbd>/</kbd>
      {focus&&p.query&&<div className="suggestions">{suggestions.length?suggestions.map(x=><button key={x.id} onMouseDown={()=>p.onOpen(x.name)}><img src={sprite(x.id)} alt=""/><span>{pretty(x.name)}</span><small>{x.id<=MAX_SPECIES?pad(x.id):'forma'}</small></button>):<p>Sin coincidencias</p>}</div>}
    </div>
    <div className="filters" aria-label="Filtros">
      <div className="filter-row"><button className={!p.gen&&!p.query&&!p.type&&!p.forms&&!p.special?'active':''} onClick={resetAll} aria-label="Mostrar todos los Pokémon y limpiar filtros">Todas</button>{GENS.map(g=><button key={g.n} className={p.gen===g.n?'active':''} onClick={()=>p.setGen(g.n)}>Gen {g.roman}<span>{g.region}</span></button>)}</div>
      <div className="filter-row extra-filters"><button className={p.forms?'active':''} aria-pressed={p.forms} onClick={()=>p.setForms(!p.forms)}>{p.forms?'✓ ':''}Incluir formas<span>Mega · Gmax · regionales</span></button><button className={p.special==='legendary'?'active':''} onClick={()=>p.setSpecial(p.special==='legendary'?'':'legendary')}>★ Legendarios</button><button className={p.special==='mythical'?'active':''} onClick={()=>p.setSpecial(p.special==='mythical'?'':'mythical')}>✦ Singulares</button></div>
      <div className="filter-row type-filters">{Object.entries(TYPES).map(([key,v])=><button key={key} className={p.type===key?'active':''} style={{'--type':v.color} as React.CSSProperties} onClick={()=>p.setType(p.type===key?'':key)}><i/>{v.es}</button>)}</div>
    </div>
  </>
}
