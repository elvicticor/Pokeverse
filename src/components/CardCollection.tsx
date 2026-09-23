import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { getCard, getCards, getCardsWithPrices } from '../api'
import { MARKETS, PRICE_RANGES, TCGPLAYER_VARIANTS, formatPrice, priceOf, tcgplayerVariants, type Currency, type PriceSort } from '../pricing'
import type { TcgCard } from '../types'

const SIX_HOURS = 6 * 60 * 60 * 1000
const symbol = (c:Currency) => c==='EUR'?'€':'$'

// Cartas TCG de una especie. Primero se muestra el listado (rápido) y en paralelo se cargan los precios carta por carta.
export default function CardCollection({id,onView}:{id:number;onView:(c:TcgCard)=>void}) {
  const [progress,setProgress]=useState<[number,number]>([0,0])
  const list=useQuery({queryKey:['cards',id],queryFn:()=>getCards(id)})
  const full=useQuery({queryKey:['cards-prices',id],queryFn:()=>getCardsWithPrices(id,(d,t)=>setProgress([d,t])),staleTime:SIX_HOURS})
  const [currency,setCurrency]=useState<Currency>('EUR'),[range,setRange]=useState(0),[rarity,setRarity]=useState(''),[sort,setSort]=useState<PriceSort>('price-desc'),[onlyPriced,setOnlyPriced]=useState(false),[limit,setLimit]=useState(12)
  const priced=!!full.data
  const cards=useMemo(()=>full.data??list.data?.filter(c=>c.image)??[],[full.data,list.data])
  const rarities=useMemo(()=>[...new Set(cards.map(c=>c.rarity).filter((r):r is string=>!!r))].sort(),[cards])
  const visible=useMemo(()=>{
    const r=PRICE_RANGES[range]
    return cards.map(c=>({c,price:priceOf(c,currency)}))
      .filter(({c,price})=>(!rarity||c.rarity===rarity)&&(price==null?!onlyPriced&&range===0:price>=r.min&&price<r.max))
      .sort((a,b)=>sort==='set'?(a.c.set?.name??'').localeCompare(b.c.set?.name??''):sort==='price-asc'?(a.price??Infinity)-(b.price??Infinity):(b.price??-1)-(a.price??-1))
  },[cards,currency,range,rarity,sort,onlyPriced])
  useEffect(()=>setLimit(12),[currency,range,rarity,sort,onlyPriced])

  return <section className="section">
    <div className="section-title"><span>Colección</span><h2>Cartas TCG</h2></div>
    {list.isError?<p className="muted">No se pudieron cargar las cartas ahora mismo.</p>:list.isPending?<div className="loading-line"/>:!cards.length?<p className="muted">No hay cartas registradas.</p>:<>
      <div className="card-toolbar">
        <div className="segmented" role="group" aria-label="Moneda">{(['EUR','USD'] as Currency[]).map(c=><button key={c} className={currency===c?'active':''} aria-pressed={currency===c} onClick={()=>setCurrency(c)}>{symbol(c)} {MARKETS[c]}</button>)}</div>
        <div className="filter-row price-ranges" role="group" aria-label="Rango de precio">{PRICE_RANGES.map((r,i)=><button key={r.label} className={range===i?'active':''} disabled={!priced} onClick={()=>setRange(i)}>{i?`${r.label} ${symbol(currency)}`:r.label}</button>)}</div>
        <select value={rarity} onChange={e=>setRarity(e.target.value)} aria-label="Rareza"><option value="">Todas las rarezas</option>{rarities.map(r=><option key={r}>{r}</option>)}</select>
        <select value={sort} onChange={e=>setSort(e.target.value as PriceSort)} aria-label="Ordenar" disabled={!priced}><option value="price-desc">Precio: mayor a menor</option><option value="price-asc">Precio: menor a mayor</option><option value="set">Expansión (A–Z)</option></select>
        <label className="check"><input type="checkbox" checked={onlyPriced} disabled={!priced} onChange={e=>setOnlyPriced(e.target.checked)}/>Solo con precio</label>
      </div>
      {!priced&&!full.isError&&<div className="price-progress"><span>Cargando precios… {progress[0]}/{progress[1]}</span><i><em style={{width:`${progress[1]?progress[0]/progress[1]*100:0}%`}}/></i></div>}
      {full.isError&&<p className="muted">No se pudieron cargar los precios; se muestran las cartas sin filtrar.</p>}
      <p className="muted cards-count">{visible.length} de {cards.length} cartas · precios de {MARKETS[currency]}</p>
      <div className="cards">{visible.slice(0,limit).map(({c,price})=><motion.button key={c.id} whileHover={{y:-8,rotate:1}} onClick={()=>onView(c)}>
        <img src={`${c.image}/low.webp`} alt={c.name} loading="lazy"/>
        <div className="card-meta"><span>{c.name}</span>{priced&&<b className={price==null?'no-price':''}>{formatPrice(price,currency)}</b>}</div>
      </motion.button>)}</div>
      {limit<visible.length&&<button className="load-more" onClick={()=>setLimit(x=>x+12)}>Ver más cartas ({visible.length-limit})</button>}
    </>}
  </section>
}

