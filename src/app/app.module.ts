import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SpreadTableComponent } from './core/components/spread-table/spread-table.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { ContextMenuComponent } from './core/components/context-menu/context-menu.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    SpreadTableComponent,
    ContextMenuComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    HttpClientModule,
    VirtualScrollerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
