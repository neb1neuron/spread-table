import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Cell, Column, Row } from 'src/app/models/cell.model';
import { Change, UndoRedoService } from 'src/app/services/undo-redo.service';
import { ContextMenuModel } from '../../models/context-menu.model';

@Component({
  selector: 'spread-table',
  templateUrl: './spread-table.component.html',
  styleUrls: ['./spread-table.component.scss']
})
export class SpreadTableComponent implements AfterViewInit, OnChanges {
  table = document.getElementById('spreadTable');

  @Input() columnWidth = 100;
  @Input() rawData: any = null;
  // this needs to be a more complex object that contains dispayName and propertyName to be able to map from the rawData json
  @Input() columns: Column[] = [];
  data: Row[] = [];

  focus = true;
  form = new FormGroup({});

  isMouseDown = false;
  startRowIndex = 0;
  startCellIndex = 0;
  endRowIndex = 0;
  endCellIndex = 0;
  selectedCellCoordinates?: { rowIndex: number, columnIndex: number } = undefined;
  isEditMode = false;

  isDisplayContextMenu: boolean = false;

  contextMenuActions = {
    copy: 'copy',
    cut: 'cut',
    paste: 'paste',
    undo: 'undo',
    redo: 'redo',
  };

  contextMenuItems: Array<ContextMenuModel> = [{
    faIconName: 'far fa-copy',
    menuText: 'Copy',
    disabled: true,
    menuEvent: this.contextMenuActions.copy,
    shortcut: 'Ctrl+C'
  },
  {
    faIconName: 'fas fa-cut',
    menuText: 'Cut',
    menuEvent: this.contextMenuActions.cut,
    shortcut: 'Ctrl+X'
  },
  {
    faIconName: 'far fa-clipboard',
    menuText: 'Paste',
    menuEvent: this.contextMenuActions.paste,
    shortcut: 'Ctrl+V'
  }, {
    faIconName: 'fas fa-undo',
    menuText: 'Undo',
    menuEvent: this.contextMenuActions.undo,
    shortcut: 'Ctrl+Z'
  }, {
    faIconName: 'fas fa-redo',
    menuText: 'Redo',
    menuEvent: this.contextMenuActions.redo,
    shortcut: 'Ctrl+Y'
  },];
  contextMenuPosition: any;

  @ViewChild('contextMenu', { read: ElementRef }) set contextMenu(element: ElementRef) {
    if (element) {
      const wrapper = this.table?.parentElement?.parentElement?.parentElement;
      element.nativeElement.setAttribute('style', `position: fixed;left: 0px;top: 0px;`);
      let wrapperWidth = 9999999;
      let wrapperHeight = 9999999;

      if (wrapper) {
        wrapperWidth = wrapper.clientWidth + wrapper.offsetLeft;
        wrapperHeight = wrapper.clientHeight + wrapper.offsetTop;
      }
      const contextMenuWidth = element?.nativeElement.clientWidth;
      const contextMenuHeight = element?.nativeElement.clientHeight;

      this.contextMenuPosition.x = this.contextMenuPosition.x + contextMenuWidth > wrapperWidth ? this.contextMenuPosition.x - contextMenuWidth : this.contextMenuPosition.x;
      this.contextMenuPosition.y = this.contextMenuPosition.y + contextMenuHeight > wrapperHeight ? this.contextMenuPosition.y - contextMenuHeight : this.contextMenuPosition.y;

      element.nativeElement.setAttribute('style', `position: fixed;left: ${this.contextMenuPosition.x}px;top: ${this.contextMenuPosition.y}px;`);
    } else {
      this.contextMenuPosition = {};
    }
  }

