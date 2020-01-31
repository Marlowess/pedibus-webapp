import { TestBed } from '@angular/core/testing';

import { WebsocketNotificationService } from './websocket-notification.service';

describe('WebsocketNotificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebsocketNotificationService = TestBed.get(WebsocketNotificationService);
    expect(service).toBeTruthy();
  });
});
