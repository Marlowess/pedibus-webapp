import { TestBed } from '@angular/core/testing';

import { AccompagnatoreService } from './accompagnatore.service';

describe('AccompagnatoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AccompagnatoreService = TestBed.get(AccompagnatoreService);
    expect(service).toBeTruthy();
  });
});
