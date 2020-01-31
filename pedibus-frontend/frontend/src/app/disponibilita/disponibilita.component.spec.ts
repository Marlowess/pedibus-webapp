import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisponibilitaComponent } from './disponibilita.component';

describe('DisponibilitaComponent', () => {
  let component: DisponibilitaComponent;
  let fixture: ComponentFixture<DisponibilitaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisponibilitaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisponibilitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
