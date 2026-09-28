export type DeckEntry = { count:number; name:string; set:string; number:string; category:'Pokémon'|'Trainer'|'Energy'; cardId:string }
export type Deck = { id:string; name:string; event:string; source:string; strategy:string; combos:string[]; aliases?:string[]; entries:DeckEntry[] }

const sets:Record<string,string>={SVI:'sv01',PAL:'sv02',OBF:'sv03',PAR:'sv04',PAF:'sv04.5',TEF:'sv05',TWM:'sv06',SFA:'sv06.5',JTG:'sv09',DRI:'sv10',PRE:'sv08.5',MEW:'sv03.5',MEG:'me01',ASC:'me02.5',PBL:'me04',SVP:'svp',SVE:'sve'}
function entries(category:DeckEntry['category'],text:string):DeckEntry[]{
  return text.trim().split('\n').map(line=>{
    const match=line.match(/^(\d+) (.+) ([A-Z]+) (\d+)$/)
    if(!match)throw new Error(`Carta inválida: ${line}`)
    const [,count,name,set,number]=match
    return {count:Number(count),name,set,number,category,cardId:`${sets[set]}-${number.padStart(3,'0')}`}
  })
}
export const decks:Deck[]=[
  {id:'gardevoir-naic-2025',name:'Gardevoir ex · Munkidori',event:'NAIC 2025 · Senior',source:'https://www.pokemon.com/uk/play-pokemon/internationals/2025/north-america/tcg-senior',
    strategy:'Prepara Ralts y evoluciona hasta Gardevoir ex. Gestiona las Energías Psíquicas del descarte y los contadores de daño para elegir el atacante y el objetivo de cada turno.',
    combos:['Gardevoir ex + Munkidori: Psychic Embrace acelera Energía Psíquica y coloca daño; con Energía Oscura, Munkidori puede trasladar contadores al rival.','Gardevoir ex + Scream Tail: acumula daño sin debilitar a tu atacante y usa Roaring Scream para presionar al Pokémon que te convenga.','Arven + Technical Machine: Evolution: busca la Herramienta y un Objeto para preparar la evolución de tu banca.'],entries:[
      ...entries('Pokémon',`2 Gardevoir ex SVI 86
3 Kirlia PAF 28
3 Ralts PAF 27
3 Munkidori TWM 95
1 Cyclizar SVP 96
1 Fezandipiti ex SFA 38
1 Lillie's Clefairy ex JTG 56
1 Scream Tail PAR 86
1 Shaymin DRI 10`),
      ...entries('Trainer',`4 Iono PAL 185
4 Professor's Research SVI 189
3 Arven OBF 186
2 Artazon PAL 171
4 Ultra Ball SVI 196
3 Earthen Vessel PAR 163
3 Technical Machine: Evolution PAR 178
2 Counter Catcher PAR 160
2 Nest Ball SVI 181
2 Night Stretcher SFA 61
1 Buddy-Buddy Poffin TEF 144
1 Rare Candy SVI 191
1 Secret Box TWM 163
1 Super Rod PAL 188
1 Technical Machine: Devolution PAR 177`),
      ...entries('Energy',`7 Basic Psychic Energy SVE 5
3 Basic Darkness Energy SVE 7`)]},
  {id:'dragapult-charizard-naic-2025',name:'Dragapult ex · Charizard ex',event:'NAIC 2025 · Senior',source:'https://www.pokemon.com/uk/play-pokemon/internationals/2025/north-america/tcg-senior',
    strategy:'Desarrolla Dreepy y Charmander en paralelo. Usa Dragapult ex para repartir daño y reserva Charizard ex para responder cuando el rival haya tomado premios.',
    combos:['Drakloak + Dragapult ex: Drakloak ayuda a encontrar recursos antes de evolucionar al atacante que reparte daño con Phantom Dive.','Charizard ex + Rare Candy: evoluciona desde Charmander cuando sea legal y usa Infernal Reign para preparar Energía Fuego.','Iono + Counter Catcher: cuando vas por detrás en premios, reduce las opciones del rival y elige un objetivo vulnerable.'],entries:[
      ...entries('Pokémon',`2 Dragapult ex TWM 130
4 Drakloak TWM 129
4 Dreepy TWM 128
2 Charizard ex OBF 125
1 Charmeleon MEW 5
2 Charmander MEW 4
1 Budew PRE 4
1 Fezandipiti ex SFA 38
1 Munkidori TWM 95
1 Shaymin DRI 10`),
      ...entries('Trainer',`4 Arven OBF 186
4 Iono PAL 185
3 Boss's Orders PAL 172
1 Brock's Scouting JTG 146
1 Professor's Research SVI 189
1 Team Rocket's Watchtower DRI 180
4 Buddy-Buddy Poffin TEF 144
3 Ultra Ball SVI 196
2 Counter Catcher PAR 160
2 Nest Ball SVI 181
2 Rare Candy SVI 191
1 Night Stretcher SFA 61
1 Rescue Board TEF 159
1 Super Rod PAL 188
1 Technical Machine: Evolution PAR 178
1 Unfair Stamp TWM 165`),
      ...entries('Energy',`5 Basic Fire Energy SVE 2
4 Luminous Energy PAL 191`)]},
  {id:'rockets-mewtwo-naic-2026',name:"Team Rocket's Mewtwo ex · Spidops",event:'NAIC 2026 · Masters · 7.º lugar',source:'https://limitlesstcg.com/decks/list/28254',aliases:["Rocket's Mewtwo ex","Team Rocket's Mewtwo ex"],
    strategy:'Llena la banca con Pokémon del Team Rocket para habilitar a Mewtwo ex. Spidops funciona como atacante eficiente mientras Mewtwo prepara un golpe mayor; los Supporters del Team Rocket mantienen el motor de búsqueda y recursos.',
    combos:["Team Rocket's Tarountula + Spidops: construye la banca y ataca por una sola Energía, dejando a Mewtwo para los objetivos de mayor PS.","Team Rocket's Transceiver + Ariana/Giovanni/Proton: convierte una carta en acceso flexible al Supporter que necesita el turno.","Maximum Belt + Spidops: aumenta el alcance contra Pokémon ex cuando el tablero del Team Rocket ya está completo."],entries:[
      ...entries('Pokémon',`4 Team Rocket's Tarountula ASC 18
4 Team Rocket's Spidops DRI 20
2 Team Rocket's Mewtwo ex DRI 81
2 Team Rocket's Mimikyu ASC 97
2 Team Rocket's Articuno DRI 51
1 Lillie's Clefairy ex JTG 56`),
      ...entries('Trainer',`4 Lillie's Determination ASC 192
4 Team Rocket's Ariana ASC 202
3 Team Rocket's Giovanni ASC 204
2 Team Rocket's Proton ASC 208
1 Team Rocket's Petrel ASC 207
4 Team Rocket's Transceiver ASC 209
4 Ultra Ball MEG 131
3 Night Stretcher ASC 196
2 Bug Catching Set TWM 143
1 Energy Switch MEG 115
2 Lucky Helmet TWM 158
1 Maximum Belt TEF 154
2 Prism Tower PBL 80
1 Team Rocket's Factory ASC 203`),
      ...entries('Energy',`6 Basic Grass Energy SVE 1
4 Team Rocket's Energy ASC 217
1 Basic Psychic Energy SVE 5`)]},
]

