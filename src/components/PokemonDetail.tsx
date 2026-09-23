import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { getAbility, getPokemon, getSpecies, getType } from '../api'
import { GENS, MAX_SPECIES, STATS, TYPES, artwork, pad, pretty } from '../data'
import { TypeBadge } from './PokemonCard'
import Evolution from './Evolution'
import CardCollection, { CardViewer } from './CardCollection'
import type { TcgCard } from '../types'

const language=(items:any[],field:string)=>items?.find(x=>x.language.name==='es')?.[field]??items?.find(x=>x.language.name==='en')?.[field]??''
export default function PokemonDetail({pokemonKey,onClose,onOpen}:{pokemonKey:string;onClose:()=>void;onOpen:(key:string|number)=>void}) {
  const reduced=useReducedMotion();const [shiny,setShiny]=useState(false);const [viewer,setViewer]=useState<TcgCard|null>(null)
  const pokemon=useQuery({queryKey:['pokemon',pokemonKey.toLowerCase()],queryFn:()=>getPokemon(pokemonKey)})
  const speciesUrl=pokemon.data?.species.url
  const species=useQuery({queryKey:['species',speciesUrl],queryFn:()=>getSpecies(speciesUrl!),enabled:!!speciesUrl})
  useEffect(()=>{setShiny(false);document.body.classList.add('locked');return()=>document.body.classList.remove('locked')},[pokemonKey])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')viewer?setViewer(null):onClose();if(!viewer&&e.key==='ArrowLeft'&&(species.data?.id??1)!==1)onOpen((species.data?.id??2)-1);if(!viewer&&e.key==='ArrowRight'&&(species.data?.id??MAX_SPECIES)<MAX_SPECIES)onOpen((species.data?.id??0)+1)};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[viewer,species.data?.id,onClose,onOpen])
  if(pokemon.isError||species.isError)return <div className="detail-overlay"><div className="error-card"><h2>No encontramos ese Pokémon</h2><button onClick={onClose}>Volver</button></div></div>
  if(!pokemon.data||!species.data)return <motion.div className="detail-overlay" initial={{opacity:0}} animate={{opacity:1}}><div className="detail-loader"><span/>Buscando en la hierba alta…</div></motion.div>
  const p=pokemon.data,s=species.data,types=p.types.map(x=>x.type.name),accent=TYPES[types[0]]?.color??'#ff4d57'
  const name=language(s.names,'name')||pretty(p.name);const flavor=language(s.flavor_text_entries,'flavor_text').replace(/[\f\n\r]+/g,' ')
  const genus=language(s.genera,'genus');const gen=GENS.find(g=>s.id>=g.from&&s.id<=g.to);const total=p.stats.reduce((a,x)=>a+x.base_stat,0)
  const cry=p.cries?.latest||p.cries?.legacy;const art=p.sprites.other?.['official-artwork'];
  return <motion.div className="detail-overlay" style={{'--accent':accent} as React.CSSProperties} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <motion.div className="detail-sheet" initial={reduced?false:{y:'6%',scale:.98}} animate={{y:0,scale:1}} exit={{y:'4%',opacity:0}} transition={{duration:.45,ease:[.16,1,.3,1]}}>
      <header className="detail-nav"><button className="circle-button" onClick={onClose} aria-label="Cerrar">←</button><div><button disabled={s.id===1} onClick={()=>onOpen(s.id-1)}>← Anterior</button><button disabled={s.id===MAX_SPECIES} onClick={()=>onOpen(s.id+1)}>Siguiente →</button></div></header>
      <main className="detail-content">
        <section className="detail-hero">
          <div className="detail-art">
            <span className="detail-number">{String(s.id).padStart(3,'0')}</span>
            <span className="detail-glow"/>
            <span className="detail-orbit orbit-one"/><span className="detail-orbit orbit-two"/>
            <span className="detail-spark spark-one">✦</span><span className="detail-spark spark-two">✧</span><span className="detail-spark spark-three">✦</span>
            <motion.div className="pokemon-enter" key={String(shiny)} initial={reduced?false:{opacity:0,scale:.62,rotate:-8,y:35}} animate={{opacity:1,scale:1,rotate:0,y:0}} transition={{type:'spring',stiffness:135,damping:15,mass:.9}}>
              <motion.img className="pokemon-alive" animate={reduced?undefined:{y:[-7,9,-7],rotate:[-1.2,1.2,-1.2]}} transition={{duration:5.4,repeat:Infinity,ease:'easeInOut'}} whileHover={reduced?undefined:{scale:1.07,y:-12}} src={shiny&&art?.front_shiny?art.front_shiny:art?.front_default||artwork(p.id)} alt={name}/>
            </motion.div>
          </div>
          <div className="detail-copy"><span className="eyebrow">{pad(s.id)} · {gen?`${gen.region}, Gen ${gen.roman}`:'Forma especial'}</span><h1>{name}</h1><p className="genus">{genus}</p><div className="type-row">{types.map(t=><TypeBadge key={t} type={t}/>) }{s.is_legendary&&<span className="rare">★ Legendario</span>}{s.is_mythical&&<span className="rare">✦ Singular</span>}</div><p className="flavor">{flavor}</p>
            <div className="facts"><div><small>Altura</small><b>{p.height/10} m</b></div><div><small>Peso</small><b>{p.weight/10} kg</b></div><div><small>Experiencia base</small><b>{p.base_experience??'—'}</b></div><div><small>Captura</small><b>{s.capture_rate}</b></div></div>
            <div className="detail-actions">{cry&&<button onClick={()=>new Audio(cry).play()}>▶ Escuchar grito</button>}{art?.front_shiny&&<button onClick={()=>setShiny(v=>!v)}>✦ {shiny?'Versión normal':'Versión shiny'}</button>}</div>
          </div>
        </section>
        <section className="detail-grid"><div><SectionTitle eyebrow="Combate">Estadísticas base</SectionTitle><div className="panel stats">{p.stats.map(x=><div className="stat" key={x.stat.name}><span>{STATS[x.stat.name]}</span><b>{x.base_stat}</b><i><motion.em initial={{width:0}} whileInView={{width:`${Math.min(100,x.base_stat/2)}%`}} viewport={{once:true}} transition={{duration:.8}}/></i></div>)}<div className="stat total"><span>Total</span><b>{total}</b></div></div></div><Abilities list={p.abilities}/></section>
        <Effectiveness types={types}/>
        {s.evolution_chain&&<section className="section"><SectionTitle eyebrow="Descendencia">Línea evolutiva</SectionTitle><Evolution url={s.evolution_chain.url} current={s.id} onOpen={onOpen}/></section>}
        <CardCollection id={s.id} onView={setViewer}/>
      </main>
    </motion.div>
    {/* Portal: el backdrop-filter de .detail-overlay rompe position:fixed de sus hijos */}
    {createPortal(<AnimatePresence>{viewer&&<CardViewer card={viewer} onClose={()=>setViewer(null)}/>}</AnimatePresence>,document.body)}
  </motion.div>
}
function SectionTitle({eyebrow,children}:{eyebrow:string;children:React.ReactNode}){return <div className="section-title"><span>{eyebrow}</span><h2>{children}</h2></div>}
function Abilities({list}:{list:any[]}){const {data}=useQuery({queryKey:['abilities',list.map(x=>x.ability.url+(x.is_hidden?'#h':'')).join()],queryFn:()=>Promise.all(list.map(async a=>{const d=await getAbility(a.ability.url);return{name:language(d.names,'name')||pretty(a.ability.name),text:language(d.flavor_text_entries,'flavor_text'),hidden:a.is_hidden}}))});return <div><SectionTitle eyebrow="Talentos">Habilidades</SectionTitle><div className="panel abilities">{data?.map((a:any)=><article key={a.name}><h3>{a.name}{a.hidden&&<small>Oculta</small>}</h3><p>{a.text}</p></article>)??<div className="loading-line"/>}</div></div>}
function Effectiveness({types}:{types:string[]}){const {data}=useQuery({queryKey:['types',...types],queryFn:()=>Promise.all(types.map(getType))});const groups=useMemo(()=>{if(!data)return[];const mult:Record<string,number>=Object.fromEntries(Object.keys(TYPES).map(t=>[t,1]));data.forEach((r:any)=>{r.damage_relations.double_damage_from.forEach((t:any)=>mult[t.name]*=2);r.damage_relations.half_damage_from.forEach((t:any)=>mult[t.name]*=.5);r.damage_relations.no_damage_from.forEach((t:any)=>mult[t.name]=0)});return [['Débil',2],['Muy débil',4],['Resistente',.5],['Muy resistente',.25],['Inmune',0]].map(([label,n])=>({label,n,types:Object.keys(mult).filter(t=>mult[t]===n)})).filter(g=>g.types.length)},[data]);return <section className="section"><SectionTitle eyebrow="Afinidad">Debilidades y resistencias</SectionTitle><div className="panel effectiveness">{groups.map((g:any)=><div key={g.label}><small>{g.label} · ×{g.n}</small><div className="type-row">{g.types.map((t:string)=><TypeBadge key={t} type={t}/>)}</div></div>)}</div></section>}
