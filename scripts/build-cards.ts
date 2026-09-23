// Genera public/cards.json: todas las cartas TCG con imagen y su precio de referencia (EUR y USD).
// TCGdex no permite filtrar ni ordenar por precio y su listado no trae `pricing`, así que se pide
// el detalle de cada carta (unas 22.000). Pensado para ejecutarse una vez al día.
//
// Uso:  npm run cards                 (todas)
//       npm run cards -- --limit 200  (prueba rápida)
//       npm run cards -- --concurrency 4
// Requiere Node 22.18+ (ejecuta TypeScript directamente).

import { writeFile, mkdir } from 'node:fs/promises'
import { priceOf } from '../src/pricing.ts'
import type { CardSnapshot, TcgCard } from '../src/types.ts'

const TCG = 'https://api.tcgdex.net/v2/en'
const OUT = new URL('../public/cards.json', import.meta.url)

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? Number(process.argv[i + 1]) : fallback
}
const LIMIT = arg('limit', Infinity)
const CONCURRENCY = arg('concurrency', 8)

type FullCard = TcgCard & { dexId?: number[]; category?: string }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
async function getJSON<T>(url: string, tries = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url)
      if (r.status === 404) throw Object.assign(new Error('HTTP 404'), { fatal: true })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json() as T
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal || attempt >= tries) throw err
      await sleep(500 * 2 ** attempt)
    }
  }
}

const round = (n: number | null) => n == null ? null : Math.round(n * 100) / 100

async function main() {
  const started = Date.now()
  const list = (await getJSON<TcgCard[]>(`${TCG}/cards`)).filter(c => c.image).slice(0, LIMIT)
  console.log(`${list.length} cartas con imagen · ${CONCURRENCY} peticiones en paralelo`)

  const out: CardSnapshot[] = []
  let next = 0, done = 0, failed = 0
  const worker = async () => {
    while (next < list.length) {
      const brief = list[next++]
      try {
        const c = await getJSON<FullCard>(`${TCG}/cards/${brief.id}`)
        out.push({
          id: c.id, name: c.name, image: c.image ?? brief.image!, category: c.category,
          dexId: c.dexId, set: c.set && { id: c.set.id, name: c.set.name }, rarity: c.rarity,
          eur: round(priceOf(c, 'EUR')), usd: round(priceOf(c, 'USD')),
        })
      } catch { failed++ }
      if (++done % 500 === 0 || done === list.length) {
        const secs = (Date.now() - started) / 1000
        console.log(`  ${done}/${list.length} · ${Math.round(done / secs)} cartas/s · ${failed} fallidas`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker))

  out.sort((a, b) => (b.eur ?? -1) - (a.eur ?? -1))
  await mkdir(new URL('.', OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, cards: out }))
  const priced = out.filter(c => c.eur != null || c.usd != null).length
  console.log(`Listo: ${out.length} cartas (${priced} con precio, ${failed} fallidas) en ${Math.round((Date.now() - started) / 1000)} s → public/cards.json`)
  if (failed > list.length * 0.05) process.exitCode = 1 // más de un 5 % fallido: marcar el job como error
}

main().catch(err => { console.error(err); process.exit(1) })
