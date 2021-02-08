import { AfterViewInit, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Cell } from './models/cell.model';
import { UndoRedoService } from './services/undo-redo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  columnWidth = 150;
  columnNames = ["Country", "Dataset", "Some column", "Column 1", "What is this", "Nooo"]
}
