import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisionaLineeFermateMappaComponent } from './visiona-linee-fermate-mappa.component';

describe('VisionaLineeFermateMappaComponent', () => {
  let component: VisionaLineeFermateMappaComponent;
  let fixture: ComponentFixture<VisionaLineeFermateMappaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisionaLineeFermateMappaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisionaLineeFermateMappaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
