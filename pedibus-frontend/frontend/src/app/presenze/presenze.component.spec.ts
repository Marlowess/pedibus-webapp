import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenzeComponent } from './presenze.component';

describe('PresenzeComponent', () => {
  let component: PresenzeComponent;
  let fixture: ComponentFixture<PresenzeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresenzeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresenzeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
