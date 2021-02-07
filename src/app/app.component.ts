import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'spread-table';
  table = document.getElementById('spreadTable');
  Math = Math;

  rowsNumber = 20;
  columnsNumber = 10;
  columnNames: string[] = [];
  focus = true;

  columnValues: [string[]] = [[]];
  form = new FormGroup({});

  isMouseDown = false;
  startRowIndex = 0;
  startCellIndex = 0;
  endRowIndex = 0;
  endCellIndex = 0;
  inEditCell?: Element;

  constructor() {
    this.createData();
  }

  createData() {
    for (let j = 0; j < this.columnsNumber; j++) {
      this.columnNames.push('Column ' + j);
    }

    for (let i = 0; i < this.rowsNumber; i++) {
      this.columnValues.push([]);
      for (let j = 0; j < this.columnsNumber; j++) {
        this.columnValues[i].push(Math.random().toString(36).substr(0, 5));
      }
    }
  }

  ngAfterViewInit() {
    this.table = document.getElementById('spreadTable');

    this.table?.addEventListener("selectstart", () => {
      return false;
    });

    let allCells = document.querySelectorAll('.spread-cell');
    allCells.forEach((cell, index) => {
      cell.addEventListener("mousedown", (e) => { this.mouseDownCall(e, cell) });
      cell.addEventListener("mouseover", (e) => { this.mouseOverCall(cell) });
      cell.addEventListener("dblclick", (e) => { this.dblClickCall(cell) });
    });

    this.table?.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });
    this.table?.addEventListener("keydown", (e) => { this.keyDownCall(e) });
  }

  mouseOverCall(cell: Element) {
    if (!this.isMouseDown || this.inEditCell) return;
    let selectedCells = this.table?.getElementsByClassName("selected");
    if (selectedCells) {
      Array.from(selectedCells).forEach(function (cell) {
        cell.classList.remove("selected");
      });
    }
    this.selectTo(cell);
  }

  dblClickCall(cell: Element) {
    if (this.inEditCell) return;
    this.isMouseDown = false;
    this.inEditCell = cell;
    this.focus = true;

    let selectedCells = this.table?.getElementsByClassName("selected");
    if (selectedCells) {
      Array.from(selectedCells).forEach(function (cell) {
        cell.classList.remove("selected");
      });
    }

    cell.classList.add("selected");
    let row = cell.parentElement;

    this.form = new FormGroup({});
    const cellValues = row?.getElementsByClassName('spread-cell-value');
    if (cellValues) {
      Array.from(cellValues).forEach((cellValue, index) => {
        this.form.addControl(this.columnNames[index], new FormControl(cellValue.innerHTML))
      });
    }

    if (!row) return;
    this.startCellIndex = ([].slice.call(cell.parentElement?.children) as Element[]).indexOf(cell);
    this.startRowIndex = ([].slice.call(row.parentElement?.children) as Element[]).indexOf(row);
  };

  isInEditMode(rowIndex: number, cellIndex: number) {
    if (!this.inEditCell) return false;
    let row = this.inEditCell.parentElement;
    if (!row) return;
    const cellIndex2 = ([].slice.call(this.inEditCell?.parentElement?.children) as Element[]).indexOf(this.inEditCell);
    const rowIndex2 = ([].slice.call(row.parentElement?.children) as Element[]).indexOf(row) - 1;
    if (this.focus) {
      this.focus = false;
      setTimeout(() => { // this will make the execution after the above boolean has changed
        const cell = document.getElementsByClassName('cell-in-edit')[0] as any;
        if (cell) {
          cell.focus();
        }
      }, 0);
    }

    return rowIndex === rowIndex2 && cellIndex === cellIndex2;
  }

  keyDownCall(e: Event) {

    let event = e as KeyboardEvent;

    if (event.ctrlKey && event.key === 'x') {
      this.cutSelectedCellsValues();

      e.stopPropagation();
      e.preventDefault();
    }

    if (event.key === 'Enter') {
      this.table?.focus();
    }
  }

  cutSelectedCellsValues() {
    let selectedCells = this.table?.getElementsByClassName("selected");
    if (selectedCells) {
      Array.from(selectedCells).forEach((cell) => {
        let row = cell.parentElement;
        if (!row) return;
        let cellIndex = ([].slice.call(cell.parentElement?.children) as Element[]).indexOf(cell);
        let rowIndex = ([].slice.call(row.parentElement?.children) as Element[]).indexOf(row) - 1;
        this.columnValues[rowIndex][cellIndex] = '';
      });
    }
  }

  setCellValue(columnName: string, rowIndex: number, cellIndex: number) {
    this.columnValues[rowIndex][cellIndex] = this.form.value[columnName];
    this.inEditCell = undefined;
  }

  mouseDownCall(e: Event, cell: Element) {
    this.isMouseDown = true;

    let selectedCells = this.table?.getElementsByClassName("selected");
    if (selectedCells) {
      Array.from(selectedCells).forEach(function (cell) {
        cell.classList.remove("selected");
      });
    }

    let event = e as MouseEvent;

    if (event.shiftKey) {
      this.selectTo(cell);
    } else {
      cell.classList.add("selected");
      let row = cell.parentElement;
      if (!row) return;
      this.startCellIndex = ([].slice.call(cell.parentElement?.children) as Element[]).indexOf(cell);
      this.startRowIndex = ([].slice.call(row.parentElement?.children) as Element[]).indexOf(row) - 1;
    }

    return false; // prevent text selection
  };

  selectTo(cell: Element) {

    let row = cell.parentElement;
    if (!row) return;
    let cellIndex = ([].slice.call(cell.parentElement?.children) as Element[]).indexOf(cell);
    let rowIndex = ([].slice.call(row.parentElement?.children) as Element[]).indexOf(row) - 1;

    let rowStart, rowEnd, cellStart, cellEnd;

    if (rowIndex < this.startRowIndex) {
      rowStart = rowIndex;
      rowEnd = this.startRowIndex;
    } else {
      rowStart = this.startRowIndex;
      rowEnd = rowIndex;
    }

    if (cellIndex < this.startCellIndex) {
      cellStart = cellIndex;
      cellEnd = this.startCellIndex;
    } else {
      cellStart = this.startCellIndex;
      cellEnd = cellIndex;
    }

    this.endCellIndex = cellEnd;
    this.endRowIndex = rowEnd;

    for (var i = rowStart; i <= rowEnd; i++) {
      let rowsList = this.table?.querySelectorAll("tr");
      if (!rowsList) return;
      let rows = Array.from(rowsList);
      let rowCellsList = rows[i].querySelectorAll("td");
      let rowCells = Array.from(rowCellsList);

      for (var j = cellStart; j <= cellEnd; j++) {
        rowCells[j].classList.add("selected");
      }
    }
  }

}
