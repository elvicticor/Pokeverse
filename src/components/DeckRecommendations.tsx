import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { decksForCard, exportDeck, normalizeCardId } from '../decks'
import { getCard } from '../api'
import type { Deck, DeckEntry } from '../decks'
import './DeckRecommendations.css'

export default function DeckRecommendations({cardId,cardName}:{cardId:string;cardName:string}){
  const matches=decksForCard(cardId,cardName)
  return <section className="deck-recommendations" aria-label="Mazos y combinaciones">
    <span className="eyebrow">Juega esta carta</span>
    <h3>Mazos y combinaciones</h3>
    {!matches.length?<p className="deck-empty">Todavía no hay una lista revisada para esta carta o un arquetipo relacionado. Esto no significa que la carta no sea jugable. El catálogo inicial cubre tres mazos documentados y seguirá ampliándose.</p>:<>
      <p className="deck-notice">Listas competitivas documentadas de 2025–2026. Revisa el evento y la relación con la carta: la legalidad puede cambiar con cada rotación.</p>
      {matches.map(({deck,relation})=><DeckPanel key={deck.id} deck={deck} cardId={cardId} relation={relation}/>)}
    </>}
  </section>
}

function DeckPanel({deck,cardId,relation}:{deck:Deck;cardId:string;relation:'exact'|'related'}){
  const [status,setStatus]=useState('')
  const [open,setOpen]=useState(false)
  const text=exportDeck(deck)
  const copy=async()=>{
    try{await navigator.clipboard.writeText(text);setStatus('Lista copiada. Pégala en Importar mazo de TCG Live.')}
    catch{setStatus('No se pudo copiar automáticamente. Abre la lista de texto y cópiala manualmente.')}
  }
  const download=()=>{
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}))
    const link=document.createElement('a');link.href=url;link.download=`${deck.id}.txt`;link.click()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <details className="deck-panel" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><strong>{deck.name}</strong><span>60 cartas · {relation==='exact'?'La edición abierta está en la lista':'Arquetipo relacionado; usa otra carta o edición'} · Ver estrategia y lista</span></summary>
    {relation==='related'&&<p className="deck-related">La carta abierta no forma parte de estas 60 cartas. Se muestra porque pertenece al mismo arquetipo o comparte el nombre, pero no debe sustituirse automáticamente en la lista.</p>}
    <p className="deck-source">{deck.event} · Lista documentada<br/>Revisión de la fuente: 28/09/2026<br/><a href={deck.source} target="_blank" rel="noopener noreferrer">Consultar fuente de la lista ↗</a></p>
    <h4>Plan de juego</h4><p>{deck.strategy}</p>
    <h4>Combinaciones clave</h4>
    <p className="deck-caption">Guía de juego de PokéVerse basada en las cartas de la lista.</p>
    <ol>{deck.combos.map(combo=><li key={combo}>{combo}</li>)}</ol>
    <h4>Lista completa</h4>
    {(['Pokémon','Trainer','Energy'] as const).map(category=>{
      const group=deck.entries.filter(entry=>entry.category===category)
      return <div className="deck-group" key={category}><h5>{category==='Trainer'?'Entrenadores':category==='Energy'?'Energías':category} · {group.reduce((total,entry)=>total+entry.count,0)}</h5>
        <div className="deck-card-grid">{group.map(entry=><DeckCard key={entry.cardId} entry={entry} selected={normalizeCardId(entry.cardId)===normalizeCardId(cardId)} enabled={open}/>)}</div>
      </div>
    })}
    <div className="deck-actions"><button type="button" onClick={copy}>Copiar para TCG Live</button><button type="button" onClick={download}>Descargar .txt</button></div>
    <p role="status" className="deck-caption">{status}</p>
    <details><summary>Ver texto para importar</summary><textarea readOnly value={text} aria-label="Lista de mazo para importar" onFocus={event=>event.currentTarget.select()}/></details>
    <p className="deck-caption">TCG Live comprobará el formato y las cartas disponibles al importar. La exportación no convierte esta lista histórica en un mazo legal actual.</p>
  </details>
}

function DeckCard({entry,selected,enabled}:{entry:DeckEntry;selected:boolean;enabled:boolean}){
  const card=useQuery({queryKey:['card',entry.cardId],queryFn:()=>getCard(entry.cardId),enabled,staleTime:Infinity,retry:1})
  return <article className={`deck-card${selected?' deck-selected':''}`} title={`${entry.count} ${entry.name} · ${entry.set} ${entry.number}`}>
    <div className="deck-card-art">
      {card.data?.image?<img src={`${card.data.image}/low.webp`} alt={entry.name} loading="lazy"/>:<div className={`deck-card-placeholder${card.isError?' failed':''}`}>{card.isPending&&enabled?<i/>:<span>{entry.category==='Energy'?'⚡':'◈'}</span>}</div>}
      <b>{entry.count}×</b>
    </div>
    <span>{entry.name}<small>{entry.set} {entry.number}</small></span>
  </article>
}
