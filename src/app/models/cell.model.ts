export class Cell {
  public value?: any;
  public selected?= false;
  public disabled?= false;
  public rowIndex = 0;
  public columnIndex = 0;
  public errors?: string[] = [];

  constructor(pagObj?: Cell) {
    Object.assign(this, pagObj);
  }
}

export class Row {
  public cells: Cell[] = [];
  public rowIndex = 0;
  public selected?= false;
  public disabled?= false;
  public hasErrors?= false;

  constructor(pagObj?: Row) {
    Object.assign(this, pagObj);
  }
}

