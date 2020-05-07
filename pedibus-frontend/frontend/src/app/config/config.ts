/// <reference types="@types/googlemaps" />

const IP = '192.168.43.196';
// const IP = '192.168.8.100';

export const config = {
  ip: IP,
  port: '8080'
};

/** Server side constants for each user role */
export enum ruoli {
  genitore = 'ROLE_PASSEGGERO',
  accompagnatore = 'ROLE_ACCOMPAGNATORE',
  amministratore = 'ROLE_ADMIN',
  amministratoreMaster = 'ROLE_ADMIN_MASTER',
  segreteria = 'ROLE_SEGRETERIA'
}

/** Min and max selectable dates from the app date-pickers */
export const configDatePicker = {
  minDate: new Date(2000, 0, 1),
  maxDate: new Date(2040, 11, 31),
};

/** Maps constants */
export const API_KEY_GOOGLE_MAPS = [YOUR_API_KEY];
export const DEFAULT_COORDS: any = {
  lat: 45.0701176, // lat: 45.01,
  lng:  7.6800000// lng: 7.809007
};
