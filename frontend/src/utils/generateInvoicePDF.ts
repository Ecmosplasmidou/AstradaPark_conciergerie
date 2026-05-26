import jsPDF from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  slotNumber: number;
  carModel?: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  type: 'prorata' | 'mensuel' | 'globale';
  createdAt?: string;
}

export function generateInvoicePDF(invoice: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ═══════════════════════════════════════════
  // CALCULS DE LA TVA (20%)
  // ═══════════════════════════════════════════
  const amountHT = invoice.amount;
  const tvaRate = 0.20;
  const amountTVA = amountHT * tvaRate;
  const amountTTC = amountHT + amountTVA;

  // ═══════════════════════════════════════════
  // COULEURS
  // ═══════════════════════════════════════════
  const gold = [212, 168, 83] as const;
  const dark = [15, 15, 15] as const;
  const grey = [120, 120, 120] as const;
  const lightGrey = [200, 200, 200] as const;

  // ═══════════════════════════════════════════
  // EN-TÊTE ENTREPRISE
  // ═══════════════════════════════════════════

  // Bandeau supérieur doré
  doc.setFillColor(...gold);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Nom entreprise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...dark);
  doc.text('KELVAL SARL', 20, 28);

  // Sous-titre
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text('CONCIERGERIE AUTOMOBILE DE PRESTIGE', 20, 35);

  // Numéro de facture (droite)
  doc.setFontSize(10);
  doc.setTextColor(...grey);
  doc.text('FACTURE', pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, pageWidth - 20, 28, { align: 'right' });

  // Date de création
  doc.setFontSize(9);
  doc.setTextColor(...grey);
  const dateCreation = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  doc.text(`Date : ${dateCreation}`, pageWidth - 20, 35, { align: 'right' });

  // Ligne de séparation dorée
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(20, 42, pageWidth - 20, 42);

  // ═══════════════════════════════════════════
  // INFORMATIONS ENTREPRISE & CLIENT
  // ═══════════════════════════════════════════
  let y = 55;

  // Colonne gauche : Entreprise
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', 20, y);

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text('KELVAL SARL', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  doc.text('7 bis, rue du Pont St Pierre', 20, y);
  y += 5;
  doc.text('31300 TOULOUSE', 20, y);
  y += 7;
  doc.setFontSize(8);
  doc.text('SIRET : 438 527 640 00017', 20, y);
  y += 4;
  doc.text('TVA Intracom : FR 62 438 527 640', 20, y);
  y += 4;
  doc.text('Tél : 06 64 944 540', 20, y);

  // Colonne droite : Client
  let yClient = 55;
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE', pageWidth - 90, yClient);

  yClient += 8;
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.clientPrenom} ${invoice.clientNom}`, pageWidth - 90, yClient);
  yClient += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  doc.text(invoice.clientEmail, pageWidth - 90, yClient);
  yClient += 5;
  doc.text('7 bis, rue du Pont St Pierre', pageWidth - 90, yClient);
  yClient += 5;
  doc.text('31300 TOULOUSE', pageWidth - 90, yClient);

  // ═══════════════════════════════════════════
  // DÉTAILS DE LA FACTURE — TABLEAU
  // ═══════════════════════════════════════════
  const tableY = 110;

  // En-tête du tableau
  doc.setFillColor(...dark);
  doc.rect(20, tableY, pageWidth - 40, 10, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', 25, tableY + 7);
  doc.text('PÉRIODE', 95, tableY + 7);
  doc.text('MONTANT HT', pageWidth - 25, tableY + 7, { align: 'right' });

  // Ligne de contenu
  const rowY = tableY + 10;
  doc.setFillColor(248, 248, 248);
  doc.rect(20, rowY, pageWidth - 40, 22, 'F');

  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  const description = invoice.type === 'prorata'
    ? `Stationnement Place #${invoice.slotNumber} (prorata)`
    : `Stationnement Place #${invoice.slotNumber}`;
  doc.text(description, 25, rowY + 8);

  if (invoice.carModel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    doc.text(`Véhicule : ${invoice.carModel}`, 25, rowY + 14);
  }

  // Période
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  const periodStartFr = formatDateFR(invoice.periodStart);
  const periodEndFr = formatDateFR(invoice.periodEnd);
  doc.text(`Du ${periodStartFr}`, 95, rowY + 8);
  doc.text(`au ${periodEndFr}`, 95, rowY + 14);

  // Montant HT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`${amountHT.toFixed(2)} €`, pageWidth - 25, rowY + 11, { align: 'right' });

  // Bordure du tableau
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.3);
  doc.rect(20, tableY, pageWidth - 40, 32);

  // ═══════════════════════════════════════════
  // TOTAL BREAKDOWN
  // ═══════════════════════════════════════════
  const totalY = tableY + 40;

  // Ligne dorée de séparation
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 85, totalY, pageWidth - 20, totalY);

  let currentTotalY = totalY + 6;

  // Ligne 1 : Total Hors Taxes (HT)
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT', pageWidth - 85, currentTotalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(`${amountHT.toFixed(2)} €`, pageWidth - 25, currentTotalY, { align: 'right' });

  currentTotalY += 5;

  // Ligne 2 : TVA (20%)
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.setFont('helvetica', 'normal');
  doc.text('TVA (20%)', pageWidth - 85, currentTotalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(`${amountTVA.toFixed(2)} €`, pageWidth - 25, currentTotalY, { align: 'right' });

  currentTotalY += 6;

  // Ligne de séparation pour le total final
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 85, currentTotalY - 2, pageWidth - 20, currentTotalY - 2);

  // Ligne 3 : Total Net (TTC)
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL NET (TTC)', pageWidth - 85, currentTotalY + 3);
  doc.setFontSize(14);
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.text(`${amountTTC.toFixed(2)} €`, pageWidth - 25, currentTotalY + 3, { align: 'right' });

  // ═══════════════════════════════════════════
  // PIED DE PAGE
  // ═══════════════════════════════════════════
  const footerY = 260;

  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.2);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(7);
  doc.setTextColor(...grey);
  doc.setFont('helvetica', 'normal');
  doc.text('KELVAL SARL — 7 bis, rue du Pont St Pierre, 31300 TOULOUSE — SIRET : 438 527 640 00017', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text('TVA applicable : 20% — Document établi pour le compte de la gestion locative', pageWidth / 2, footerY + 11, { align: 'center' });

  // Bandeau inférieur doré
  doc.setFillColor(...gold);
  doc.rect(0, doc.internal.pageSize.getHeight() - 4, pageWidth, 4, 'F');

  // ═══════════════════════════════════════════
  // TÉLÉCHARGEMENT
  // ═══════════════════════════════════════════
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
