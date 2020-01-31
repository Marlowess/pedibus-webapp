import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PromuoviDeclassaComponent } from './promuovi-declassa.component';

describe('PromuoviDeclassaComponent', () => {
  let component: PromuoviDeclassaComponent;
  let fixture: ComponentFixture<PromuoviDeclassaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PromuoviDeclassaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PromuoviDeclassaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
