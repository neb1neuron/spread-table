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

