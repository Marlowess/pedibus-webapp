import { TestBed } from '@angular/core/testing';

import { DownloadPresenzeService } from './download-presenze.service';

describe('DownloadPresenzeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DownloadPresenzeService = TestBed.get(DownloadPresenzeService);
    expect(service).toBeTruthy();
  });
});
