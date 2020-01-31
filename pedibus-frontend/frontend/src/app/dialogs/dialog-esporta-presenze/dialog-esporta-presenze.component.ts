import {Component, Inject, OnInit} from '@angular/core';
import {DownloadPresenzeService} from '../../services/download-presenze/download-presenze.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {CorsaPresenze} from '../../domain/presenze-domain/corsa';

export interface ExportDialogData {
  corsa: CorsaPresenze;
}

@Component({
  selector: 'app-dialog-esporta-presenze',
  templateUrl: './dialog-esporta-presenze.component.html',
  styleUrls: ['./dialog-esporta-presenze.component.css']
})
export class DialogEsportaPresenzeComponent implements OnInit {

  // exportTypes = ['xml', 'json', 'pdf', 'csv'];
  exportTypes = ['xml', 'json', 'csv'];
  typeFormatExportData = this.exportTypes[0];

  constructor(
    private downloadPresenzeService: DownloadPresenzeService,
    public dialogRef: MatDialogRef<DialogEsportaPresenzeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) { }

  ngOnInit() { }

  onSelectFormat(typeFormatSelected: string) {
    this.typeFormatExportData = typeFormatSelected;
    // window.alert(typeFormatSelected);
  }

  exportPresenze() {
    // window.alert('Export Presenze');
    this.downloadPresenzeService.downloadFile(this.data.corsa, 'presenze', this.typeFormatExportData);
    this.dialogRef.close();
  }

  annulla(): void {
    this.dialogRef.close();
  }

}
