import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogRecuperaPasswordComponent } from './dialog-recupera-password.component';

describe('DialogRecuperaPasswordComponent', () => {
  let component: DialogRecuperaPasswordComponent;
  let fixture: ComponentFixture<DialogRecuperaPasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogRecuperaPasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogRecuperaPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
