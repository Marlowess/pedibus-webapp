import { Turno2 } from './turno2';
import { AccompagnatoreConTurni } from './accompagnatore-con-turni';
import { FermataConAccompagnatori2} from './fermata-con-accompagnatori2';

export class NotificationTurniManagerUI {

    /**
     * The public instance's method `addOnNotificationTurniUI` is invoked when a new Turno is added
     * by another user of type `Linea Amministrator` in order to let others knowing about this new fact.
     * In particular the method is used when the action set within the new notification received is
     * equal to `add_turno`.
     * @param result
     * @param corsa
     * @param accompagnatoriTurni
     * @param noTurno
     * @param dictGetTurnoFermate
     */
    static addOnNotificationTurniUI(result: any, corsa: any, accompagnatoriTurni: any, noTurno: any, dictGetTurnoFermate: any) {

        // - Do nothing if anything checked here is equal to null value.
        if (corsa == null) return;
        if (dictGetTurnoFermate.fermate == null) return;
        if (accompagnatoriTurni == null) return;

        const turnoAggiunto = result;

        // - Create a new instance of type Turno2.
        const nuovoTurno = new Turno2(
            turnoAggiunto.id, corsa.nomeLinea, corsa.data, turnoAggiunto.corsa.direzione,
            turnoAggiunto.user.id, turnoAggiunto.fermataPartenza.id, turnoAggiunto.fermataArrivo.id,
            false
        );
        // - Create a new instance of type AccompagnatoreConTurni.
        const accompagnatore = new AccompagnatoreConTurni(
            turnoAggiunto.user.id, turnoAggiunto.user.nome, turnoAggiunto.user.cognome, turnoAggiunto.user.email,
            NotificationTurniManagerUI.newTurnoFrom(noTurno), NotificationTurniManagerUI.newTurnoFrom(noTurno),
            NotificationTurniManagerUI.newTurnoFrom(noTurno), NotificationTurniManagerUI.newTurnoFrom(noTurno)
        );

        // - Update data structures belonging to the model
        NotificationTurniManagerUI.updateAfterAdd(nuovoTurno, accompagnatore, accompagnatoriTurni, dictGetTurnoFermate);
        // - Then, update the UI itself.
        NotificationTurniManagerUI.updateView('add', corsa, false, nuovoTurno, nuovoTurno.direzione, dictGetTurnoFermate);
    }

    /* ========================================================================================= */
    /**
    * The static method `addDisponabilitaOnNotificationTurniUI` is used when a new notification from server with a field `azione` equals
    * to `add_disponibilita` says that it might be necessary to update the UI in order to show or display the new disponibilita about a
    * user of type accompagnatore.
    * @param result 
    * @param corsa 
    * @param fermate 
    * @param dictGetTurnoFermate 
    */
    static addDisponabilitaOnNotificationTurniUI(result: any, corsa: any, fermate: any, dictGetTurnoFermate: any) {
        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFalg, result.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        let noTurno = dictGetTurnoFermate.noTurno;
        const accompagnatore = new AccompagnatoreConTurni(
            result.user.id, result.user.nome, result.user.cognome, result.user.email,
            NotificationTurniManagerUI.newTurnoFrom(noTurno), NotificationTurniManagerUI.newTurnoFrom(noTurno),
            NotificationTurniManagerUI.newTurnoFrom(noTurno), NotificationTurniManagerUI.newTurnoFrom(noTurno)
        )
        corsa[fermate].forEach((fermata: FermataConAccompagnatori2) => {
            // fermata.accompagnatori.push(accompagnatore)
            // Redundant check to avoid adding an already inserted user of type accompagnatore to the current corsa.
            let result = fermata.accompagnatori.filter(a => {
                return (a.id == accompagnatore.id);
            });
            if (result.length == 0) {
                fermata.accompagnatori.push(NotificationTurniManagerUI.newAccompagnatoreFrom(accompagnatore));
            }
        });
    }

    /* ========================================================================================= */
    /**
     * The static method `deleteDisponabilitaOnNotificationTurniUI` is invoked when `delete_disponibilita` action is
     * provided after a new notification from server is sent and received by the client.
     * @param result 
     * @param corsa 
     * @param accompagnatoriTurni 
     * @param tempAccompagnatoriTurni 
     * @param dictGetTurnoFermate 
     */
    static deleteDisponabilitaOnNotificationTurniUI(result: any, corsa: any, accompagnatoriTurni: any, tempAccompagnatoriTurni: any, dictGetTurnoFermate: any) {

        // userId we wanto to remove.
        const userId = result.user.id;
        const fermate = dictGetTurnoFermate.fermate;

        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFalg, result.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        // elimina dalla corsa:
        corsa[fermate].forEach(
            (fermata: FermataConAccompagnatori2) => {
                fermata.accompagnatori =
                    fermata.accompagnatori.filter((acc: AccompagnatoreConTurni) => {
                        return acc.id != userId;
                    });
            });

        // accompagnatori con turni:
        accompagnatoriTurni =
            accompagnatoriTurni.filter(
                (acc: AccompagnatoreConTurni) => {
                    return acc.id != userId;
                }
            );

        // accompagnatori con turni:
        tempAccompagnatoriTurni =
            tempAccompagnatoriTurni.filter(
                (acc: AccompagnatoreConTurni) => {
                    return acc.id != userId;
                }
            );
        return {
            accompagnatoriTurni: accompagnatoriTurni,
            tempAccompagnatoriTurni: tempAccompagnatoriTurni
        }
    }

