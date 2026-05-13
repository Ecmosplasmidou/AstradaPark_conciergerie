import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParkingService } from './parking.service';
import { ParkingController } from './parking.controller';
import { ParkingSlot, ParkingSlotSchema } from './schemas/parking.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingSlot.name, schema: ParkingSlotSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    AuthModule,
  ],
  controllers: [ParkingController, InvoiceController],
  providers: [ParkingService, InvoiceService],
  exports: [ParkingService, InvoiceService],
})
export class ParkingModule {}