import { TestBed } from '@angular/core/testing';

import { WebsocketDisponibilitaService } from './websocket-disponibilita.service';

describe('WebsocketDisponibilitaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebsocketDisponibilitaService = TestBed.get(WebsocketDisponibilitaService);
    expect(service).toBeTruthy();
  });
});
