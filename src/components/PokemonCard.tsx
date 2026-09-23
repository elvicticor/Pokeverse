import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { getPokemon } from '../api'
import { GENS, TYPES, artwork, pad, pretty } from '../data'
import type { IndexPokemon } from '../types'

export function TypeBadge({type}:{type:string}) {
  const item=TYPES[type] ?? {es:type,color:'#718096'}
  return <span className="type" style={{'--type':item.color} as React.CSSProperties}>{item.es}</span>
}

export default function PokemonCard({pokemon,onOpen,index,featured=false,query=''}:{pokemon:IndexPokemon;onOpen:()=>void;index:number;featured?:boolean;query?:string}) {
  const reduced=useReducedMotion()
  const {data}=useQuery({queryKey:['pokemon',String(pokemon.id)],queryFn:()=>getPokemon(pokemon.id),enabled:!pokemon.types.length||featured})
  const types=pokemon.types.length?pokemon.types:data?.types.map(type=>type.type.name) ?? []
  const color=TYPES[types[0]]?.color ?? '#718096',secondColor=TYPES[types[1]]?.color ?? color
  const gen=GENS.find(item=>item.n===pokemon.gen)
  const pointerX=useMotionValue(.5),pointerY=useMotionValue(.5)
  const rotateX=useSpring(useTransform(pointerY,[0,1],[5,-5]),{stiffness:230,damping:25})
  const rotateY=useSpring(useTransform(pointerX,[0,1],[-6,6]),{stiffness:230,damping:25})
  const move=(event:React.PointerEvent<HTMLButtonElement>)=>{
    if(reduced||event.pointerType==='touch')return
    const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height
    pointerX.set(x);pointerY.set(y)
    event.currentTarget.style.setProperty('--pointer-x',`${x*100}%`)
    event.currentTarget.style.setProperty('--pointer-y',`${y*100}%`)
  }
  const reset=()=>{pointerX.set(.5);pointerY.set(.5)}
  const label=pretty(pokemon.name),needle=query.trim().toLowerCase(),matchAt=needle?label.toLowerCase().indexOf(needle):-1
  return <motion.button className={`pokemon-card${featured?' featured':''}`}
    style={{'--card-accent':color,'--card-accent-2':secondColor,...(!reduced?{rotateX,rotateY,transformPerspective:900}:{})} as React.CSSProperties}
    onClick={onOpen} initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}}
    transition={{duration:.4,delay:Math.min(index,10)*.025}} whileHover={reduced?undefined:{y:-7}}
    onPointerMove={move} onPointerLeave={reset}>
    <span className="card-pokeball" aria-hidden="true"/><span className="card-shine" aria-hidden="true"/>
    <span className="card-dex" aria-hidden="true">{String(pokemon.id).padStart(3,'0')}</span>
    <div className="card-top"><span>{pokemon.id<=1025?pad(pokemon.id):'FORMA'}</span><span>GEN {gen?.roman ?? '·'}</span></div>
    <div className="pokemon-art"><span className="art-orbit"/><img src={artwork(pokemon.id)} alt={label} loading="lazy"/><span className="pokemon-shadow"/></div>
    <div className="card-copy"><h3>{matchAt<0?label:<>{label.slice(0,matchAt)}<mark>{label.slice(matchAt,matchAt+needle.length)}</mark>{label.slice(matchAt+needle.length)}</>}</h3><div className="type-row">{types.map(type=><TypeBadge key={type} type={type}/>)}</div></div>
    {data&&<div className="card-details"><span><small>Altura</small>{data.height/10} m</span><span><small>Peso</small>{data.weight/10} kg</span><b>Explorar <i>↗</i></b></div>}
  </motion.button>
}
