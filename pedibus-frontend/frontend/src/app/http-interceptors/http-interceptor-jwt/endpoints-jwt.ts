import { config } from '../../config/config';

export const ENDPOINTS_JWT = [
  `http://${config.ip}:${config.port}/reservations`,
  `http://${config.ip}:${config.port}/lines`,
  `http://${config.ip}:${config.port}/profile`,
  `http://${config.ip}:${config.port}/availability/accompagnatore`,
  `http://${config.ip}:${config.port}/turni`,
  `http://${config.ip}:${config.port}/notifications/numunread`,
  `http://${config.ip}:${config.port}/notifications/getall`,
  `http://${config.ip}:${config.port}/notifications/segnaletta`,
  `http://${config.ip}:${config.port}/notifications/segnalette`,
  `http://${config.ip}:${config.port}/users`,
  `http://${config.ip}:${config.port}/user`,
  `http://${config.ip}:${config.port}/register`,
  `http://${config.ip}:${config.port}/notifications/cancellatutte`,
  `http://${config.ip}:${config.port}/notifications/cancellacomunicazione`,
  ];
