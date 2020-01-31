import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ManagerNavbarService {
  private subject: Subject<any>;
  constructor() {
    this.subject = new Subject();
  }

  getUpdateNavBar(): Observable<string> {
    return this.subject.asObservable();
  }

  emitUpdateNavBar(ruolo: string): void {
    this.subject.next(ruolo);
  }

}
