import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MappaFermateComponent } from './mappa-fermate.component';

describe('MappaFermateComponent', () => {
  let component: MappaFermateComponent;
  let fixture: ComponentFixture<MappaFermateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MappaFermateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappaFermateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
