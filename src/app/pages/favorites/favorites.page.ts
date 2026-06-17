import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { PokemonListItem, TYPE_ES } from '../../services/pokemon';
import { FavoritesService } from '../../services/favorites';
import { LanguageService } from '../../services/language';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: false,
})
export class FavoritesPage {
  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private navCtrl: NavController,
    public lang: LanguageService
  ) {}

  get favorites(): PokemonListItem[] { return this.favoritesService.getAll(); }

  async remove(pokemon: PokemonListItem) { await this.favoritesService.toggle(pokemon); }

  goToDetail(id: number) { this.router.navigate(['/detail', id]); }
  goBack()               { this.navCtrl.back(); }

  formatId(id: number): string { return '#' + String(id).padStart(3, '0'); }

  typeLabel(type: string): string {
    return this.lang.current === 'es' ? (TYPE_ES[type] || type) : type;
  }
}
