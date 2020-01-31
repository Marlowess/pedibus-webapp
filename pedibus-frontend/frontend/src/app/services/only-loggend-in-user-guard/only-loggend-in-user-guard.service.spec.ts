import { TestBed } from '@angular/core/testing';

import { OnlyLoggendInUserGuardService } from './only-loggend-in-user-guard.service';

describe('OnlyLoggendInUserGuardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OnlyLoggendInUserGuardService = TestBed.get(OnlyLoggendInUserGuardService);
    expect(service).toBeTruthy();
  });
});
