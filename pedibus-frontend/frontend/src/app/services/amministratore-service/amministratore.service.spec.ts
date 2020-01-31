import { TestBed } from '@angular/core/testing';

import { AmministratoreService } from './amministratore.service';

describe('AmministratoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AmministratoreService = TestBed.get(AmministratoreService);
    expect(service).toBeTruthy();
  });
});
