import { TestBed } from '@angular/core/testing';

import { WebsocketTurniService } from './websocket-turni.service';

describe('WebsocketTurniService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebsocketTurniService = TestBed.get(WebsocketTurniService);
    expect(service).toBeTruthy();
  });
});
