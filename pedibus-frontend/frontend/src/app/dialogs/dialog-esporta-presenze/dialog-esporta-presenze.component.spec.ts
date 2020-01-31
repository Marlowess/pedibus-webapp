import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEsportaPresenzeComponent } from './dialog-esporta-presenze.component';

describe('DialogEsportaPresenzeComponent', () => {
  let component: DialogEsportaPresenzeComponent;
  let fixture: ComponentFixture<DialogEsportaPresenzeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogEsportaPresenzeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogEsportaPresenzeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
