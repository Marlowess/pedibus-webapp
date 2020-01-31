/* ============================================================================================= */
/*                                     LOCAL OBJECTS                                             */
/* ============================================================================================= */
import {MatSnackBar} from '@angular/material';
import {ruoli} from './config';

enum LOG_TYPE {
  ERROR,
  DEBUG,
  INFO,
  WARN,
}

/* ============================================================================================= */
/*                                 PURE FUNCTIONS SECTION                                        */
/* ============================================================================================= */
/** Returns a readable string for each possible user role */
export function getRuolo(ruolo: string = localStorage.getItem('ruolo')): string {
  // const ruolo = localStorage.getItem('ruolo');
  switch (ruolo) {
    case ruoli.genitore:
      return 'genitore';
    case ruoli.accompagnatore:
      return 'accompagnatore';
    case ruoli.amministratore:
      return 'amministratore';
    case ruoli.amministratoreMaster:
      return 'amministratore master';
    case ruoli.segreteria:
      return 'segreteria';
  }
}

/** Creates, from a date object, a string representing milliseconds at midnight */
export function getMillisecAtMidnight(date: Date): string {
  const dateMillisec = new Date(date.toDateString()).getTime().toString();
  return dateMillisec.substring(0, dateMillisec.length - 5) + '00000';
}

/** Creates a Date object from the string returned in various server responses */
export function fromStringToDate(dateString: string): Date {
  const fields = dateString.split('-');
  const day = fields[0]; const month = fields[1]; const year = fields[2];
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Method to compare two different days (only calendar dates, not time)
 * returns 0 if date1 == date2, -1 if date1 < date2, 1 if date1 > date2
 */
export function compareDays(date1: Date, date2: Date): number {
  const date1Number: number = parseInt(getMillisecAtMidnight(date1), 10);
  const date2Number: number = parseInt(getMillisecAtMidnight(date2), 10);
  if (date1Number === date2Number) {
    return 0;
  } else if (date1Number < date2Number) {
    return -1;
  } else {
    return 1;
  }
}

/**
 * Public method used to tell the user, by means of a snack-bar, that a given operation
 * has done something that results either into a success or an error.
 * @param message string
 * @param snackbar object to open
 */
export function openSnackBar(message: string, snackbar: MatSnackBar) {
  snackbar.open(message, 'OK', {
    duration: 2000,
  });
}

export function customLog(allowed: boolean = true, typeLog: string = 'debug', ...message: any[]) {
  // tslint:disable-next-line:variable-name
  let _message = '';
  message.forEach((item: any) => {
    _message += _message + item.toString();
  });
  switch (typeLog) {
    case 'debug':
      // console.log(_message);
      break;
    case 'error':
      console.error(_message);
      break;
    case 'info':
      // tslint:disable-next-line:no-console
      console.info(_message);
      break;
    case 'warn':
      // console.warn(_message);
      break;
  }
}

/* ============================================================================================= */
/*                                 FUNCTIONS WITH UTIL CLASS SECTION                             */
/* ============================================================================================= */

export class Util {

  static readonly LogType = LOG_TYPE;

  static customLog(allowed: boolean = true, typeLog: LOG_TYPE = LOG_TYPE.DEBUG, ...message: any[]) {
    // tslint:disable-next-line:variable-name
    let _message = '';
    message.forEach((item: any) => {
      _message = _message + ' ' + item.toString();
    });
    switch (typeLog) {
      case LOG_TYPE.DEBUG:
        console.log(_message);
        break;
      case LOG_TYPE.ERROR:
        console.error(_message);
        break;
      case LOG_TYPE.INFO:
        // tslint:disable-next-line:no-console
        console.info(_message);
        break;
      case LOG_TYPE.WARN:
        console.warn(_message);
        break;
    }
  }

}
