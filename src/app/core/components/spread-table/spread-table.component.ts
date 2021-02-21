import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Cell, Row } from 'src/app/models/cell.model';
import { UndoRedoService } from 'src/app/services/undo-redo.service';
import { EnumType } from 'typescript';
import { ContextMenuModel } from '../../models/context-menu.model';

@Component({
  selector: 'spread-table',
  templateUrl: './spread-table.component.html',
  styleUrls: ['./spread-table.component.scss']
})
export class SpreadTableComponent implements AfterViewInit {
  table = document.getElementById('spreadTable');

  @Input() columnWidth = 100;
  @Input() rawData: any = null;
  // this needs to be a more complex object that contains dispayName and propertyName to be able to map from the rawData json
  @Input() columnNames: string[] = [];

  rowsNumber = 100;
  rowsNumbers = [].constructor(this.rowsNumber);
  columnsNumber = 10;
  focus = true;

  data: Row[] = [];
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

  constructor(private undoRedoService: UndoRedoService,) {
    this.createData();
  }

  createData() {
    for (let j = 0; j < this.columnsNumber; j++) {
      this.columnNames.push('Column ' + j);
    }

    for (let i = 0; i < this.rowsNumber; i++) {
      let row = new Row({ rowIndex: i, cells: [] });
      for (let j = 0; j < this.columnsNumber; j++) {
        row.cells.push({ value: Math.random().toString(36).substr(0, 5), rowIndex: i, columnIndex: j });
      }
      this.data.push(row);
    }
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

  getDataCell(rowIndex: number, columnIndex: number): Cell | undefined {
    return this.data.find(d => d.rowIndex === rowIndex)?.cells.find(c => c.columnIndex === columnIndex);
  }

  doubleClick(cell: Cell) {
    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex && this.selectedCellCoordinates.columnIndex === cell.columnIndex && this.isEditMode) return;
    this.clearSelection();
    this.isMouseDown = false;
    this.isEditMode = true;
    this.focus = true;
    this.selectedCellCoordinates = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };

    this.form = new FormGroup({});

    this.data[cell.rowIndex].cells.forEach((cellData, index) => {
      this.form.addControl(this.columnNames[index], new FormControl(cellData?.value));
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
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    selectedCells.forEach(cell => {
      let cellData = this.getDataCell(cell.rowIndex, cell.columnIndex);
      if (cellData) cellData.value = null;
    });

  }

  setCellValue(columnName: string, cell: Cell) {
    if (cell.value !== this.form.value[columnName]) {
      this.undoRedoService.setChange({
        coordinates:
          { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        beforeValue: cell.value,
        afterValue: this.form.value[columnName]
      });
      cell.value = this.form.value[columnName];
    }
    this.isEditMode = false;
    this.selectedCellCoordinates = undefined;
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
    this.clearSelection();
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
        // paste action
        break
      }
      default:
        break;
    }
  }

}
