import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ParkingSlot } from './schemas/parking.schema';
import { InvoiceService } from './invoice.service';

@Injectable()
export class ParkingService implements OnModuleInit {
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
            price: this.calculateProrata(today),
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

  calculateProrata(startDate: string): number {
    const basePrice = 240;
    const date = new Date(startDate);

    // Sécurité anti-NaN : si la date est invalide, on retourne 0
    if (isNaN(date.getTime())) return 0;

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - date.getDate() + 1;
    
    const result = (basePrice / daysInMonth) * remainingDays;
    return parseFloat(result.toFixed(2));
  }

  async findAll(): Promise<ParkingSlot[]> {
    return this.parkingModel.find().sort({ number: 1 }).exec();
  }

  async updateSlot(number: number, updateData: any): Promise<ParkingSlot | null> {
    if (number === 30) {
      throw new ForbiddenException("La place 30 est réservée.");
    }

    // Calcul automatique du prix et de la date si on occupe une place
    if (updateData.status === 'occupé') {
      if (!updateData.startDate) {
        updateData.startDate = new Date().toISOString().split('T')[0];
      }
      updateData.price = this.calculateProrata(updateData.startDate);
    } else if (updateData.status === 'disponible') {
      updateData.price = 0;
      updateData.startDate = null;
    }

    const updatedSlot = await this.parkingModel.findOneAndUpdate(
      { number },
      { $set: updateData },
      { returnDocument: 'after' }
    ).exec();

    // Créer automatiquement une facture prorata à l'assignation
    if (updatedSlot && updateData.status === 'occupé' && updateData.startDate) {
      try {
        await this.invoiceService.createProrataInvoice(updatedSlot);
      } catch (error) {
        console.error(`Erreur création facture prorata: ${error.message}`);
      }
    }

    return updatedSlot;
  }
}