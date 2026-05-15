import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createMessage(userId: string, userEmail: string, data: { subject: string; content: string }): Promise<Message> {
    const user = await this.messageModel.db.collection('users').findOne({ email: userEmail });
    
    const message = new this.messageModel({
      userId,
      userEmail,
      userNom: user ? user.nom : 'Client',
      userPrenom: user ? user.prenom : 'Inconnu',
      subject: data.subject,
      initialMessage: data.content,
      replies: [],
      status: 'nouveau',
    });
    return message.save();
  }

  async getAllMessages(): Promise<Message[]> {
    return this.messageModel.find().sort({ updatedAt: -1 }).exec();
  }

  async getMessagesByUser(userEmail: string): Promise<Message[]> {
    return this.messageModel.find({ userEmail }).sort({ updatedAt: -1 }).exec();
  }

  async updateMessage(id: string, updateData: { status?: string }): Promise<Message> {
    const updated = await this.messageModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).exec();
    if (!updated) throw new NotFoundException('Message introuvable');
    return updated;
  }

  async replyToMessage(id: string, sender: 'user' | 'admin', content: string): Promise<Message> {
    const message = await this.messageModel.findById(id).exec();
    if (!message) throw new NotFoundException('Message introuvable');

    if (!message.replies) {
      message.replies = [];
    }

    // Migration à la volée pour les anciens messages qui n'avaient pas initialMessage
    if (!message.initialMessage) {
      message.initialMessage = message.get('content') || 'Ancien message';
    }

    message.replies.push({ sender, content, createdAt: new Date() });
    
    // Si l'user répond, le message redevient "nouveau" pour l'admin
    if (sender === 'user') {
      message.status = 'nouveau';
    } 

    return message.save();
  }

  async countNewMessages(): Promise<number> {
    return this.messageModel.countDocuments({ status: 'nouveau' }).exec();
  }

  async deleteMessage(id: string): Promise<void> {
    const result = await this.messageModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Message introuvable');
  }
}
