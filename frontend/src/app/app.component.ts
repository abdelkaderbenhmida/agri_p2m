import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'Agricultural Marketplace Platform';
  showNavbar = true;

  constructor(private router: Router) {}

  ngOnInit() {
    // Masquer la navbar sur la page d'accueil
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showNavbar = event.url !== '/' && event.url !== '';
    });

    // Vérifier l'URL initiale
    this.showNavbar = this.router.url !== '/' && this.router.url !== '';
  }
}
