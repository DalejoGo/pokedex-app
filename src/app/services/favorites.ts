import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';
import { PokemonListItem } from './pokemon';

const FAVORITES_KEY = 'poke_favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites: PokemonListItem[] = [];
  favorites$ = new BehaviorSubject<PokemonListItem[]>([]);

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
    const stored = await this.storage.get(FAVORITES_KEY);
    this.favorites = stored || [];
    this.favorites$.next(this.favorites);
  }

  async toggle(pokemon: PokemonListItem): Promise<boolean> {
    const idx = this.favorites.findIndex(f => f.id === pokemon.id);
    if (idx > -1) {
      this.favorites.splice(idx, 1);
    } else {
      this.favorites.unshift(pokemon);
    }
    await this.storage.set(FAVORITES_KEY, this.favorites);
    this.favorites$.next([...this.favorites]);
    return idx === -1;
  }

  isFavorite(id: number): boolean {
    return this.favorites.some(f => f.id === id);
  }

  getAll(): PokemonListItem[] {
    return this.favorites;
  }
}
