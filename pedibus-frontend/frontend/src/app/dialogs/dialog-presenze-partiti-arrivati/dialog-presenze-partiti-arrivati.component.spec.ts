import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPresenzePartitiArrivatiComponent } from './dialog-presenze-partiti-arrivati.component';

describe('DialogPresenzePartitiArrivatiComponent', () => {
  let component: DialogPresenzePartitiArrivatiComponent;
  let fixture: ComponentFixture<DialogPresenzePartitiArrivatiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogPresenzePartitiArrivatiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPresenzePartitiArrivatiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
