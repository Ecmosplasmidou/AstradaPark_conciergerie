import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop([{
    model: { type: String, required: true },
    plate: { type: String, required: true }
  }])
  cars: { model: string; plate: string }[];
}

export const UserSchema = SchemaFactory.createForClass(User);