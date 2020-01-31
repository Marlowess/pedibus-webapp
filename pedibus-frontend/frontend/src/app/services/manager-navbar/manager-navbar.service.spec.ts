import { TestBed } from '@angular/core/testing';

import { ManagerNavbarService } from './manager-navbar.service';

describe('ManagerNavbarService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ManagerNavbarService = TestBed.get(ManagerNavbarService);
    expect(service).toBeTruthy();
  });
});
