import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ParkingSlot extends Document {
  @Prop({ required: true, unique: true })
  number: number;

  @Prop({ default: 'disponible' })
  status: 'disponible' | 'occupé' | 'réservé';

  @Prop()
  nom?: string;

  @Prop()
  prenom?: string;

  @Prop()
  email?: string;

  @Prop()
  carModel?: string;

  @Prop()
  licensePlate?: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop()
  price?: number;

  @Prop({ default: 200 })
  adhesionAmount?: number;

  @Prop({ default: 240 })
  mensuelAmount?: number;

  @Prop({ default: 240 })
  cautionAmount?: number;
}

export const ParkingSlotSchema = SchemaFactory.createForClass(ParkingSlot);