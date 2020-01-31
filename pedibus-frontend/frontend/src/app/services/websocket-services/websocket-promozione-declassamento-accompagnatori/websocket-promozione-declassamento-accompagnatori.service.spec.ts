import { TestBed } from '@angular/core/testing';

import { WebsocketPromozioneDeclassamentoAccompagnatoriService } from './websocket-promozione-declassamento-accompagnatori.service';

describe('WebsocketPromozioneDeclassamentoAccompagnatoriService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebsocketPromozioneDeclassamentoAccompagnatoriService = TestBed.get(WebsocketPromozioneDeclassamentoAccompagnatoriService);
    expect(service).toBeTruthy();
  });
});
