import { BambinoPresenze } from './bambino-presenze';

interface BambinoPresenzeBuilderI {
  prenotazioneID(prenotazioneID: any): any;
}

export class BambinoPresenzeBuilder implements BambinoPresenzeBuilderI {

  // Static Singletone BambinoPresenzeBuilder instance.
  static builder: BambinoPresenzeBuilder = null;

  // instance's private attributes.
  private mapValues: Map<string, any> = null;
  private attributeNamesList: Array<string> = [
    'prenotazioneID',
    'nome',
    'presente',
    'prenotatoDaGenitore',
  ];

  // Private Constructor.
  private constructor() {
    this.reset();
  }

  /**
   * Static method `getBuilder` allows to obtain a singletone-like instance of `BambinoPresenzeBuilder` class.
   * @returns BambinoPresenzeBuilder
   * @throws dict = {
   *                 code: -1,
   *                 message: 'Error: unable to create a singletone instance of class BambinoPresenzeBuilder.'
   *                }
   */
  static getBuilder(): BambinoPresenzeBuilder {
    try {
      if (BambinoPresenzeBuilder.builder == null) {
        BambinoPresenzeBuilder.builder = new BambinoPresenzeBuilder();
      }
      return BambinoPresenzeBuilder.builder;
    } catch (err) {
      throw {
        code: -1,
        message: 'Error: unable to create a singletone instance of class BambinoPresenzeBuilder.'
      };
    }
  }

  public reset() {
    this.mapValues = new Map<string, any>();
    this.attributeNamesList
      .forEach((attributeName: string) => {
        this.mapValues[attributeName] = null;
      });
  }

  /**
   * Private instance's method `getDefaultValue` which retrieve a default hardcode
   * value for the provided attribute-name used later to construct a instance of class `CorsaPresenze`
   * @param attributeName string
   * @returns any
   */
  private getDefaultValue(attributeName: string): any {
    switch (attributeName) {
      case 'prenotazioneID': return null;
      case 'nome': return null;
      case 'presente': return false;
      case 'prenotatoDaGenitore': return false;
    }
  }

  /**
   * Public instance's method `build` of `BambinoPresenzeBuilder` class, which allows
   * to retrieve a new instance of class `BambinoPresenze`.
   * The method set to default values if some attributes about `BambinoPresenze` class do not
   * have been set to a specific value different to the default one, in order to let the building to success.
   * This method automatically takes care of resetting the builder in order to
   * let the `singletone instance` of such a class to be ready for building another requested instance.
   * @returns BambinoPresenze
   * @throws dict = {
   *                 code: -1,
   *                 message: 'Error: unable to construct a CorsaPresenze new instance.'
   *                }
   */
  public build(): BambinoPresenze {
    try {
      this.attributeNamesList
        .forEach((attributeName: string) => {
          if (this.mapValues[attributeName] == null) {
            this.mapValues[attributeName] = this.getDefaultValue(attributeName);
          }
        });

      const result = new BambinoPresenze(
        this.mapValues['prenotazioneID'],
        this.mapValues['nome'],
        this.mapValues['presente'],
        this.mapValues['prenotatoDaGenitore'],
      );

      this.reset();
      return result;
    } catch (err) {
      throw {
        code: -1,
        message: 'Error: unable to construct a CorsaPresenze new instance.'
      };
    }
  }

  /**
   * Public method `prenotazioneID` allows to set value for prenotazioneID attribute.
   * @param prenotazioneID string
   * @returns BambinoPresenzeBuilder
   */
  public prenotazioneID(prenotazioneID: string): BambinoPresenzeBuilder {
    this.mapValues['prenotazioneID'] = prenotazioneID;
    return BambinoPresenzeBuilder.builder;
  }

  /**
   * Public method `nome` allows to set value for nome attribute.
   * @param nome string
   * @returns BambinoPresenzeBuilder
   */
  public nome(nome: string) {
    this.mapValues['nome'] = nome;
    return BambinoPresenzeBuilder.builder;
  }

  /**
   * Public method `presente` allows to set value for presente attribute.
   * @param presente boolean
   * @returns BambinoPresenzeBuilder
   */
  public presente(presente: boolean) {
    this.mapValues['presente'] = presente;
    return BambinoPresenzeBuilder.builder;
  }

  /**
   * Public method `prenotatoDaGenitore` allows to set value for prenotatoDaGenitore attribute.
   * @param prenotatoDaGenitore boolean
   * @returns BambinoPresenzeBuilder
   */
  public prenotatoDaGenitore(prenotatoDaGenitore: boolean) {
    this.mapValues['prenotatoDaGenitore'] = prenotatoDaGenitore;
    return BambinoPresenzeBuilder.builder;
  }

}