export function normalizeCardId(id:string){return id.replace(/-0+(\d+)$/,'-$1')}
export type DeckRecommendation = { deck:Deck; relation:'exact'|'related' }
export function decksForCard(id:string,name=''):DeckRecommendation[]{
  const normalizedName=name.trim().toLocaleLowerCase('en')
  const recommendations:DeckRecommendation[]=[]
  for(const deck of decks){
    if(deck.entries.some(entry=>normalizeCardId(entry.cardId)===normalizeCardId(id)))recommendations.push({deck,relation:'exact'})
    else if(normalizedName&&deck.aliases?.some(alias=>alias.toLocaleLowerCase('en')===normalizedName))recommendations.push({deck,relation:'related'})
  }
  return recommendations
}
export function exportDeck(deck:Deck){
  return (['Pokémon','Trainer','Energy'] as const).map(category=>{
    const group=deck.entries.filter(entry=>entry.category===category)
    return `${category}: ${group.reduce((total,entry)=>total+entry.count,0)}\n${group.map(entry=>`${entry.count} ${entry.name} ${entry.set} ${entry.number}`).join('\n')}`
  }).join('\n\n')+'\n\nTotal Cards: 60\n'
}
for(const deck of decks){
  if(deck.entries.reduce((total,entry)=>total+entry.count,0)!==60)throw new Error(`El mazo ${deck.id} no tiene 60 cartas`)
}
