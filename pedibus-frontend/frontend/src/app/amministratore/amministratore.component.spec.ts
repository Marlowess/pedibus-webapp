import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmministratoreComponent } from './amministratore.component';

describe('AmministratoreComponent', () => {
  let component: AmministratoreComponent;
  let fixture: ComponentFixture<AmministratoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmministratoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmministratoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
