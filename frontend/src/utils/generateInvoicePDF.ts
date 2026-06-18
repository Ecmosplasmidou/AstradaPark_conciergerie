import jsPDF from "jspdf";

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
  type: "prorata" | "mensuel" | "globale";
  createdAt?: string;
  isFirstMonth?: boolean;
  adhesionAmount?: number;
  mensuelAmount?: number;
  cautionAmount?: number;
  mandat?: string;
  immeuble?: string;
}

export function generateInvoicePDF(invoice: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ═══════════════════════════════════════════
  // CALCULS DES MONTANTS ET LIGNES DE FACTURE
  // ═══════════════════════════════════════════
  const ADHESION_HT = invoice.adhesionAmount ?? 200;
  const CAUTION_HT = invoice.cautionAmount ?? 240;
  const MENSUEL_FULL = invoice.mensuelAmount ?? 240;
  const tvaRate = 0.2;

  const isFirstMonth = invoice.isFirstMonth === true;

  // Prorata temporis : nombre de jours × tarif journalier (mensuelAmount / 30)
  const DAILY_RATE = parseFloat((MENSUEL_FULL / 30).toFixed(4));
  const [sy, sm, sd] = invoice.periodStart.split("-").map(Number);
  const [ey, em, ed] = invoice.periodEnd.split("-").map(Number);
  const startLocal = new Date(sy, sm - 1, sd);
  const endLocal = new Date(ey, em - 1, ed);
  const daysInPeriod =
    Math.round(
      (endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;
  const mensuelHT = parseFloat((daysInPeriod * DAILY_RATE).toFixed(2));

  const mensuelDesc = `Facturation du mois — Place n° ${invoice.slotNumber}`;

  interface InvoiceLine {
    description: string;
    montant: number;
  }

  const invoiceLines: InvoiceLine[] = isFirstMonth
    ? [
        {
          description:
            ADHESION_HT === 0 ? "Adhésion club (offerte)" : "Adhésion club",
          montant: ADHESION_HT,
        },
        { description: mensuelDesc, montant: mensuelHT },
        { description: "Caution : 1 mois de loyer", montant: CAUTION_HT },
      ]
    : [{ description: mensuelDesc, montant: mensuelHT }];

  const amountHT = invoiceLines.reduce((sum, l) => sum + l.montant, 0);
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
  doc.rect(0, 0, pageWidth, 4, "F");

  // Nom entreprise
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...dark);
  doc.text("KELVAL SARL", 20, 28);

  // Sous-titre
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text("ASTRADA PARK HIPPODROME", 20, 35);

  // Numéro de facture (droite)
  doc.setFontSize(10);
  doc.setTextColor(...grey);
  doc.text("FACTURE", pageWidth - 20, 20, { align: "right" });
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - 20, 28, { align: "right" });

  // Date de création
  doc.setFontSize(9);
  doc.setTextColor(...grey);
  const dateCreation = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");
  doc.text(`Date : ${dateCreation}`, pageWidth - 20, 35, { align: "right" });

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
  doc.setFont("helvetica", "bold");
  doc.text("ÉMETTEUR & GÉRANCE", 20, y);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text("KELVAL SARL", 20, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text("7 bis, rue du Pont St Pierre, 31300 TOULOUSE", 20, y);
  y += 4.5;
  doc.text("SIRET : 438 527 640 00017", 20, y);
  y += 4.5;
  doc.text("TVA Intracom : FR 62 438 527 640", 20, y);
  y += 4.5;
  doc.text("Tél : +33 6 64 944 540", 20, y);
  y += 4.5;
  doc.text("Service Gérance : astradaparkhippodrome@gmail.com", 20, y);
  y += 4.5;
  doc.setFontSize(6);
  doc.text(
    "Carte Professionnelle : CPI 31012018000032033, délivrée par la CCI TOULOUSE",
    20,
    y,
  );

  // Colonne droite : Client
  let yClient = 55;
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATAIRE", pageWidth - 90, yClient);

  yClient += 6;
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${invoice.clientPrenom} ${invoice.clientNom}`,
    pageWidth - 90,
    yClient,
  );
  yClient += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text(invoice.clientEmail, pageWidth - 90, yClient);

  // Bien & Mandat
  yClient += 8;
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT & MANDAT", pageWidth - 90, yClient);

  yClient += 6;
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.mandat ?? 'ASTRADA PARK GESTION', pageWidth - 90, yClient);
  yClient += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text(
    invoice.immeuble ?? "Parking Hippodrome — Route de Toulouse, 31320 Castanet-Tolosan",
    pageWidth - 90,
    yClient,
  );

  // ═══════════════════════════════════════════
  // DÉTAILS DE LA FACTURE — TABLEAU
  // ═══════════════════════════════════════════
  const periodStartFr = formatDateFR(invoice.periodStart);
  const periodEndFr = formatDateFR(invoice.periodEnd);

  const tableY = 110;
  const ROW_HEIGHT = 16;
  const tableHeaderH = 10;
  const tableBodyH = invoiceLines.length * ROW_HEIGHT;

  // En-tête du tableau
  doc.setFillColor(...dark);
  doc.rect(20, tableY, pageWidth - 40, tableHeaderH, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", 25, tableY + 7);
  doc.text("PÉRIODE", 115, tableY + 7);
  doc.text("MONTANT HT", pageWidth - 25, tableY + 7, { align: "right" });

  // Lignes de contenu
  invoiceLines.forEach((line, index) => {
    const rowY = tableY + tableHeaderH + index * ROW_HEIGHT;
    doc.setFillColor(
      index % 2 === 0 ? 248 : 242,
      index % 2 === 0 ? 248 : 242,
      index % 2 === 0 ? 248 : 242,
    );
    doc.rect(20, rowY, pageWidth - 40, ROW_HEIGHT, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(line.description, 25, rowY + ROW_HEIGHT / 2 + 1.5);

    // Période sur la ligne mensuelle seulement
    if (line.description.includes("Facturation du mois")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...grey);
      doc.text(
        `Du ${periodStartFr} au ${periodEndFr}`,
        115,
        rowY + ROW_HEIGHT / 2 + 1.5,
      );
    }

    // Montant
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(
      `${line.montant.toFixed(2)} €`,
      pageWidth - 25,
      rowY + ROW_HEIGHT / 2 + 1.5,
      { align: "right" },
    );
  });

  // Bordure du tableau
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.3);
  doc.rect(20, tableY, pageWidth - 40, tableHeaderH + tableBodyH);

  // ═══════════════════════════════════════════
  // TOTAL BREAKDOWN
  // ═══════════════════════════════════════════
  const totalY = tableY + tableHeaderH + tableBodyH + 8;

  // Ligne dorée de séparation
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 85, totalY, pageWidth - 20, totalY);

  let currentTotalY = totalY + 6;

  // Ligne 1 : Total Hors Taxes (HT)
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("Total HT", pageWidth - 85, currentTotalY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(`${amountHT.toFixed(2)} €`, pageWidth - 25, currentTotalY, {
    align: "right",
  });

  currentTotalY += 5;

  // Ligne 2 : TVA (20%)
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("TVA (20%)", pageWidth - 85, currentTotalY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(`${amountTVA.toFixed(2)} €`, pageWidth - 25, currentTotalY, {
    align: "right",
  });

  currentTotalY += 6;

  // Ligne de séparation pour le total final
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.3);
  doc.line(
    pageWidth - 85,
    currentTotalY - 2,
    pageWidth - 20,
    currentTotalY - 2,
  );

  // Ligne 3 : Total Net (TTC)
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC", pageWidth - 85, currentTotalY + 3);
  doc.setFontSize(14);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text(`${amountTTC.toFixed(2)} €`, pageWidth - 25, currentTotalY + 3, {
    align: "right",
  });

  // ═══════════════════════════════════════════
  // CONDITIONS DE PAIEMENT (à gauche du total)
  // ═══════════════════════════════════════════
  const condBoxX = 20;
  const condBoxW = pageWidth - 95 - 20;
  const condBoxH = currentTotalY + 8 - totalY;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.rect(condBoxX, totalY, condBoxW, condBoxH);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("CONDITIONS DE PAIEMENT", condBoxX + 4, totalY + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);
  const condLines = doc.splitTextToSize(
    "Payable par terme mensuel et d'avance le premier jour du mois",
    condBoxW - 8,
  );
  doc.text(condLines, condBoxX + 4, totalY + 12);

  // ═══════════════════════════════════════════
  // AVIS / DEMANDE DE PAIEMENT
  // ═══════════════════════════════════════════
  const noteY = currentTotalY + 15;
  const noteText =
    "Cet avis est une demande de paiement et ne peut, en aucun cas, avoir valeur de quittance. Il porte sur les arriérés éventuels relatifs aux périodes précédentes. Le règlement des sommes dues doit être effectué, au plus tard, dans les cinq jours.";

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const splitNote = doc.splitTextToSize(noteText, pageWidth - 50);
  const lineCount = splitNote.length;
  const boxHeight = 10 + lineCount * 4.5;

  // Fond beige très clair élégant
  doc.setFillColor(253, 251, 247);
  doc.rect(20, noteY, pageWidth - 40, boxHeight, "F");

  // Ligne de bordure gauche dorée
  doc.setFillColor(...gold);
  doc.rect(20, noteY, 1.5, boxHeight, "F");

  // Affichage du texte
  doc.text(splitNote, 26, noteY + 7);

  // ═══════════════════════════════════════════
  // CLAUSE LÉGALE
  // ═══════════════════════════════════════════
  const clauseY = noteY + boxHeight + 3;
  const clauseText =
    "CLAUSE DE RÉSERVE DE PROPRIÉTÉ : Conformément à la loi 80.335 du 12 mai 1980, nous réservons la propriété des produits et marchandises, objets des présents débits, jusqu'au paiement de l'intégralité du prix et de ses accessoires. En cas de non paiement total ou partiel du prix de l'échéance pour quelque cause que ce soit, de convention expresse, nous nous réservons la faculté, sans formalités, de reprendre matériellement possession de ces produits ou marchandises à vos frais, risques et périls. " +
    "Pénalité de retard : 3 fois le taux d'intérêt légal après date échéance. Escompte pour règlement anticipé : 0% (sauf condition particulière définie dans les conditions de règlement). " +
    "Le montant de l'indemnité forfaitaire pour frais de recouvrement prévue en douzième alinéa de l'article L441-6 est fixé à 40 Euros en matière commercial.";
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  const splitClause = doc.splitTextToSize(clauseText, pageWidth - 40);
  doc.text(splitClause, 20, clauseY);

  // ═══════════════════════════════════════════
  // PIED DE PAGE
  // ═══════════════════════════════════════════
  const footerY = 248;

  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.2);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(7);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text(
    "KELVAL SARL — 7 bis, rue du Pont St Pierre, 31300 TOULOUSE — SIRET : 438 527 640 00017",
    pageWidth / 2,
    footerY + 6,
    { align: "center" },
  );
  // IBAN : label normal + valeur bold, centrés ensemble
  const ibanLabel = "IBAN : ";
  const ibanValue = "FR76 3000 3043 1600 0201 7261 087";
  const ibanLabelW = doc.getTextWidth(ibanLabel);
  const ibanValueW = doc.getTextWidth(ibanValue);
  const ibanTotalW = ibanLabelW + ibanValueW;
  const ibanStartX = (pageWidth - ibanTotalW) / 2;
  doc.setFont("helvetica", "normal");
  doc.text(ibanLabel, ibanStartX, footerY + 11);
  doc.setFont("helvetica", "bold");
  doc.text(ibanValue, ibanStartX + ibanLabelW, footerY + 11);

  // BIC : label normal + valeur bold, centrés ensemble
  const bicLabel = "BIC-ADRESSE SWIFT : ";
  const bicValue = "SOGEFRPP";
  doc.setFont("helvetica", "normal");
  const bicLabelW = doc.getTextWidth(bicLabel);
  const bicValueW = doc.getTextWidth(bicValue);
  const bicTotalW = bicLabelW + bicValueW;
  const bicStartX = (pageWidth - bicTotalW) / 2;
  doc.text(bicLabel, bicStartX, footerY + 16);
  doc.setFont("helvetica", "bold");
  doc.text(bicValue, bicStartX + bicLabelW, footerY + 16);

  // Tableau RIB
  const ribY = footerY + 22;
  const ribHeaders = ["Code banque", "Code guichet", "N° compte", "Clé RIB"];
  const ribValues  = ["30003",       "04316",        "00020172610", "87"];
  const colCount = 4;
  const tableW = pageWidth - 40;
  const colW = tableW / colCount;
  const rowH = 6;
  const startX = 20;

  // Ligne d'en-tête
  doc.setFillColor(230, 230, 230);
  doc.rect(startX, ribY, tableW, rowH, "F");
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.2);
  doc.rect(startX, ribY, tableW, rowH);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  ribHeaders.forEach((h, i) => {
    const cx = startX + i * colW + colW / 2;
    if (i > 0) {
      doc.setDrawColor(...lightGrey);
      doc.line(startX + i * colW, ribY, startX + i * colW, ribY + rowH);
    }
    doc.text(h, cx, ribY + rowH - 1.5, { align: "center" });
  });

  // Ligne de valeurs
  const valY = ribY + rowH;
  doc.setFillColor(248, 248, 248);
  doc.rect(startX, valY, tableW, rowH, "F");
  doc.setDrawColor(...lightGrey);
  doc.rect(startX, valY, tableW, rowH);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  ribValues.forEach((v, i) => {
    const cx = startX + i * colW + colW / 2;
    if (i > 0) {
      doc.setDrawColor(...lightGrey);
      doc.line(startX + i * colW, valY, startX + i * colW, valY + rowH);
    }
    doc.text(v, cx, valY + rowH - 1.5, { align: "center" });
  });

  // Bandeau inférieur doré
  doc.setFillColor(...gold);
  doc.rect(0, doc.internal.pageSize.getHeight() - 4, pageWidth, 4, "F");

  // ═══════════════════════════════════════════
  // TÉLÉCHARGEMENT
  // ═══════════════════════════════════════════
  const dateStr = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("fr-FR").replace(/\//g, "-")
    : new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
  const fileName = `FACTURE_${dateStr}_${invoice.clientNom.toUpperCase()}_${invoice.clientPrenom.toUpperCase()}.pdf`;
  doc.save(fileName);
}

function formatDateFR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  // Construire en heure locale pour éviter le décalage UTC → date locale
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
