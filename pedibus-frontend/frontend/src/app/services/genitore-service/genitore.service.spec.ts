import { TestBed } from '@angular/core/testing';

import { GenitoreService } from './genitore.service';

describe('GenitoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GenitoreService = TestBed.get(GenitoreService);
    expect(service).toBeTruthy();
  });
});
