import { Injectable, OnModuleInit, ForbiddenException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ParkingSlot } from './schemas/parking.schema';
import { InvoiceService } from './invoice.service';

@Injectable()
export class ParkingService implements OnModuleInit {
  private readonly logger = new Logger(ParkingService.name);

  constructor(
    @InjectModel(ParkingSlot.name) private parkingModel: Model<ParkingSlot>,
    private readonly invoiceService: InvoiceService,
  ) {}

  async onModuleInit() {
    const count = await this.parkingModel.countDocuments();
    if (count === 0) {
      await this.seedParkingSlots();
    }
  }

  async seedParkingSlots() {
    const slots: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 23; i <= 59; i++) {
      const exists = await this.parkingModel.findOne({ number: i });
      if (!exists) {
        if (i === 30) {
          slots.push({
            number: 30,
            status: 'occupé',
            nom: 'Barthes',
            prenom: 'Yann',
            email: 'yann@mail.com',
            carModel: 'Porsche 911',
            startDate: today,
            price: this.calculatePrice(today),
          });
        } else {
          slots.push({ number: i, status: 'disponible' });
        }
      }
    }

    if (slots.length > 0) {
      await this.parkingModel.insertMany(slots);
      return `${slots.length} places créées.`;
    }
    return "Les places existent déjà.";
  }

  calculatePrice(startDate: string, endDate?: string): number {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 0;

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        // S'assurer que le nombre de jours est d'au moins 1
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return diffDays * 8;
      }
    }

    const basePrice = 240;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - start.getDate() + 1;
    
    return parseFloat(((basePrice / daysInMonth) * remainingDays).toFixed(2));
  }

  async findAll(): Promise<ParkingSlot[]> {
    return this.parkingModel.find().sort({ number: 1 }).exec();
  }

  async updateSlot(number: number, updateData: any): Promise<ParkingSlot | null> {
    if (number === 30) {
      throw new ForbiddenException("La place 30 est réservée.");
    }

    const existingSlot = await this.parkingModel.findOne({ number }).exec();

    // Calcul automatique du prix et de la date si on occupe une place
    if (updateData.status === 'occupé') {
      if (!updateData.startDate) {
        updateData.startDate = existingSlot?.startDate || new Date().toISOString().split('T')[0];
      }
      if (updateData.endDate === undefined) {
        updateData.endDate = existingSlot?.endDate;
      }
      updateData.price = this.calculatePrice(updateData.startDate, updateData.endDate);
    } else if (updateData.status === 'disponible') {
      updateData.price = 0;
      updateData.startDate = null;
      updateData.endDate = null;
    }

    const updatedSlot = await this.parkingModel.findOneAndUpdate(
      { number },
      { $set: updateData },
      { returnDocument: 'after' }
    ).exec();

    // Créer automatiquement une facture initiale à l'assignation
    if (updatedSlot && updateData.status === 'occupé' && updateData.startDate) {
      try {
        await this.invoiceService.createInitialInvoice(updatedSlot);
      } catch (error) {
        this.logger.error(`Erreur création facture initiale: ${error.message}`);
      }
    }

    return updatedSlot;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndLiberateExpiredSlots() {
    this.logger.log('Vérification des places expirées...');
    const today = new Date().toISOString().split('T')[0];
    
    // On cherche les places avec une date de fin dépassée
    const expiredSlots = await this.parkingModel.find({ 
      status: 'occupé', 
      endDate: { $lt: today, $ne: null } 
    }).exec();

    for (const slot of expiredSlots) {
      this.logger.log(`Libération automatique de la place #${slot.number} (expirée le ${slot.endDate})`);
      await this.updateSlot(slot.number, {
        status: 'disponible',
        nom: null,
        prenom: null,
        userId: null,
        email: null,
        carModel: null,
        licensePlate: null,
        startDate: null,
        endDate: null
      });
    }
  }
}