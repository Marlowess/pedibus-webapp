import { TestBed } from '@angular/core/testing';

import { PresenzeService } from './presenze.service';

describe('PresenzeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PresenzeService = TestBed.get(PresenzeService);
    expect(service).toBeTruthy();
  });
});
