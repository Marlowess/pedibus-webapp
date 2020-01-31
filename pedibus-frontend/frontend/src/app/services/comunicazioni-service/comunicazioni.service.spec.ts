import { TestBed } from '@angular/core/testing';

import { ComunicazioniService } from './comunicazioni.service';

describe('ComunicazioniService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ComunicazioniService = TestBed.get(ComunicazioniService);
    expect(service).toBeTruthy();
  });
});
