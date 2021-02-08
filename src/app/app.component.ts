import { AfterViewInit, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Cell } from './models/cell.model';
import { UndoRedoService } from './services/undo-redo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'spread-table';
  table = document.getElementById('spreadTable');
  Math = Math;

  columnWidth = 100;

  rowsNumber = 100;
  columnsNumber = 10;
  columnNames: string[] = [];
  focus = true;

  data: Cell[] = [];
  form = new FormGroup({});

  isMouseDown = false;
  startRowIndex = 0;
  startCellIndex = 0;
  endRowIndex = 0;
  endCellIndex = 0;
  selectedCellCoordinates?: { rowIndex: number, columnIndex: number } = undefined;
  isEditMode = false;

  constructor(private undoRedoService: UndoRedoService) {
    this.createData();
  }

  createData() {
    for (let j = 0; j < this.columnsNumber; j++) {
      this.columnNames.push('Column ' + j);
    }

    for (let i = 0; i < this.rowsNumber; i++) {
      for (let j = 0; j < this.columnsNumber; j++) {
        this.data.push({ value: Math.random().toString(36).substr(0, 5), rowIndex: i, columnIndex: j });
      }
    }
  }

  ngAfterViewInit() {
    this.table = document.getElementById('spreadTable');

    this.table?.addEventListener("selectstart", () => {
      return false;
    });

    this.table?.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });
    this.table?.addEventListener("keydown", (e) => { this.keyDownCall(e) });
  }

  mouseUp() {
    this.isMouseDown = false;
  }

  mouseOverCall(rowIndex: number, columnIndex: number) {
    if (!this.isMouseDown || this.isInEditMode(rowIndex, columnIndex)) return;

    this.clearSelection();

    this.selectTo(rowIndex, columnIndex);
  }

  getDataCell(rowIndex: number, columnIndex: number): Cell | undefined {
    return this.data.find(d => d.rowIndex === rowIndex && d.columnIndex === columnIndex);
  }

  doubleClick(rowIndex: number, columnIndex: number) {
    if (this.selectedCellCoordinates?.rowIndex === rowIndex && this.selectedCellCoordinates.columnIndex === columnIndex && this.isEditMode) return;
    this.clearSelection();
    this.isMouseDown = false;
    this.isEditMode = true;
    this.focus = true;
    this.selectedCellCoordinates = { rowIndex: rowIndex, columnIndex: columnIndex };

    this.form = new FormGroup({});

    this.data.filter(d => d.rowIndex === rowIndex).forEach((cellData, index) => {
      this.form.addControl(this.columnNames[index], new FormControl(this.getDataCell(rowIndex, columnIndex)?.value));
    });

    this.startCellIndex = columnIndex;
    this.startRowIndex = rowIndex;

    if (this.focus) {
      this.focus = false;
      setTimeout(() => { // this will make the execution after the above boolean has changed
        const cell = document.getElementsByClassName('cell-in-edit')[0] as any;
        if (cell) {
          cell.focus();
        }
      }, 0);
    }
  }

  isInEditMode(rowIndex: number, columnIndex: number) {
    if (!this.selectedCellCoordinates) return false;
    const cellIndex2 = this.selectedCellCoordinates.columnIndex;
    const rowIndex2 = this.selectedCellCoordinates.rowIndex;

    return rowIndex === rowIndex2 && columnIndex === cellIndex2 && this.isEditMode;
  }

  keyDownCall(e: Event) {

    let event = e as KeyboardEvent;

    if (event.ctrlKey && event.key === 'x') {
      this.cutSelectedCellsValues();

      e.stopPropagation();
      e.preventDefault();
    }

    if (event.ctrlKey && event.key === 'z') {
      const lastChange = this.undoRedoService.undo();
      if (lastChange) {
        this.clearSelection();
        let cellData = this.getDataCell(lastChange.coordinates.rowIndex, lastChange.coordinates.columnIndex);
        if (cellData) {
          cellData.value = lastChange.beforeValue;
          cellData.selected = true;
        }
      }
    }

    if (event.ctrlKey && event.key === 'y') {
      const lastChange = this.undoRedoService.redo();
      if (lastChange) {
        this.clearSelection();
        let cellData = this.getDataCell(lastChange.coordinates.rowIndex, lastChange.coordinates.columnIndex);
        if (cellData) {
          cellData.value = lastChange.beforeValue;
          cellData.selected = true;
        }
      }
    }

    if (event.key === 'Enter') {
      this.table?.focus();
    }
  }

  cutSelectedCellsValues() {
    let selectedCells = this.data.filter(d => d.selected);

    selectedCells.forEach(cell => {
      let cellData = this.getDataCell(cell.rowIndex, cell.columnIndex);
      if (cellData) cellData.value = null;
    });

  }

  setCellValue(columnName: string, rowIndex: number, columnIndex: number) {
    if (this.getDataCell(rowIndex, columnIndex)?.value !== this.form.value[columnName]) {
      this.undoRedoService.setChange({
        coordinates:
          { rowIndex: rowIndex, columnIndex: columnIndex },
        beforeValue: this.getDataCell(rowIndex, columnIndex)?.value,
        afterValue: this.form.value[columnName]
      });
      let cellData = this.getDataCell(rowIndex, columnIndex);
      if (cellData) cellData.value = this.form.value[columnName];
    }
    this.isEditMode = false;
    this.selectedCellCoordinates = undefined;
  }

  clearSelection() {
    this.isEditMode = false;
    this.selectedCellCoordinates = undefined;

    this.data.filter(d => d.selected).forEach(dataCell => {
      dataCell.selected = false;
    });
  }

  cellClick(e: Event, rowIndex: number, columnIndex: number) {
    if (this.selectedCellCoordinates?.rowIndex === rowIndex && this.selectedCellCoordinates.columnIndex === columnIndex) return;
    this.clearSelection();
    this.table?.focus();
    this.isMouseDown = true;
    this.isEditMode = false;
    this.selectedCellCoordinates = { rowIndex: rowIndex, columnIndex: columnIndex };

    let event = e as MouseEvent;

    if (event.shiftKey) {
      this.selectTo(rowIndex, columnIndex);
    } else {
      let cellData = this.getDataCell(rowIndex, columnIndex);
      if (cellData) cellData.selected = true;

      this.startCellIndex = columnIndex;
      this.startRowIndex = rowIndex;
    }

    return false; // prevent text selection
  };

  selectTo(rowIndex: number, columnIndex: number) {
    let rowStart, rowEnd, cellStart, cellEnd;

    if (rowIndex < this.startRowIndex) {
      rowStart = rowIndex;
      rowEnd = this.startRowIndex;
    } else {
      rowStart = this.startRowIndex;
      rowEnd = rowIndex;
    }

    if (columnIndex < this.startCellIndex) {
      cellStart = columnIndex;
      cellEnd = this.startCellIndex;
    } else {
      cellStart = this.startCellIndex;
      cellEnd = columnIndex;
    }

    this.endCellIndex = cellEnd;
    this.endRowIndex = rowEnd;

    for (var i = rowStart; i <= rowEnd; i++) {

      for (var j = cellStart; j <= cellEnd; j++) {
        let cellData = this.getDataCell(i, j);
        if (cellData) cellData.selected = true;
      }
    }
  }

}
