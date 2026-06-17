import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, catchError, of } from 'rxjs';

export interface PokemonListItem {
  name: string;
  url: string;
  id: number;
  sprite: string;
  types: string[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string;
    other: { 'official-artwork': { front_default: string } };
  };
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  moves: Array<{ move: { name: string } }>;
  species: { url: string };
  cries: { latest: string };
}

export interface EvolutionChain {
  species: { name: string; url: string };
  evolves_to: EvolutionChain[];
}

const BASE = 'https://pokeapi.co/api/v2';

export const TYPE_ES: Record<string, string> = {
  normal:   'Normal',
  fire:     'Fuego',
  water:    'Agua',
  electric: 'Eléctrico',
  grass:    'Planta',
  ice:      'Hielo',
  fighting: 'Lucha',
  poison:   'Veneno',
  ground:   'Tierra',
  flying:   'Volador',
  psychic:  'Psíquico',
  bug:      'Bicho',
  rock:     'Roca',
  ghost:    'Fantasma',
  dragon:   'Dragón',
  dark:     'Siniestro',
  steel:    'Acero',
  fairy:    'Hada',
  stellar:  'Estelar',
};

@Injectable({ providedIn: 'root' })
export class PokemonService {
  constructor(private http: HttpClient) {}

  getPokemons(limit = 20, offset = 0): Observable<PokemonListItem[]> {
    return this.http
      .get<{ results: { name: string; url: string }[] }>(
        `${BASE}/pokemon?limit=${limit}&offset=${offset}`
      )
      .pipe(
        map(res => res.results.map(p => {
          const id = this.extractId(p.url);
          return { ...p, id, sprite: this.sprite(id), types: [] as string[] };
        })),
        switchMap(list => this.enrichWithDetails(list))
      );
  }

  getPokemon(id: number | string): Observable<PokemonDetail> {
    return this.http.get<PokemonDetail>(`${BASE}/pokemon/${id}`);
  }

  getPokemonsByType(type: string): Observable<PokemonListItem[]> {
    return this.http
      .get<{ pokemon: { pokemon: { name: string; url: string } }[] }>(
        `${BASE}/type/${type}`
      )
      .pipe(
        map(res =>
          res.pokemon
            .filter(p => this.extractId(p.pokemon.url) <= 10000)
            .slice(0, 40)
            .map(p => {
              const id = this.extractId(p.pokemon.url);
              return { name: p.pokemon.name, url: p.pokemon.url, id, sprite: this.sprite(id), types: [type] };
            })
        ),
        switchMap(list => this.enrichWithDetails(list))
      );
  }

  private enrichWithDetails(list: PokemonListItem[]): Observable<PokemonListItem[]> {
    if (!list.length) return of([]);
    return forkJoin(
      list.map(p =>
        this.getPokemon(p.id).pipe(
          map(detail => ({
            ...p,
            types: detail.types.map(t => t.type.name),
            sprite:
              detail.sprites.other?.['official-artwork']?.front_default ||
              detail.sprites.front_default ||
              this.sprite(p.id),
          })),
          catchError(() => of(p))
        )
      )
    );
  }

  getTypes(): Observable<string[]> {
    return this.http
      .get<{ results: { name: string }[] }>(`${BASE}/type?limit=20`)
      .pipe(map(res => res.results.map(t => t.name).filter(t => !['unknown', 'shadow'].includes(t))));
  }

  getEvolutionChain(speciesUrl: string): Observable<EvolutionChain> {
    return this.http.get<{ evolution_chain: { url: string } }>(speciesUrl).pipe(
      switchMap(species => this.http.get<{ chain: EvolutionChain }>(species.evolution_chain.url)),
      map(res => res.chain)
    );
  }

  getFlavorText(speciesUrl: string, lang: 'es' | 'en' = 'es'): Observable<string> {
    return this.http
      .get<{ flavor_text_entries: Array<{ flavor_text: string; language: { name: string } }> }>(speciesUrl)
      .pipe(
        map(res => {
          const preferred = res.flavor_text_entries.find(e => e.language.name === lang);
          const fallback  = res.flavor_text_entries.find(e => e.language.name === (lang === 'es' ? 'en' : 'es'));
          const entry = preferred ?? fallback;
          return entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : '';
        })
      );
  }

  searchByName(query: string): Observable<PokemonListItem[]> {
    return this.http
      .get<{ results: { name: string; url: string }[] }>(`${BASE}/pokemon?limit=1000`)
      .pipe(
        map(res =>
          res.results
            .filter(p => p.name.includes(query.toLowerCase()))
            .slice(0, 20)
            .map(p => {
              const id = this.extractId(p.url);
              return { ...p, id, sprite: this.sprite(id), types: [] as string[] };
            })
        ),
        switchMap(list => this.enrichWithDetails(list))
      );
  }

  private extractId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }

  sprite(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/other/official-artwork/${id}.png`;
  }
}
