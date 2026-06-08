import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ParkingSlot } from './schemas/parking.schema';
import { Invoice } from './schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectModel(ParkingSlot.name) private parkingModel: Model<ParkingSlot>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

  /**
   * Génère un numéro de facture unique : FAC-AAAA-MM-NNN
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `FAC-${year}-${month}`;

    const lastInvoice = await this.invoiceModel
      .findOne({ invoiceNumber: { $regex: `^${prefix}` } })
      .sort({ invoiceNumber: -1 })
      .exec();

    let seq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(3, '0')}`;
  }

  private pad(n: number): string { return String(n).padStart(2, '0'); }

  /**
   * Retourne la date de fin du mois pour une date donnée (format YYYY-MM-DD)
   */
  private endOfMonth(dateStr: string): string {
    const [y, m] = dateStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate(); // jour 0 du mois suivant = dernier jour du mois
    return `${y}-${this.pad(m)}-${this.pad(lastDay)}`;
  }

  /**
   * Compare deux dates (YYYY-MM-DD) : retourne true si a <= b
   */
  private dateLE(a: string, b: string): boolean {
    return new Date(a) <= new Date(b);
  }

  /**
   * À l'assignation d'une place : génère la PREMIÈRE facture (du startDate jusqu'à la fin du mois
   * ou jusqu'à endDate si endDate est dans le même mois).
   * 
   * Logique : on génère UNE seule facture pour la période initiale.
   * Les factures suivantes (mois suivants) seront générées par le CRON le 1er de chaque mois.
   */
  async createInitialInvoice(slot: any): Promise<Invoice | null> {
    const startDate = slot.startDate;
    if (!startDate) return null;

    // Fin du mois du startDate
    const monthEnd = this.endOfMonth(startDate);

    // Fin réelle de la période : endDate si fournie et dans le même mois, sinon fin du mois
    let periodEnd: string;
    if (slot.endDate && this.dateLE(slot.endDate, monthEnd)) {
      periodEnd = slot.endDate;
    } else {
      periodEnd = monthEnd;
    }

    // Vérifier qu'on n'a pas déjà une facture pour cette place sur cette période
    const existing = await this.invoiceModel.findOne({
      slotNumber: slot.number,
      periodStart: startDate,
    }).exec();

    if (existing) {
      this.logger.log(`Facture initiale déjà existante pour place #${slot.number}`);
      return existing;
    }

    // Prorata temporis pour la facturation du mois
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = periodEnd.split('-').map(Number);
    const startLocal = new Date(sy, sm - 1, sd);
    const endLocal = new Date(ey, em - 1, ed);
    const daysInPeriod = Math.round((endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const mensuelHT = parseFloat((daysInPeriod * 8).toFixed(2));

    // Premier mois : adhésion 200 + mensuel (prorata) + caution 240
    const adhesionAmount = slot.adhesionAmount ?? 200;
    const FIRST_MONTH_AMOUNT = parseFloat((adhesionAmount + mensuelHT + 240).toFixed(2));
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = new this.invoiceModel({
      invoiceNumber,
      clientNom: slot.nom,
      clientPrenom: slot.prenom,
      clientEmail: slot.email,
      slotNumber: slot.number,
      carModel: slot.carModel || '',
      amount: FIRST_MONTH_AMOUNT,
      periodStart: startDate,
      periodEnd,
      type: 'mensuel',
      isFirstMonth: true,
      adhesionAmount,
    });

    const saved = await invoice.save();
    this.logger.log(`Facture initiale ${invoiceNumber} créée pour ${slot.email} — du ${startDate} au ${periodEnd} — ${FIRST_MONTH_AMOUNT}€ HT (adhésion + mensuel ${daysInPeriod}j×8€ + caution)`);
    return saved;
  }

  /**
   * CRON : Chaque 1er du mois à minuit
   * Génère les factures pour le mois courant pour toutes les places encore actives.
   * 
   * Exemples :
   * - Slot sans endDate → facture du 1er au dernier jour du mois (ex: 01/06 → 30/06 = 30j × 8€)
   * - Slot avec endDate dans ce mois → facture du 1er au endDate (ex: 01/08 → 01/08 = 1j × 8€)
   * - Slot dont endDate est déjà passé → ignoré (CRON de libération s'en charge)
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyInvoices() {
    this.logger.log('=== Démarrage de la facturation mensuelle ===');

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-indexé
    const lastDayNum = new Date(y, m, 0).getDate();
    const firstDay = `${y}-${this.pad(m)}-01`;
    const lastDay = `${y}-${this.pad(m)}-${this.pad(lastDayNum)}`;

    // Toutes les places actives dont le startDate est antérieur au 1er de ce mois
    const occupiedSlots = await this.parkingModel.find({
      status: 'occupé',
    }).exec();

    for (const slot of occupiedSlots) {
      // Si le slot a démarré ce mois-ci (>= firstDay), sa facture initiale a déjà été créée à l'assignation
      if (slot.startDate && slot.startDate >= firstDay) {
        this.logger.log(`Place #${slot.number} : démarrée ce mois, facture initiale déjà émise`);
        continue;
      }

      // Si la place a une endDate passée, le CRON de libération s'en charge
      if (slot.endDate && slot.endDate < firstDay) {
        this.logger.log(`Place #${slot.number} : endDate déjà passé, ignorée`);
        continue;
      }

      // Vérifier qu'on n'a pas déjà facturé ce mois pour cette place
      const existing = await this.invoiceModel.findOne({
        slotNumber: slot.number,
        periodStart: firstDay,
      }).exec();

      if (existing) {
        this.logger.log(`Facture mensuelle déjà existante pour place #${slot.number}`);
        continue;
      }

      try {
        // Fin de période : endDate si dans ce mois, sinon dernier jour du mois
        let periodEnd: string;
        if (slot.endDate && slot.endDate <= lastDay) {
          periodEnd = slot.endDate;
        } else {
          periodEnd = lastDay;
        }

        const MENSUEL_AMOUNT = 240;
        const invoiceNumber = await this.generateInvoiceNumber();

        await this.invoiceModel.create({
          invoiceNumber,
          clientNom: slot.nom,
          clientPrenom: slot.prenom,
          clientEmail: slot.email,
          slotNumber: slot.number,
          carModel: slot.carModel || '',
          amount: MENSUEL_AMOUNT,
          periodStart: firstDay,
          periodEnd,
          type: 'mensuel',
          isFirstMonth: false,
        });

        this.logger.log(`Facture mensuelle ${invoiceNumber} créée pour ${slot.email} — du ${firstDay} au ${periodEnd} — ${MENSUEL_AMOUNT}€ HT`);
      } catch (error) {
        this.logger.error(`Erreur facture place #${slot.number}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.log('=== Facturation mensuelle terminée ===');
  }

  /**
   * Récupère les factures d'un client par email
   */
  async getInvoicesByEmail(email: string): Promise<Invoice[]> {
    return this.invoiceModel.find({ clientEmail: email }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Récupère toutes les factures (admin)
   */
  async getAllInvoices(): Promise<Invoice[]> {
    return this.invoiceModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Supprime une facture par son ID (admin uniquement)
   */
  async deleteInvoice(id: string): Promise<void> {
    await this.invoiceModel.findByIdAndDelete(id).exec();
  }
}