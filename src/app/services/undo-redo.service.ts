import { Injectable } from '@angular/core';

export class Change {
  beforeValue: any;
  afterValue: any;
  coordinates = { rowIndex: 0, columnIndex: 0 }
  constructor(pagObj?: Change) {
    Object.assign(this, pagObj);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UndoRedoService {

  private _changesForUndo: Change[] = [];
  private _changesForRedo: Change[] = [];
  private stackSize = 10;

  constructor() { }

  setStackSize(size: number) {
    this.stackSize = size;
  }

  setChange(change: Change) {
    this._changesForUndo.push(change);
  }

  undo() {
    let lastChange = this._changesForUndo.pop();
    if (lastChange) {
      this._changesForRedo.push(new Change({ coordinates: lastChange.coordinates, afterValue: lastChange.beforeValue, beforeValue: lastChange.afterValue }));
      if (this._changesForRedo.length === this.stackSize) {
        this._changesForRedo.shift();
      }
    }
    return lastChange;
  }

  redo() {
    let lastChange = this._changesForRedo.pop();
    if (lastChange) {
      this._changesForUndo.push(new Change({ coordinates: lastChange.coordinates, afterValue: lastChange.beforeValue, beforeValue: lastChange.afterValue }));
      if (this._changesForUndo.length === this.stackSize) {
        this._changesForUndo.shift();
      }
    }
    return lastChange;
  }
}
