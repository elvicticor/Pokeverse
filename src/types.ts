export type Named = { name: string; url: string }
export type IndexPokemon = {
  id: number; name: string; search: string
  types: string[]; gen: number; isDefault: boolean; legendary: boolean; mythical: boolean
}
export type Pokemon = {
  id: number; name: string; height: number; weight: number; base_experience: number | null
  types: { slot: number; type: Named }[]
  stats: { base_stat: number; stat: Named }[]
  abilities: { is_hidden: boolean; ability: Named }[]
  species: Named
  sprites: { other?: { 'official-artwork'?: { front_default?: string; front_shiny?: string } } }
  cries?: { latest?: string; legacy?: string }
}
export type Species = {
  id: number; name: string; capture_rate: number; gender_rate: number
  is_legendary: boolean; is_mythical: boolean; generation: Named
  habitat: Named | null; evolution_chain: { url: string } | null
  names: { name: string; language: Named }[]
  genera: { genus: string; language: Named }[]
  flavor_text_entries: { flavor_text: string; language: Named }[]
  varieties: { is_default: boolean; pokemon: Named }[]
}
export type CardmarketPrice = {
  unit?: string; updated?: string
  avg?: number; low?: number; trend?: number; avg30?: number
  'avg-holo'?: number; 'low-holo'?: number; 'trend-holo'?: number; 'avg30-holo'?: number
}
export type TcgplayerVariant = { lowPrice?: number; midPrice?: number; highPrice?: number; marketPrice?: number }
export type TcgCard = {
  id: string; name: string; image?: string; localId?: string
  rarity?: string; illustrator?: string
  set?: { id: string; name: string; logo?: string; symbol?: string }
  pricing?: {
    cardmarket?: CardmarketPrice | null
    tcgplayer?: ({ unit?: string; updated?: string } & Record<string, TcgplayerVariant | string | undefined>) | null
  }
}
// Formato de public/cards.json (lo genera scripts/build-cards.ts)
export type CardSnapshot = {
  id: string; name: string; image: string; category?: string
  dexId?: number[]; set?: { id: string; name: string }; rarity?: string
  eur: number | null; usd: number | null
}
export type CardsFile = { generatedAt: string; count: number; cards: CardSnapshot[] }