  constructor(private undoRedoService: UndoRedoService,) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.rawData.currentValue) {
      for (let i = 0; i < this.rawData.length; i++) {
        let row = new Row({ rowIndex: i, cells: [] });
        const keys = Object.keys(this.rawData[0]);

        for (let j = 0; j < this.columns.length; j++) {
          row.cells.push({ columnName: this.columns[j].name, value: this.rawData[i][this.columns[j].name], rowIndex: i, columnIndex: j });
        }
        this.data.push(row);
      }

      console.log(this.data);
    }
  }

  getCellValue(row: Row, columnName: string) {
    return row.cells.find(c => c.columnName === columnName)?.value;
  }

  ngAfterViewInit() {
    this.table = document.getElementById('spreadTable');

    document.addEventListener('scroll', (e) => this.isDisplayContextMenu = false, true);

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

  mouseOverCall(cell: Cell) {
    if (!this.isMouseDown || this.isInEditMode(cell)) return;

    this.clearSelection();

    this.selectTo(cell.rowIndex, cell.columnIndex);
  }

  getDataCell(rowIndex: number, columnIndex: number): Cell {
    return this.data.find(d => d.rowIndex === rowIndex)?.cells.find(c => c.columnIndex === columnIndex) || new Cell;
  }

  doubleClick(cell: Cell) {
    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex && this.selectedCellCoordinates.columnIndex === cell.columnIndex && this.isEditMode) return;
    this.clearSelection();
    this.isMouseDown = false;
    this.isEditMode = true;
    this.focus = true;
    this.selectedCellCoordinates = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };

    this.form = new FormGroup({});

    this.columns.forEach((column) => {
      this.form.addControl(column.name, new FormControl(this.getCellValue(this.data[cell.rowIndex], column.name)));
    });

    this.startCellIndex = cell.columnIndex;
    this.startRowIndex = cell.rowIndex;

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

  isInEditMode(cell: Cell) {
    if (!this.selectedCellCoordinates) return false;
    const cellIndex2 = this.selectedCellCoordinates.columnIndex;
    const rowIndex2 = this.selectedCellCoordinates.rowIndex;

    return cell.rowIndex === rowIndex2 && cell.columnIndex === cellIndex2 && this.isEditMode;
  }

  keyDownCall(e: Event) {

    let event = e as KeyboardEvent;

    if (event.ctrlKey && event.key === 'x') {
      this.cutSelectedCellsValues();

      e.stopPropagation();
      e.preventDefault();
    }

    if (event.ctrlKey && event.key === 'c') {
      this.copySelectedCellsValues();

      e.stopPropagation();
      e.preventDefault();
    }

    if (event.ctrlKey && event.key === 'v') {
      this.pasteSelectedCellsValues();

      e.stopPropagation();
      e.preventDefault();
    }

    if (!this.isEditMode) {
      switch (event.key) {
        case 'ArrowLeft':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex);
            let nextCell = null;
            if (this.selectedCellCoordinates.columnIndex - 1 >= 0) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex - 1);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnIndex: nextCell.columnIndex };
            }
          }
          break;
        case 'ArrowRight':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex);
            let nextCell = null;
            if (this.selectedCellCoordinates.columnIndex + 1 < this.columns.length) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex + 1);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnIndex: nextCell.columnIndex };
            }
          }
          break;
        case 'ArrowUp':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex);
            let nextCell = null;
            if (this.selectedCellCoordinates.rowIndex > 0) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex - 1, this.selectedCellCoordinates.columnIndex);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnIndex: nextCell.columnIndex };
            }
          }
          break;
        case 'ArrowDown':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex);
            let nextCell = null;
            if (this.selectedCellCoordinates.rowIndex + 1 < this.data.length) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex + 1, this.selectedCellCoordinates.columnIndex);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnIndex: nextCell.columnIndex };
            }
          }
          break;
      }
    }

    if (event.ctrlKey && event.key === 'z') {
      this.undo();
    }

    if (event.ctrlKey && event.key === 'y') {
      this.redo();
    }

    if (event.key === 'Enter' && this.selectedCellCoordinates && !this.isEditMode) {
      this.doubleClick(this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnIndex))
    }

    if (event.key === 'Enter' && this.isEditMode) {
      this.table?.focus();
    }

    if (event.key === 'Escape' && this.isEditMode) {
      this.table?.focus();
    }
  }

  undo() {
    const lastChange = this.undoRedoService.undo();
    if (lastChange) {
      this.clearSelection();
      lastChange.forEach(change => {
        let cellData = this.getDataCell(change.coordinates.rowIndex, change.coordinates.columnIndex);
        if (cellData) {
          cellData.value = change.beforeValue;
          cellData.selected = true;
        }
      });
    }
  }

  redo() {
    const lastChange = this.undoRedoService.redo();
    if (lastChange) {
      this.clearSelection();
      lastChange.forEach(change => {
        let cellData = this.getDataCell(change.coordinates.rowIndex, change.coordinates.columnIndex);
        if (cellData) {
          cellData.value = change.beforeValue;
          cellData.selected = true;
        }
      });
    }
  }

  cutSelectedCellsValues() {
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    let changes: Change[] = [];
    this.copySelectedCellsValues();

    selectedCells.forEach(cell => {
      let cellData = this.getDataCell(cell.rowIndex, cell.columnIndex);
      changes.push({
        coordinates:
          { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        beforeValue: cell.value,
        afterValue: null
      });
      if (cellData) cellData.value = null;
    });

    if (changes.length > 0)
      this.undoRedoService.setChange(changes);
  }

  copySelectedCellsValues() {
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    let changes: Change[] = [];

    selectedCells.forEach(cell => {
      cell.selected = false;
      changes.push({
        coordinates:
          { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        beforeValue: cell.value,
        afterValue: null
      });
      setTimeout(() => {
        cell.selected = true;
      }, 200);
    });

    if (changes.length > 0)
      this.undoRedoService.setCopyData(changes);
  }

  pasteSelectedCellsValues() {
    let selectedCells: Cell[] = [];
    let copyData = this.undoRedoService.paste();
    if (copyData) {
      this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

      const rowIndexDifference = selectedCells[0].rowIndex - copyData[0].coordinates.rowIndex;
      const columnIndexDifference = selectedCells[0].columnIndex - copyData[0].coordinates.columnIndex;


      let changes: Change[] = [];

      selectedCells.forEach(cell => {
        cell.selected = false;

        const cellRowIndex = cell.rowIndex;
        const cellColumnIndex = cell.columnIndex;

        const value = copyData ? copyData.find(cd => cd.coordinates.rowIndex === cellRowIndex - rowIndexDifference &&
          cd.coordinates.columnIndex === cellColumnIndex - columnIndexDifference)?.beforeValue : null;

        changes.push({
          coordinates:
            { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          beforeValue: cell.value,
          afterValue: value
        });

        cell.value = value;

        setTimeout(() => {
          cell.selected = true;
        }, 200);
      });

      if (changes.length > 0)
        this.undoRedoService.setChange(changes);
    }
  }

  setCellValue(column: Column, cell: Cell) {
    if (cell.value !== this.form.value[column.name]) {
      this.undoRedoService.setChange([{
        coordinates:
          { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        beforeValue: cell.value,
        afterValue: this.form.value[column.name]
      }]);
      cell.value = this.form.value[column.name];
    }

    this.isEditMode = false;

    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex &&
      this.selectedCellCoordinates?.columnIndex === cell.columnIndex) {
      cell.selected = true;
    }
  }

  clearSelection() {
    this.isEditMode = false;
    this.selectedCellCoordinates = undefined;

    let selectedCells: Cell[] = this.data.filter(r => r.cells.filter(d => d.selected).length > 0).flatMap(r => r.cells.filter(c => c.selected));

    selectedCells.forEach(dataCell => {
      dataCell.selected = false;
    });
  }

  cellClick(e: Event, cell: Cell) {
    let event = e as MouseEvent;
    if (event.button === 2 && cell.selected) {
      return;
    }
    this.isDisplayContextMenu = false;
    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex && this.selectedCellCoordinates.columnIndex === cell.columnIndex) return;
    if (!event.ctrlKey) {
      this.clearSelection();
    }

    this.table?.focus();
    this.isMouseDown = true;
    this.isEditMode = false;
    this.selectedCellCoordinates = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };

    if (event.shiftKey) {
      this.selectTo(cell.rowIndex, cell.columnIndex);
    } else {
      cell.selected = true;

      this.startCellIndex = cell.columnIndex;
      this.startRowIndex = cell.rowIndex;
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

  // context menu
  async openContextMenu(e: Event, cell: Cell) {
    const event = e as MouseEvent;

    if (event.ctrlKey) {
      return true;
    }
    // To prevent browser's default contextmenu
    e.preventDefault();
    e.stopPropagation();

    if (this.isEditMode) {
      return false;
    }

    this.isDisplayContextMenu = true;

    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    return true;
  }

  handleMenuItemClick(event: any) {
    this.isDisplayContextMenu = false;
    console.log(event.data);
    switch (event.data) {
      case this.contextMenuActions.cut: {
        this.cutSelectedCellsValues();
        break;
      }
      case this.contextMenuActions.paste: {
        this.pasteSelectedCellsValues();
        break
      }
      case this.contextMenuActions.undo: {
        this.undo();
        break
      }
      case this.contextMenuActions.redo: {
        this.redo();
        break
      }
      default:
        break;
    }
  }

}
