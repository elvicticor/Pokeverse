import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllPokemon, getTypeIds } from './api'
import { GENS, MAX_SPECIES, TYPES } from './data'
import PokemonDetail from './components/PokemonDetail'
import PokemonGrid from './components/PokemonGrid'
import SearchFilters, { type Special } from './components/SearchFilters'
import Market from './components/Market'

export default function App(){
  const navigate=useNavigate(),location=useLocation();const match=location.pathname.match(/^\/pokemon\/(.+)$/)
  // La ficha se abre encima de la página de origen: si viene del mercado, el mercado sigue debajo y al cerrar se vuelve a él.
  const from=(location.state as {from?:string}|null)?.from,inMarket=location.pathname==='/mercado'||(!!match&&from==='/mercado')
  const {data:items=[],isPending:loading,isError:error,refetch}=useQuery({queryKey:['pokemon-index'],queryFn:getAllPokemon,staleTime:Infinity})
  const [query,setQuery]=useState(''),[gen,setGen]=useState(0),[type,setType]=useState(''),[forms,setForms]=useState(false),[special,setSpecial]=useState<Special>('')
  // Si el índice vino del respaldo REST no trae tipos: el filtro por tipo usa /type/{tipo}
  const hasTypes=items.some(p=>p.types.length)
  const [typeIds,setTypeIds]=useState<Set<number>|null>(null)
  useEffect(()=>{let active=true;setTypeIds(null);if(type&&!hasTypes)getTypeIds(type).then(x=>active&&setTypeIds(x));return()=>{active=false}},[type,hasTypes])
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();const result=items.filter(p=>{
    if(!forms&&!q&&p.id>MAX_SPECIES)return false
    if(q&&!p.search.includes(q)&&String(p.id)!==q.replace(/^#?0*/,''))return false
    if(gen&&p.gen!==gen)return false
    if(type&&(hasTypes?!p.types.includes(type):!typeIds?.has(p.id)))return false
    if(special==='legendary'&&!p.legendary)return false
    if(special==='mythical'&&!p.mythical)return false
    return true});if(q)result.sort((a,b)=>{const score=(pokemon:typeof a)=>pokemon.search===q?0:pokemon.search.startsWith(q)?1:pokemon.search.split(' ').some(word=>word.startsWith(q))?2:3;return score(a)-score(b)||a.id-b.id});return result},[items,query,gen,type,forms,special,hasTypes,typeIds])
  const title=query?`Resultados para “${query}”`:[gen&&`Generación ${GENS.find(g=>g.n===gen)?.roman}`,type&&`Tipo ${TYPES[type]?.es??type}`,special==='legendary'&&'Legendarios',special==='mythical'&&'Singulares'].filter(Boolean).join(' · ')||(forms?'Todos los Pokémon y sus formas':'Todos los Pokémon')
  const open=(key:string|number)=>navigate(`/pokemon/${key}`,{state:inMarket?{from:'/mercado'}:undefined})
  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <nav className="navbar"><a className="brand" href="/" onClick={e=>{e.preventDefault();navigate('/')}}><span className="brand-mark"><i/></span><b>PokéVerse</b></a><span className="nav-label">Pokédex nacional</span><div className="nav-links"><a href="/" className={inMarket?'':'active'} onClick={e=>{e.preventDefault();navigate('/')}}>Pokédex</a><a href="/mercado" className={inMarket?'active':''} onClick={e=>{e.preventDefault();navigate('/mercado')}}>Mercado</a></div><button className="nav-random" onClick={()=>open(1+Math.floor(Math.random()*MAX_SPECIES))}>Descubrir uno <span>↗</span></button></nav>
    {inMarket?<Market onOpenPokemon={open}/>:<>
    <header className="hero"><div className="hero-copy"><motion.span className="overline" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>Explora · descubre · colecciona</motion.span><motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.06}}>Todo el mundo Pokémon,<br/><em>en un solo lugar.</em></motion.h1><motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.12}}>Una Pokédex interactiva para conocer especies, estadísticas, evoluciones y cartas de cada generación.</motion.p></div><div className="hero-stat"><strong>{(items.length||MAX_SPECIES).toLocaleString('es')}</strong><span>Pokémon<br/>y formas</span></div></header>
    <main className="content"><SearchFilters items={items} query={query} setQuery={setQuery} gen={gen} setGen={setGen} type={type} setType={setType} forms={forms} setForms={setForms} special={special} setSpecial={setSpecial} onOpen={open}/><div className="results-head"><div><span>Archivo PokéVerse</span><h2>{title}</h2></div><p>{filtered.length.toLocaleString('es')} resultados</p></div>
      {loading?<div className="skeleton-grid">{Array.from({length:10},(_,i)=><i key={i}/>)}</div>:error?<div className="error-card"><h2>No pudimos cargar la Pokédex</h2><p>Comprueba tu conexión e inténtalo otra vez.</p><button onClick={()=>refetch()}>Reintentar</button></div>:<PokemonGrid items={filtered} query={query} onOpen={open}/>}
      {!loading&&!error&&!filtered.length&&<div className="empty-state"><span>?</span><h2>No encontramos coincidencias</h2><p>Prueba otro nombre, número o combinación de filtros.</p></div>}
    </main>
    </>}
    <footer><a className="brand" href="/"><span className="brand-mark"><i/></span><b>PokéVerse</b></a><p>Datos de PokéAPI y TCGdex · Pokémon © Nintendo / Game Freak</p></footer>
    <AnimatePresence>{match&&<PokemonDetail key={match[1]} pokemonKey={decodeURIComponent(match[1])} onClose={()=>navigate(from==='/mercado'?'/mercado':'/')} onOpen={open}/>}</AnimatePresence>
  </div>
}
