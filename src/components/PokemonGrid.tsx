import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import PokemonCard from './PokemonCard'
import type { IndexPokemon } from '../types'

const columnsFor = (width:number) => width<=780 ? 2 : width<=1050 ? 4 : 5

export default function PokemonGrid({items,onOpen,query}:{items:IndexPokemon[];onOpen:(name:string)=>void;query:string}) {
  const ref=useRef<HTMLDivElement>(null)
  const [cols,setCols]=useState(()=>columnsFor(innerWidth)),[offset,setOffset]=useState(0)
  useEffect(()=>{const resize=()=>setCols(columnsFor(innerWidth));addEventListener('resize',resize);return()=>removeEventListener('resize',resize)},[])
  useLayoutEffect(()=>{if(ref.current)setOffset(ref.current.getBoundingClientRect().top+scrollY)},[query])
  const featured=!!query&&items.length>0,gridItems=featured?items.slice(1):items
  const rows=Math.ceil(gridItems.length/cols)
  const virtualizer=useWindowVirtualizer({count:rows,estimateSize:()=>cols===2?245:290,overscan:3,scrollMargin:offset})
  useEffect(()=>{virtualizer.measure()},[cols,virtualizer])
  return <>
    {featured&&<div className="featured-result"><PokemonCard pokemon={items[0]} index={0} featured query={query} onOpen={()=>onOpen(items[0].name)}/><div className="featured-note"><span>Mejor coincidencia</span><p>El resultado más relevante para tu búsqueda.</p></div></div>}
    <div ref={ref} className="pokemon-grid-virtual" style={{height:virtualizer.getTotalSize()}}>
      {virtualizer.getVirtualItems().map(row=><div key={row.key} data-index={row.index} ref={virtualizer.measureElement} className="pokemon-row" style={{transform:`translateY(${row.start-virtualizer.options.scrollMargin}px)`,gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}}>
        {gridItems.slice(row.index*cols,row.index*cols+cols).map((pokemon,index)=><PokemonCard key={pokemon.id} pokemon={pokemon} index={index} query={query} onOpen={()=>onOpen(pokemon.name)}/>)}</div>)}
    </div>
  </>
}
