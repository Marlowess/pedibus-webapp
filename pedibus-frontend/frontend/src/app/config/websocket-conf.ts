import {config} from './config';

const IP = config.ip;
const PORT = config.port;

/**
 *
 */
export const websocketInfo = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/notification'
};

export const websocketTurniInfo = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/turni'
};

export const websocketDisponibilitaInfo = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/disponibilita'
};

export const websocketDisponibilitaInfoAccompagnatore = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/disponibilita'
};

export const websocketPresenzeInfoAccompagnatore = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/presenze'
};

export const websocketPromuoviDeclassaAccompagnatore = {
    ip: IP,
    port: PORT,
    stompEndpoint: 'ws',
    queueName: '/user/queue/promozione_declassamento'
};
