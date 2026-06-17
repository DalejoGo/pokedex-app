import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { PokemonListItem, PokemonService, TYPE_ES } from '../../services/pokemon';
import { FavoritesService } from '../../services/favorites';
import { LanguageService } from '../../services/language';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  pokemons: PokemonListItem[] = [];
  types: string[] = [];
  selectedType = '';
  searchQuery = '';
  loading = true;
  offset = 0;
  limit = 20;
  private search$ = new Subject<string>();

  constructor(
    private pokemonService: PokemonService,
    private favoritesService: FavoritesService,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.loadTypes();
    this.loadPokemons();
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading = true;
        this.pokemons = [];
        if (!q) return this.pokemonService.getPokemons(this.limit, 0);
        return this.pokemonService.searchByName(q);
      })
    ).subscribe(data => {
      this.pokemons = data;
      this.loading = false;
    });
  }

  loadTypes() {
    this.pokemonService.getTypes().subscribe(t => (this.types = t));
  }

  loadPokemons(reset = false) {
    if (reset) { this.offset = 0; this.pokemons = []; }
    this.loading = true;
    const obs = this.selectedType
      ? this.pokemonService.getPokemonsByType(this.selectedType)
      : this.pokemonService.getPokemons(this.limit, this.offset);
    obs.subscribe(data => {
      this.pokemons = reset ? data : [...this.pokemons, ...data];
      this.offset += this.limit;
      this.loading = false;
    });
  }

  onSearchChange(event: any) {
    const q = event.detail.value?.trim() || '';
    this.searchQuery = q;
    this.search$.next(q);
  }

  onTypeSelect(type: string) {
    this.selectedType = this.selectedType === type ? '' : type;
    this.searchQuery = '';
    this.loadPokemons(true);
  }

  onInfiniteScroll(event: InfiniteScrollCustomEvent) {
    if (this.selectedType || this.searchQuery) { event.target.complete(); return; }
    this.pokemonService.getPokemons(this.limit, this.offset).subscribe(data => {
      this.pokemons = [...this.pokemons, ...data];
      this.offset += this.limit;
      event.target.complete();
      if (data.length < this.limit) event.target.disabled = true;
    });
  }

  toggleLang() {
    this.lang.toggle();
  }

  goToDetail(id: number) { this.router.navigate(['/detail', id]); }
  goToFavorites()        { this.router.navigate(['/favorites']); }

  isFavorite(id: number): boolean { return this.favoritesService.isFavorite(id); }

  formatId(id: number): string { return '#' + String(id).padStart(3, '0'); }

  typeLabel(type: string): string {
    return this.lang.current === 'es' ? (TYPE_ES[type] || type) : type;
  }
}
