export const MAX_SPECIES = 1025
export const API = 'https://pokeapi.co/api/v2'
export const TCG = 'https://api.tcgdex.net/v2/en'
export const GQL = 'https://beta.pokeapi.co/graphql/v1beta'
export const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
export const artwork = (id: number) => `${SPRITES}/other/official-artwork/${id}.png`
export const sprite = (id: number) => `${SPRITES}/${id}.png`

export const TYPES: Record<string, { es: string; color: string }> = {
  normal:{es:'Normal',color:'#a8a77a'}, fire:{es:'Fuego',color:'#ff6b45'}, water:{es:'Agua',color:'#5797f5'},
  electric:{es:'Eléctrico',color:'#f7ca38'}, grass:{es:'Planta',color:'#63c174'}, ice:{es:'Hielo',color:'#78d5d7'},
  fighting:{es:'Lucha',color:'#d34d4d'}, poison:{es:'Veneno',color:'#ad62c7'}, ground:{es:'Tierra',color:'#d9aa62'},
  flying:{es:'Volador',color:'#91a7e8'}, psychic:{es:'Psíquico',color:'#ef6b9a'}, bug:{es:'Bicho',color:'#9daf3b'},
  rock:{es:'Roca',color:'#b5a064'}, ghost:{es:'Fantasma',color:'#7369a9'}, dragon:{es:'Dragón',color:'#7759e8'},
  dark:{es:'Siniestro',color:'#76645d'}, steel:{es:'Acero',color:'#94a4b8'}, fairy:{es:'Hada',color:'#dc8fba'},
}
export const GENS = [
  {n:1,roman:'I',region:'Kanto',from:1,to:151},{n:2,roman:'II',region:'Johto',from:152,to:251},
  {n:3,roman:'III',region:'Hoenn',from:252,to:386},{n:4,roman:'IV',region:'Sinnoh',from:387,to:493},
  {n:5,roman:'V',region:'Teselia',from:494,to:649},{n:6,roman:'VI',region:'Kalos',from:650,to:721},
  {n:7,roman:'VII',region:'Alola',from:722,to:809},{n:8,roman:'VIII',region:'Galar',from:810,to:905},
  {n:9,roman:'IX',region:'Paldea',from:906,to:1025},
]
export const STATS: Record<string,string> = { hp:'PS',attack:'Ataque',defense:'Defensa','special-attack':'At. Esp.','special-defense':'Def. Esp.',speed:'Velocidad' }
export const pretty = (value:string) => value.replace(/-f$/,' ♀').replace(/-m$/,' ♂').replaceAll('-',' ')
export const idFromUrl = (url:string) => Number(url.split('/').filter(Boolean).at(-1))
export const pad = (id:number) => `#${String(id).padStart(4,'0')}`
