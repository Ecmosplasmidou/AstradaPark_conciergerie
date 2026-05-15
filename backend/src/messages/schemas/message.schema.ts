import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userNom: string;

  @Prop({ required: true })
  userPrenom: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  initialMessage: string;

  @Prop([{
    sender: { type: String, enum: ['user', 'admin'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }])
  replies: { sender: 'user' | 'admin', content: string, createdAt: Date }[];

  @Prop({ default: 'nouveau' })
  status: 'nouveau' | 'traité' | 'clôturé';
}

export const MessageSchema = SchemaFactory.createForClass(Message);
