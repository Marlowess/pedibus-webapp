/// <reference types="@types/googlemaps" />

/** Classe per i marker visualizzabili nelle mappe di Google (Component 'VisionaLineeFermateMappa') */

export class MappaMarker {

  // google: any;
  public lat: any;
  public lng: any;
  public descrizione: string;
  // public direzione: any;
  public indirizzo: any;
  public icon: any;

  /**
   * @param fermata: oggetto fermata
   * @param pos: la posizione della fermata sulla linea
   * @param n: numero di fermate nella linea
   * @param s: Size, grandezza dell'icona del marker
   * @param o: coordinate dell'origine
   * @param a: coordinate dell'anchor
   */
  constructor(fermata, pos, n, s, o, a) {
    this.lat = fermata.gps.y;
    this.lng = fermata.gps.x;
    this.indirizzo = fermata.indirizzo;
    this.descrizione = fermata.descrizione;
    if (n === pos) { // ultima fermata
      this.icon = '';
    } else {
      this.icon = {
        url: './assets/marker-image.svg',
        scaledSize: s, // new google.maps.Size(16, 16)
        origin: o, // new google.maps.Point(0, 0)
        anchor: a // new google.maps.Point(8, 8)
      };
    }
  }

}
