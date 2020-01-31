import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTurnoComponent } from './dialog-turno.component';

describe('DialogTurnoComponent', () => {
  let component: DialogTurnoComponent;
  let fixture: ComponentFixture<DialogTurnoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogTurnoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTurnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
