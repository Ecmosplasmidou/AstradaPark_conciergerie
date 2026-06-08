import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  clientNom: string;

  @Prop({ required: true })
  clientPrenom: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop({ required: true })
  slotNumber: number;

  @Prop()
  carModel?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  periodStart: string;

  @Prop({ required: true })
  periodEnd: string;

  @Prop({ required: true, enum: ['prorata', 'mensuel', 'globale'] })
  type: 'prorata' | 'mensuel' | 'globale';

  @Prop({ default: false })
  isFirstMonth: boolean;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
