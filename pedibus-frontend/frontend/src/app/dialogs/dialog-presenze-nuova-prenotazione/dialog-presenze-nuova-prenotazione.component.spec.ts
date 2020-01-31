import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPresenzeNuovaPrenotazione } from './dialog-presenze-nuova-prenotazione.component';

describe('DialogPresenzeNuovaPrenotazione', () => {
  let component: DialogPresenzeNuovaPrenotazione;
  let fixture: ComponentFixture<DialogPresenzeNuovaPrenotazione>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogPresenzeNuovaPrenotazione ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPresenzeNuovaPrenotazione);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
