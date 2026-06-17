import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { trigger, style, animate, transition } from '@angular/animations';
import { Subscription } from 'rxjs';
import { PokemonDetail, PokemonService, EvolutionChain, PokemonListItem, TYPE_ES } from '../../services/pokemon';
import { FavoritesService } from '../../services/favorites';
import { LanguageService } from '../../services/language';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: false,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class DetailPage implements OnInit, OnDestroy {
  pokemon: PokemonDetail | null = null;
  flavorText = '';
  evolution: PokemonListItem[] = [];
  activeTab = 'stats';
  loading = true;
  private langSub!: Subscription;

  readonly statColors: Record<string, string> = {
    hp:               '#ff5959',
    attack:           '#f5ac78',
    defense:          '#fae078',
    'special-attack': '#9db7f5',
    'special-defense':'#a7db8d',
    speed:            '#fa92b2',
  };

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private pokemonService: PokemonService,
    private favoritesService: FavoritesService,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pokemonService.getPokemon(id).subscribe(pokemon => {
      this.pokemon = pokemon;
      this.loading = false;
      this.loadExtras();
    });

    // Re-fetch flavor text when language changes
    this.langSub = this.lang.lang$.subscribe(() => {
      if (this.pokemon) this.fetchFlavorText();
    });
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  loadExtras() {
    if (!this.pokemon) return;
    this.fetchFlavorText();
    this.pokemonService.getEvolutionChain(this.pokemon.species.url).subscribe(chain => {
      this.evolution = this.flattenChain(chain);
    });
  }

  fetchFlavorText() {
    if (!this.pokemon) return;
    this.pokemonService
      .getFlavorText(this.pokemon.species.url, this.lang.current)
      .subscribe(text => (this.flavorText = text));
  }

  flattenChain(chain: EvolutionChain): PokemonListItem[] {
    const result: PokemonListItem[] = [];
    const traverse = (node: EvolutionChain) => {
      const id = this.extractId(node.species.url);
      result.push({ name: node.species.name, url: node.species.url, id, sprite: this.pokemonService.sprite(id), types: [] });
      node.evolves_to.forEach(traverse);
    };
    traverse(chain);
    return result;
  }

  private extractId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }

  statLabel(key: string): string {
    const es: Record<string, string> = { hp: 'PS', attack: 'ATA', defense: 'DEF', 'special-attack': 'AtE', 'special-defense': 'DeE', speed: 'VEL' };
    const en: Record<string, string> = { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'SPE' };
    return (this.lang.current === 'es' ? es[key] : en[key]) || key;
  }

  typeLabel(type: string): string {
    return this.lang.current === 'es' ? (TYPE_ES[type] || type) : type;
  }

  get primaryType(): string {
    return this.pokemon?.types[0]?.type.name || 'normal';
  }

  get isFavorite(): boolean {
    return this.pokemon ? this.favoritesService.isFavorite(this.pokemon.id) : false;
  }

  async toggleFavorite() {
    if (!this.pokemon) return;
    const item: PokemonListItem = {
      id: this.pokemon.id,
      name: this.pokemon.name,
      url: '',
      sprite: this.pokemonService.sprite(this.pokemon.id),
      types: this.pokemon.types.map(t => t.type.name),
    };
    await this.favoritesService.toggle(item);
  }

  statPercent(base: number): number { return Math.min(100, (base / 255) * 100); }
  formatName(name: string): string  { return name.replace(/-/g, ' '); }
  formatId(id: number): string      { return '#' + String(id).padStart(3, '0'); }

  playSound() {
    if (this.pokemon?.cries?.latest) new Audio(this.pokemon.cries.latest).play();
  }

  goBack() { this.navCtrl.back(); }
}
