/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { UndoRedoService } from './undo-redo.service';

describe('Service: UndoRedo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UndoRedoService]
    });
  });

  it('should ...', inject([UndoRedoService], (service: UndoRedoService) => {
    expect(service).toBeTruthy();
  }));
});
