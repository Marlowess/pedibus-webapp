import { TestBed } from '@angular/core/testing';

import { WebsocketPresenzeService } from './websocket-presenze.service';

describe('WebsocketPresenzeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebsocketPresenzeService = TestBed.get(WebsocketPresenzeService);
    expect(service).toBeTruthy();
  });
});
