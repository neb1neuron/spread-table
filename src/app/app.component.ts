import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { RequiredValidator } from './custom-validators/required-validator';
import { Column } from './models/cell.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // columns: Column[] = [new Column({ displayName: 'Id', name: 'id', width: '20px', editable: false }),
  // new Column({ displayName: 'Name', name: 'name', width: '200px' }),
  // new Column({ displayName: 'Price', name: 'price' }),
  // new Column({ displayName: 'Discount Amount', name: 'discount_amount', width: '200px' }),
  // new Column({ displayName: 'Status', name: 'status' }),
  // new Column({ displayName: 'Description', name: 'description', width: '400px' }),
  // new Column({ displayName: 'Image Url', name: 'image', width: '300px' })];
  columns: Column[] = [
    new Column({ displayName: 'Id', name: 'id', width: '40px', editable: false }),
    new Column({ displayName: 'Album Id', name: 'albumId', width: '70px' }),
    new Column({ displayName: 'Title', name: 'title', width: '400px', validators: [RequiredValidator.required(), RequiredValidator.requiredString()] }),
    new Column({ displayName: 'Url', name: 'url', width: '300px' }),
    new Column({ displayName: 'Thumbnail Url', name: 'thumbnailUrl', width: '300px' })];

  data: any;

  constructor(private httpClient: HttpClient) {
    this.getData();
  }

  private async getData() {
    const products: any = await lastValueFrom(this.httpClient.get('../assets/data.json'));
    this.data = products;
    // const products: any = await this.httpClient.get('    https://gorest.co.in/public-api/products').toPromise();
    // this.data = products.data;
  }
}