    /* ========================================================================================= */
    static confirmedOnNotificationTurniUI(result: any, accompagnatoriTurni: any, corsa: any, turnoFlag: any, dictGetTurnoFermate: any) { // this.turno = turnoFlag
        const turno = new Turno2(
            result.id, corsa.nomeLinea, corsa.data, result.corsa.direzione,
            result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
            true
        );

        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFalg, dictGetTurnoFermate.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);
        accompagnatoriTurni.forEach(a => { if (a.id === turno.userId) { a[turnoFlag].confermato = true; } });

        NotificationTurniManagerUI.updateView('modify', corsa, false, turno, turno.direzione, dictGetTurnoFermate);
    }

    /* ========================================================================================= */
    /**
     * The static method `updateOnNotificationTurniUI` is invoked when a new notification from server is sent to the client
     * for let it knowing that it might be necessary to update the UI in order to show the new updates.
     * @param result 
     * @param corsa 
     * @param accompagnatoriTurni 
     * @param dictGetTurnoFermate 
     */
    static updateOnNotificationTurniUI(result: any, corsa: any, accompagnatoriTurni: any, dictGetTurnoFermate: any) {

        // - Do nothing if anything checked here is equal to null value.
        if (corsa == null) return;
        if (dictGetTurnoFermate.fermate == null) return;
        if (accompagnatoriTurni == null) return;

        const turno = new Turno2(
            result.id, corsa.nomeLinea, corsa.data, result.corsa.direzione,
            result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
            false
        );

        NotificationTurniManagerUI.updateAfterModify(turno, accompagnatoriTurni, dictGetTurnoFermate);
        NotificationTurniManagerUI.updateView('modify', corsa, false, turno, turno.direzione, dictGetTurnoFermate);
    }

    /* ========================================================================================= */
    static deleteOnNotificationTurniUI(result: any, corsa: any, accompagnatoriTurni: any, dictGetTurnoFermate: any) {
        const turno = new Turno2(
            result.id, corsa.nomeLinea, corsa.data, result.corsa.direzione,
            result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
            true
        );
        NotificationTurniManagerUI.updateAfterDelete(turno.userId, turno.direzione, accompagnatoriTurni, false, dictGetTurnoFermate);
        NotificationTurniManagerUI.updateView('delete', corsa, false, turno, turno.direzione, dictGetTurnoFermate);
    }

    /* ========================================================================================= */
    static getTurnoFermate(turno: any, direzione: number, fermate: any, turnoBackup: any) {
        if (direzione === 0) {
            fermate = 'fermateConAccAndata'; turno = 'turnoAndata'; turnoBackup = 'turnoAndataVecchio';
        } else {
            fermate = 'fermateConAccRitorno'; turno = 'turnoRitorno'; turnoBackup = 'turnoRitornoVecchio';
        }

        return {
            turno: turno,
            fermate: fermate,
            turnoBackup: turnoBackup
        }
    }

    /* ========================================================================================= */
    static updateView(action: string, corsa: any, error: boolean, turno: Turno2, direzione: number, dictGetTurnoFermate: any) {
        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFalg, dictGetTurnoFermate.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        let fermate = dictGetTurnoFermate.fermate;
        let noTurno = dictGetTurnoFermate.noTurno;
        let turnoFlag = dictGetTurnoFermate.turnoFlag;

        // window.alert(JSON.stringify(dictGetTurnoFermate));

        // - Zeroed some variables.
        let foundPartenza = false; let foundArrivo = false;

        if (corsa == null || fermate == null) {
            // window.alert(JSON.stringify(dictGetTurnoFermate));
            // window.alert(JSON.stringify(corsa));
        }
        corsa[fermate].forEach(fermata => {
            fermata.accompagnatori.forEach(accompagnatore => {
                if (accompagnatore.id === turno.userId) {
                    if (((action === 'add') && error) || ((action === 'delete') && !error)) {
                        accompagnatore[turnoFlag] = NotificationTurniManagerUI.newTurnoFrom(noTurno);
                        // console.log(accompagnatore[this.turno].id);
                    } else {
                        if (fermata.id === turno.fermataPartenzaId) {
                            foundPartenza = true;
                        }
                        if (foundPartenza && !foundArrivo) {
                            if (((action === 'add') && !error) || ((action === 'modify') && !error)) {
                                accompagnatore[turnoFlag] = NotificationTurniManagerUI.newTurnoFrom(turno);
                                // accompagnatore[this.turno].confermato = false;
                            } else if (((action === 'modify') && error) || ((action === 'delete') && error)) {
                                accompagnatore[turnoFlag] = NotificationTurniManagerUI.newTurnoFrom(turno); // gli ho passato il turnoBackup
                                // accompagnatore[this.turno].confermato = wasConfirmed;
                            }
                        } else {
                            accompagnatore[turnoFlag] = NotificationTurniManagerUI.newTurnoFrom(noTurno);
                        }
                        if (fermata.id === turno.fermataArrivoId) { // turno.fermataArrivoId
                            foundArrivo = true;
                        }
                    }
                }
            });
        });
    }

    /* ========================================================================================= */
    static updateAfterAdd(
        turnoAggiunto: Turno2, accompagnatore: AccompagnatoreConTurni,
        accompagnatori: AccompagnatoreConTurni[], dictGetTurnoFermate: any) {

        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFlag, turnoAggiunto.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        let turnoFlag = dictGetTurnoFermate.turnoFlag;

        const accompIndex = accompagnatori.findIndex(a => a.id === accompagnatore.id); // turnoAggiunto.user.id
        if (accompIndex === -1) {
            accompagnatore[turnoFlag] = turnoAggiunto;
            accompagnatori.push(accompagnatore);
        } else {
            accompagnatori[accompIndex][turnoFlag] = turnoAggiunto;
        }
    }

    static updateAfterModify(turnoModificato: Turno2, accompagnatori: AccompagnatoreConTurni[], dictGetTurnoFermate: any) {

        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFlag, turnoModificato.direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        let turnoFlag = dictGetTurnoFermate.turnoFlag;
        accompagnatori.forEach(a => {
            if (a.id === turnoModificato.userId) {
                a[turnoFlag].fermataPartenzaId = turnoModificato.fermataPartenzaId;
                a[turnoFlag].fermataArrivoId = turnoModificato.fermataArrivoId;
                a[turnoFlag].confermato = false; // a.assegnato = true;
            }
        });
    }

    /* ========================================================================================= */
    static updateAfterDelete(
        accompagnatoreID: string,
        direzione: number,
        accompagnatori: AccompagnatoreConTurni[],
        temp: boolean, dictGetTurnoFermate: any) {

        NotificationTurniManagerUI.getTurnoFermate(dictGetTurnoFermate.turnoFlag, direzione, dictGetTurnoFermate.fermate, dictGetTurnoFermate.turnoBackup);

        let turnoFlag = dictGetTurnoFermate.turnoFlag;
        let noTurno = dictGetTurnoFermate.noTurno;

        const accompIndex = accompagnatori.findIndex(a => a.id === accompagnatoreID);
        if (temp) {
            accompagnatori[accompIndex][turnoFlag].fermataPartenzaId = null;
            accompagnatori[accompIndex][turnoFlag].fermataArrivoId = null;
            accompagnatori[accompIndex][turnoFlag].confermato = null;
        } else {
            accompagnatori[accompIndex][turnoFlag] = noTurno;
        }

        if (accompagnatori[accompIndex].turnoAndata.fermataPartenzaId === null &&
            accompagnatori[accompIndex].turnoRitorno.fermataPartenzaId === null) {
            accompagnatori.splice(accompIndex, 1);
        }
    }

    /* ========================================================================================= */
    static newTurnoFrom(turno: Turno2): Turno2 {
        return new Turno2(turno.id, turno.nomeLinea, turno.data, turno.direzione, turno.userId,
            turno.fermataPartenzaId, turno.fermataArrivoId, turno.confermato);
    }

    /* =========================================================================================== */
    /**
    * This static class method, `AccompagnatoreConTurni`, is invoked for get easier to create a copy of an existing
    * instance of type `AccompagnatoreConTurni`
    * @param turno Turno2
    * @returns Turno2
    */
    static newAccompagnatoreFrom(a: AccompagnatoreConTurni): AccompagnatoreConTurni {
        return new AccompagnatoreConTurni(a.id, a.nome, a.cognome, a.email,
            this.newTurnoFrom(a.turnoAndata), this.newTurnoFrom(a.turnoAndata),
            this.newTurnoFrom(a.turnoAndataVecchio), this.newTurnoFrom(a.turnoRitornoVecchio));
    }

    /* =========================================================================================== */
    /*                            Here ends `NotificationTurniManagerUI` class                     */
    /* =========================================================================================== */
}
