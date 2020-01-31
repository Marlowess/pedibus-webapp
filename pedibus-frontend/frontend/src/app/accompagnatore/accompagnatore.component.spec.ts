import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccompagnatoreComponent } from './accompagnatore.component';

describe('AccompagnatoreComponent', () => {
  let component: AccompagnatoreComponent;
  let fixture: ComponentFixture<AccompagnatoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccompagnatoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccompagnatoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
