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

  /**
   * Crée une facture prorata lors de la première assignation d'une place
   */
  async createProrataInvoice(slot: any): Promise<Invoice> {
    const now = new Date();
    const startDate = slot.startDate;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const periodEnd = lastDay.toISOString().split('T')[0];

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = new this.invoiceModel({
      invoiceNumber,
      clientNom: slot.nom,
      clientPrenom: slot.prenom,
      clientEmail: slot.email,
      slotNumber: slot.number,
      carModel: slot.carModel || '',
      amount: slot.price,
      periodStart: startDate,
      periodEnd,
      type: 'prorata',
    });

    const saved = await invoice.save();
    this.logger.log(`Facture prorata ${invoiceNumber} créée pour ${slot.email} — ${slot.price}€`);
    return saved;
  }

  /**
   * CRON : Chaque 1er du mois à minuit, génère les factures mensuelles
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyInvoices() {
    this.logger.log('=== Démarrage de la facturation mensuelle ===');

    const occupiedSlots = await this.parkingModel.find({ status: 'occupé' }).exec();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    for (const slot of occupiedSlots) {
      // Vérifier qu'on n'a pas déjà facturé ce mois pour cette place
      const existing = await this.invoiceModel.findOne({
        slotNumber: slot.number,
        periodStart: firstDay,
        type: 'mensuel',
      }).exec();

      if (existing) {
        this.logger.log(`Facture mensuelle déjà existante pour place #${slot.number}`);
        continue;
      }

      try {
        const invoiceNumber = await this.generateInvoiceNumber();

        await this.invoiceModel.create({
          invoiceNumber,
          clientNom: slot.nom,
          clientPrenom: slot.prenom,
          clientEmail: slot.email,
          slotNumber: slot.number,
          carModel: slot.carModel || '',
          amount: 240,
          periodStart: firstDay,
          periodEnd: lastDay,
          type: 'mensuel',
        });

        // Remettre le prix de la place à 240€ (mois complet)
        if (slot.price !== 240) {
          await this.parkingModel.updateOne({ _id: slot._id }, { price: 240 });
        }

        this.logger.log(`Facture mensuelle ${invoiceNumber} créée pour ${slot.email}`);
      } catch (error) {
        this.logger.error(`Erreur facture place #${slot.number}: ${error.message}`);
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
}