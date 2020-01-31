import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProfiloComponent } from './dialog-profilo.component';

describe('DialogProfiloComponent', () => {
  let component: DialogProfiloComponent;
  let fixture: ComponentFixture<DialogProfiloComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogProfiloComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogProfiloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
