import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCreaPrenotazioneComponent } from './dialog-crea-prenotazione.component';

describe('DialogCreaPrenotazioneComponent', () => {
  let component: DialogCreaPrenotazioneComponent;
  let fixture: ComponentFixture<DialogCreaPrenotazioneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogCreaPrenotazioneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogCreaPrenotazioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
