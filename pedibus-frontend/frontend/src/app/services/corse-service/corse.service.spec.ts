import { TestBed } from '@angular/core/testing';

import { CorseService } from './corse.service';

describe('CorseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CorseService = TestBed.get(CorseService);
    expect(service).toBeTruthy();
  });
});
