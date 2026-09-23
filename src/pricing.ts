import type { TcgCard, TcgplayerVariant } from './types'

export type Currency = 'EUR' | 'USD'
export type PriceSort = 'price-desc' | 'price-asc' | 'set'

export const MARKETS: Record<Currency, string> = { EUR:'Cardmarket', USD:'TCGPlayer' }

export const PRICE_RANGES:{ label:string; min:number; max:number }[] = [
  { label:'Todos', min:0, max:Infinity },
  { label:'< 1', min:0, max:1 },
  { label:'1 – 10', min:1, max:10 },
  { label:'10 – 50', min:10, max:50 },
  { label:'50+', min:50, max:Infinity },
]

export const TCGPLAYER_VARIANTS: Record<string,string> = {
  normal:'Normal', holofoil:'Holo', 'reverse-holofoil':'Reverse holo',
  '1st-edition':'1ª edición', '1st-edition-holofoil':'1ª edición holo', unlimited:'Unlimited', 'unlimited-holofoil':'Unlimited holo',
}

const positive = (values:(number|undefined)[]) => values.filter((n):n is number => typeof n === 'number' && n > 0)

export function tcgplayerVariants(card:TcgCard):[string,TcgplayerVariant][] {
  const tp = card.pricing?.tcgplayer
  if (!tp) return []
  return Object.entries(tp).filter((e):e is [string,TcgplayerVariant] => typeof e[1] === 'object' && e[1] !== null)
}

// Precio de referencia de una carta: el mayor entre sus variantes (normal, holo…).
export function priceOf(card:TcgCard, currency:Currency):number|null {
  if (currency === 'EUR') {
    const cm = card.pricing?.cardmarket
    const v = positive([cm?.trend ?? cm?.avg, cm?.['trend-holo'] ?? cm?.['avg-holo']])
    return v.length ? Math.max(...v) : null
  }
  const v = positive(tcgplayerVariants(card).map(([,x]) => x.marketPrice ?? x.midPrice))
  return v.length ? Math.max(...v) : null
}

const formatters = new Map<Currency,Intl.NumberFormat>()
export function formatPrice(value:number|null|undefined, currency:Currency) {
  if (value == null) return '—'
  if (!formatters.has(currency)) formatters.set(currency, new Intl.NumberFormat('es',{style:'currency',currency,minimumFractionDigits:2}))
  return formatters.get(currency)!.format(value)
}
