import {Injectable} from '@angular/core';
import * as convert from 'xml-js';
import {CorsaPresenze} from 'src/app/domain/presenze-domain/corsa';

// var convert = require('xml-js');

enum FILE_EXTENSION {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml'
}

@Injectable({
  providedIn: 'root'
})
export class DownloadPresenzeService {

  constructor() { }

  /**
   * Il metodo publico `downloadFile` viene usato per instanziare il procedimento che servirà per
   * ottenere come risultato il download del file contenente come dati le esportazioni su di una data
   * linea in un certa data in cui un utente accompagnatore è di turno.
   * @param corsa CorsaPresenze
   * @param filename string
   * @param fileExtension string
   */
  public downloadFile(corsa: CorsaPresenze, filename: string = 'presense', fileExtension: string = 'csv'): boolean {

    const result: any = this.prepareBlob(corsa, filename, fileExtension);

    if ( typeof(result) === 'boolean') {
      return result;
    }
    this.downloadResource(result.blob, filename, fileExtension);
    return true;

  }

  /**
   * Il metodo di classe privato `prepareBlob` del servizion `DownloadPresenzeService` ha l'incarico di creare il file
   * nel formato specificato dall'utente che verrà scaricato dall'utente all'interno della cartella download del
   * file system locale, contenente le informazioni inerenti l'esportazione dei dati su una certa linea in una data
   * in cui l'utente accompagnatore è di turno.
   * 
   * @param corsa CorsaPresenze, oggetto che contiene i dati relativi alla corsa in cui l'utente accompagnatore è di turno
   * @param filename string, nome del file
   * @param fileExtension string, estensione del file
   */
  private prepareBlob(corsa: CorsaPresenze, filename: string, fileExtension: string) {
    // window.alert('prepareBlob()');
    let exportedData: any = null;
    // tslint:disable-next-line:variable-name
    let _blob: Blob = null;
    const data: any = null;

    switch (fileExtension.toLowerCase()) {

      case FILE_EXTENSION.CSV:
        exportedData = this.ConvertToCSV(corsa);
        // blob = new Blob(['\ufeff' + dataExported], {
        _blob = new Blob([exportedData], {
          type: 'text/csv;charset=utf-8;'
        });
        break;

      case FILE_EXTENSION.JSON:
        exportedData = corsa.getDataExportedJSON();
        // blob = new Blob(['\ufeff' + JSON.stringify(dataExported)], {
        _blob = new Blob([JSON.stringify(exportedData)], {
          type: 'text/json;charset=utf-8;'
        });
        break;

      // case FILE_EXTENSION.PDF:
      //   const doc: jsPDF = new jsPDF({
      //     orientation: 'landscape',
      //     unit: 'in',
      //     format: [4, 2]
      //   });

      //   exportedData = JSON.stringify(data); // doc.text(dataExported, 10, 10);
      //   doc.text(exportedData, exportedData.length, 1000); // doc.text(dataExported)
      //   doc.save(filename + '.' + fileExtension);
      //   return true;
      // // break;

      case FILE_EXTENSION.XML:
        // dataExported = JSON.stringify(data);
        exportedData = corsa.getDataExportedJSON();

        const options = { compact: true };
        exportedData = convert.json2xml(JSON.stringify(exportedData), options);

        // blob = new Blob(['\ufeff' + dataExported], {
        _blob = new Blob([exportedData], {
          type: 'text/xml;charset=utf-8;'
        });
        break;

      default:
        return false;
    }
    return {
      dataExported: exportedData,
      blob: _blob
    };
  }

  /**
   * Il metodo di classe privato `downloadResource` viene usato per eseguire il download vero e proprio dei dati, corrispondenti
   * all'esportazione effettuata dall'utente accompagnatore.
   * 
   * @param blob Blob, contiene i dati che riguardano l'esportazione
   * @param filename string, nome del file
   * @param fileExtension string estensione del file
   */
  private downloadResource(blob: Blob, filename: string, fileExtension: string) {
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser =
      navigator.userAgent.indexOf('Safari') !== -1
      && navigator.userAgent.indexOf('Chrome') === -1;

    // if Safari open in new window to save file with random filename.
    if (isSafariBrowser) {
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', filename + '.' + fileExtension);
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  /**
   * Il metodo di classe privato `getFullHeader` viene usato per creare l'header del file csv
   * aggiunta come prima riga nel file.
   * @param corsa CorsaPresenze
   */
  private getFullHeader(corsa: CorsaPresenze): string {
    // window.alert('getFullHeader()');

    const headersCorsa: Array<string> = corsa.getHeadersCorsa();
    // window.alert(`getFullHeader() - getHeadersCorsa(): ${JSON.stringify(headersCorsa)}`);

    const headersFermata: Array<string> = corsa.getHeadersFermata();
    // window.alert(`getFullHeader() - getHeadersFermata(): ${JSON.stringify(headersFermata)}`);

    const headersBambinoPasseggero: Array<string> = corsa.getHeadersBambinoPasseggero();
    // window.alert(`getFullHeader() - getHeadersBambinoPasseggero(): ${JSON.stringify(headersBambinoPasseggero)}`);

    let fullHeader: Array<string> = new Array<string>();

    fullHeader = fullHeader.concat(headersCorsa);
    fullHeader = fullHeader.concat(headersFermata, ['direzione']);
    fullHeader = fullHeader.concat(headersBambinoPasseggero, ['sale', 'scende']);

    // window.alert(`getFullHeader() - fullHeader: ${JSON.stringify(fullHeader)}`);

    // tslint:disable-next-line:only-arrow-functions
    const fullHeaderStr: string = fullHeader.reduce(function(prev: string, curr: string) {
      if (prev == null) {
        return curr;
      }
      return prev + ',' + curr;
    }, null);

    // window.alert(`Full header: ${fullHeaderStr}`);

    return fullHeaderStr;
  }

  /**
   * Il metodo `ConvertToCSV` della classe `DownloadPresenzeService` viene utilizzata da questo 
   * servizio per la generazione del file in formato csv contenente le informazioni 
   * riferite all'esportazione delle presenze in una data specifica in cui l'utente accompagnatore ha
   * il turno assegnato su di una data linea e per un certo numero di fermate.
   * 
   * @param corsa CorsaPresenze
   */
  private ConvertToCSV(corsa: CorsaPresenze): string {
    const existsAndata: boolean = corsa.getExistsAndata();
    const existsRitorno: boolean = corsa.getExistsRitorno();

    if (existsAndata === false && existsRitorno === false) { return null; }

    return this.getFullHeader(corsa) + '\r\n' + corsa.getDataExportedCsv();
  }


}
