import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { MARKETS, PRICE_RANGES, formatPrice, type Currency } from '../pricing'
import { pad } from '../data'
import { CardViewer } from './CardCollection'
import type { CardSnapshot, CardsFile, TcgCard } from '../types'

type MarketSort = 'price-desc' | 'price-asc' | 'name'
const CATEGORIES: Record<string,string> = { Pokemon:'Pokémon', Trainer:'Entrenador', Energy:'Energía' }
const PAGE = 48
const symbol = (c:Currency) => c==='EUR'?'€':'$'
const priceIn = (c:CardSnapshot, currency:Currency) => currency==='EUR'?c.eur:c.usd
// Precio "fiable": la carta cotiza en los dos mercados. Evita que encabecen el ranking cartas con una sola venta rara.
const reliable = (c:CardSnapshot) => c.eur!=null && c.usd!=null

async function getSnapshot():Promise<CardsFile> {
  const r = await fetch('/cards.json')
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// Mercado: todas las cartas TCG con su precio, a partir del snapshot diario public/cards.json.
export default function Market({onOpenPokemon}:{onOpenPokemon:(id:number)=>void}) {
  const {data,isPending,isError,refetch}=useQuery({queryKey:['cards-snapshot'],queryFn:getSnapshot,staleTime:Infinity})
  const [query,setQuery]=useState(''),[currency,setCurrency]=useState<Currency>('EUR'),[range,setRange]=useState(0),[category,setCategory]=useState(''),[rarity,setRarity]=useState(''),[set,setSet]=useState(''),[sort,setSort]=useState<MarketSort>('price-desc'),[onlyReliable,setOnlyReliable]=useState(true),[limit,setLimit]=useState(PAGE)
  const [viewer,setViewer]=useState<TcgCard|null>(null)
  const deferredQuery=useDeferredValue(query)
  const cards=data?.cards
  const rarities=useMemo(()=>[...new Set(cards?.map(c=>c.rarity).filter((r):r is string=>!!r))].sort(),[cards])
  const sets=useMemo(()=>{const m=new Map<string,string>();cards?.forEach(c=>c.set&&m.set(c.set.id,c.set.name));return [...m].sort((a,b)=>a[1].localeCompare(b[1]))},[cards])
  const filtered=useMemo(()=>{
    if(!cards)return []
    const q=deferredQuery.trim().toLowerCase(),r=PRICE_RANGES[range]
    return cards.filter(c=>{
      const price=priceIn(c,currency)
      if(q&&!c.name.toLowerCase().includes(q))return false
      if(category&&c.category!==category)return false
      if(rarity&&c.rarity!==rarity)return false
      if(set&&c.set?.id!==set)return false
      if(onlyReliable&&!reliable(c))return false
      if(price==null)return range===0&&!onlyReliable
      return price>=r.min&&price<r.max
    }).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='price-asc'?(priceIn(a,currency)??Infinity)-(priceIn(b,currency)??Infinity):(priceIn(b,currency)??-1)-(priceIn(a,currency)??-1))
  },[cards,deferredQuery,currency,range,category,rarity,set,sort,onlyReliable])
  useEffect(()=>setLimit(PAGE),[deferredQuery,currency,range,category,rarity,set,sort,onlyReliable])
  useEffect(()=>{if(!viewer)return;const key=(e:KeyboardEvent)=>e.key==='Escape'&&setViewer(null);addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[viewer])
  const priced=useMemo(()=>cards?.filter(c=>c.eur!=null||c.usd!=null).length??0,[cards])
  const top=useMemo(()=>cards?.filter(reliable).reduce<CardSnapshot|null>((best,c)=>!best||(c.eur??0)>(best.eur??0)?c:best,null),[cards])
  const updated=data?new Date(data.generatedAt).toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'}):''
  const reset=()=>{setQuery('');setRange(0);setCategory('');setRarity('');setSet('');setOnlyReliable(false)}

  return <>
    <header className="hero market-hero">
      <div className="hero-copy">
        <motion.span className="overline" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>Mercado TCG</motion.span>
        <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.06}}>Precios de todas<br/><em>las cartas.</em></motion.h1>
        <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.12}}>Filtra y ordena cartas del juego de cartas coleccionables con precios de Cardmarket y TCGPlayer{updated&&<>, actualizados el {updated}</>}.</motion.p>
      </div>
      {data&&<div className="market-stats">
        <div><strong>{data.count.toLocaleString('es')}</strong><span>cartas</span></div>
        <div><strong>{priced.toLocaleString('es')}</strong><span>con precio</span></div>
        {top&&<button onClick={()=>setViewer(top)}><strong>{formatPrice(top.eur,'EUR')}</strong><span>la más cara: {top.name}</span></button>}
      </div>}
    </header>
    <main className="content">
      <div className="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca una carta por nombre (ej. charizard, professor)" aria-label="Buscar carta"/>
      </div>
      <div className="card-toolbar">
        <div className="segmented" role="group" aria-label="Moneda">{(['EUR','USD'] as Currency[]).map(c=><button key={c} className={currency===c?'active':''} aria-pressed={currency===c} onClick={()=>setCurrency(c)}>{symbol(c)} {MARKETS[c]}</button>)}</div>
        <div className="filter-row price-ranges" role="group" aria-label="Rango de precio">{PRICE_RANGES.map((r,i)=><button key={r.label} className={range===i?'active':''} onClick={()=>setRange(i)}>{i?`${r.label} ${symbol(currency)}`:r.label}</button>)}</div>
      </div>
      <div className="card-toolbar">
        <select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Categoría"><option value="">Todas las categorías</option>{Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <select value={rarity} onChange={e=>setRarity(e.target.value)} aria-label="Rareza"><option value="">Todas las rarezas</option>{rarities.map(r=><option key={r}>{r}</option>)}</select>
        <select value={set} onChange={e=>setSet(e.target.value)} aria-label="Expansión" className="set-select"><option value="">Todas las expansiones</option>{sets.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
        <select value={sort} onChange={e=>setSort(e.target.value as MarketSort)} aria-label="Ordenar"><option value="price-desc">Precio: mayor a menor</option><option value="price-asc">Precio: menor a mayor</option><option value="name">Nombre (A–Z)</option></select>
        <label className="check" title="Oculta cartas que solo cotizan en un mercado: suelen ser precios de ventas aisladas"><input type="checkbox" checked={onlyReliable} onChange={e=>setOnlyReliable(e.target.checked)}/>Solo precios en € y $</label>
      </div>
      <div className="results-head market-head"><div><span>Mercado PokéVerse</span><h2>{query?`Cartas “${query}”`:'Todas las cartas'}</h2></div><p>{filtered.length.toLocaleString('es')} resultados</p></div>
      {isPending?<div className="skeleton-grid">{Array.from({length:10},(_,i)=><i key={i}/>)}</div>
      :isError?<div className="error-card"><h2>No pudimos cargar los precios</h2><p>Falta <code>public/cards.json</code> o no se pudo descargar. Genéralo con <code>npm run cards</code>.</p><button onClick={()=>refetch()}>Reintentar</button></div>
      :!filtered.length?<div className="empty-state"><span>?</span><h2>No hay cartas con esos filtros</h2><p>Prueba otro rango de precio o quita algún filtro.</p><button className="load-more" onClick={reset}>Quitar filtros</button></div>
      :<>
        <div className="cards market-grid">{filtered.slice(0,limit).map((c,i)=>{const price=priceIn(c,currency),other=priceIn(c,currency==='EUR'?'USD':'EUR')
          return <motion.article key={c.id} className="market-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.35,delay:(i%PAGE)*.015}}>
            <button className="market-art" onClick={()=>setViewer(c)} aria-label={`Ver ${c.name}`}><img src={`${c.image}/low.webp`} alt={c.name} loading="lazy"/>{sort==='price-desc'&&!query&&i<3&&range===0&&<span className="rank">#{i+1}</span>}</button>
            <div className="market-meta">
              <div><b>{c.name}</b><small>{[c.set?.name,c.rarity].filter(Boolean).join(' · ')}</small></div>
              <p><strong className={price==null?'no-price':''}>{formatPrice(price,currency)}</strong>{other!=null&&<small>{formatPrice(other,currency==='EUR'?'USD':'EUR')}</small>}{!reliable(c)&&(c.eur!=null||c.usd!=null)&&<em title="Solo cotiza en un mercado">⚠ un mercado</em>}</p>
              {c.dexId?.[0]&&<button className="dex-link" onClick={()=>onOpenPokemon(c.dexId![0])}>Pokédex {pad(c.dexId[0])} →</button>}
            </div>
          </motion.article>})}</div>
        {limit<filtered.length&&<button className="load-more" onClick={()=>setLimit(x=>x+PAGE)}>Ver más cartas ({(filtered.length-limit).toLocaleString('es')})</button>}
      </>}
    </main>
    {createPortal(<AnimatePresence>{viewer&&<CardViewer card={viewer} onClose={()=>setViewer(null)}/>}</AnimatePresence>,document.body)}
  </>
}