// Visor grande con el desglose de precios por mercado y variante.
export function CardViewer({card,onClose}:{card:TcgCard;onClose:()=>void}) {
  const {data=card}=useQuery({queryKey:['card',card.id],queryFn:()=>getCard(card.id),enabled:!card.pricing})
  const reduced=useReducedMotion()
  const pointerX=useMotionValue(.5),pointerY=useMotionValue(.5)
  const rotateX=useSpring(useTransform(pointerY,[0,1],[12,-12]),{stiffness:180,damping:22,mass:.55})
  const rotateY=useSpring(useTransform(pointerX,[0,1],[-14,14]),{stiffness:180,damping:22,mass:.55})
  const cm=data.pricing?.cardmarket,variants=tcgplayerVariants(data)
  const cmRows:[string,number|undefined][]=[['Tendencia',cm?.trend],['Promedio',cm?.avg],['Mínimo',cm?.low],['Media 30 días',cm?.avg30],['Tendencia holo',cm?.['trend-holo']],['Promedio holo',cm?.['avg-holo']]]
  const move=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(reduced||event.pointerType==='touch')return
    const rect=event.currentTarget.getBoundingClientRect()
    const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height
    pointerX.set(x);pointerY.set(y)
    event.currentTarget.style.setProperty('--holo-x',`${x*100}%`)
    event.currentTarget.style.setProperty('--holo-y',`${y*100}%`)
  }
  const reset=()=>{pointerX.set(.5);pointerY.set(.5)}
  return <motion.div className="card-viewer" onClick={onClose} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}}>
    <motion.div className="viewer-body" onClick={e=>e.stopPropagation()} initial={reduced?false:{scale:.72,y:70,rotateZ:-6,opacity:0}} animate={{scale:1,y:0,rotateZ:0,opacity:1}} exit={{scale:.84,y:35,opacity:0}} transition={{type:'spring',stiffness:210,damping:20,mass:.8}}>
      <div className="viewer-card-stage">
        <motion.div className="viewer-card-tilt" style={reduced?undefined:{rotateX,rotateY}} onPointerMove={move} onPointerLeave={reset}>
          <img src={`${data.image}/high.webp`} alt={data.name}/>
          <span className="viewer-holo" aria-hidden="true"/>
          <span className="viewer-glare" aria-hidden="true"/>
        </motion.div>
        <p>Mueve el mouse sobre la carta</p>
      </div>
      <aside className="viewer-info">
        <span className="eyebrow">{data.set?.name??'Carta TCG'}{data.localId?` · #${data.localId}`:''}</span>
        <h2>{data.name}</h2>
        <p className="muted">{[data.rarity,data.illustrator&&`Ilustración: ${data.illustrator}`].filter(Boolean).join(' · ')}</p>
        {!data.pricing?<div className="loading-line"/>:<>
          {cm&&cmRows.some(([,v])=>v)&&<div className="price-table"><h3>€ Cardmarket</h3>{cmRows.filter(([,v])=>v).map(([k,v])=><p key={k}><span>{k}</span><b>{formatPrice(v,'EUR')}</b></p>)}</div>}
          {variants.length>0&&<div className="price-table"><h3>$ TCGPlayer</h3>{variants.map(([k,v])=><p key={k}><span>{TCGPLAYER_VARIANTS[k]??k}</span><b>{formatPrice(v.marketPrice??v.midPrice,'USD')}</b></p>)}</div>}
          {!cm&&!variants.length&&<p className="muted">Sin precios registrados para esta carta.</p>}
        </>}
        <button className="load-more" onClick={onClose}>Cerrar</button>
      </aside>
    </motion.div>
  </motion.div>
}
