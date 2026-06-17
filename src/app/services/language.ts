import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'es' | 'en';

export const UI: Record<Lang, Record<string, string>> = {
  es: {
    search:       'Buscar Pokémon...',
    searching:    'Buscando Pokémon...',
    loadingMore:  'Cargando más...',
    height:       'Altura',
    weight:       'Peso',
    baseExp:      'Exp. Base',
    tabStats:     'Estadísticas',
    tabAbil:      'Habilidades',
    tabEvol:      'Evolución',
    tabMoves:     'Movimientos',
    hiddenAbil:   'Habilidad Oculta',
    noEvolution:  'Este Pokémon no evoluciona.',
    favTitle:     'Mis Favoritos',
    favEmpty:     'Sin favoritos',
    favEmptySub:  'Abrí un Pokémon y tocá ❤️ para guardarlo aquí.',
    statHP:       'PS',
    statATK:      'ATA',
    statDEF:      'DEF',
    statSPA:      'AtE',
    statSPD:      'DeE',
    statSPE:      'VEL',
  },
  en: {
    search:       'Search Pokémon...',
    searching:    'Searching Pokémon...',
    loadingMore:  'Loading more...',
    height:       'Height',
    weight:       'Weight',
    baseExp:      'Base Exp.',
    tabStats:     'Stats',
    tabAbil:      'Abilities',
    tabEvol:      'Evolution',
    tabMoves:     'Moves',
    hiddenAbil:   'Hidden Ability',
    noEvolution:  'This Pokémon does not evolve.',
    favTitle:     'My Favorites',
    favEmpty:     'No favorites yet',
    favEmptySub:  'Open a Pokémon and tap ❤️ to save it here.',
    statHP:       'HP',
    statATK:      'ATK',
    statDEF:      'DEF',
    statSPA:      'SpA',
    statSPD:      'SpD',
    statSPE:      'SPE',
  },
};

const STORAGE_KEY = 'poke_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang = new BehaviorSubject<Lang>(
    (localStorage.getItem(STORAGE_KEY) as Lang) || 'es'
  );

  lang$ = this._lang.asObservable();

  get current(): Lang {
    return this._lang.value;
  }

  get t(): Record<string, string> {
    return UI[this._lang.value];
  }

  toggle() {
    const next: Lang = this._lang.value === 'es' ? 'en' : 'es';
    this._lang.next(next);
    localStorage.setItem(STORAGE_KEY, next);
  }
}
