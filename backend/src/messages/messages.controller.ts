import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * POST /messages — User envoie un message à l'admin
   */
  @Post()
  async createMessage(@Req() req: any, @Body() body: { subject: string; content: string }) {
    // req.user.userId est historiquement "sub" dans la logique JWT du backend, 
    // on passe "req.user.sub" si c'est ce qui est dans le payload
    return this.messagesService.createMessage(
      req.user.sub || req.user.userId || '',
      req.user.email,
      body,
    );
  }

  /**
   * GET /messages — Admin : tous les messages | User : les siens
   */
  @Get()
  async getMessages(@Req() req: any) {
    if (req.user.role === 'admin') {
      return this.messagesService.getAllMessages();
    }
    return this.messagesService.getMessagesByUser(req.user.email);
  }

  /**
   * GET /messages/my — User : ses propres messages
   */
  @Get('my')
  async getMyMessages(@Req() req: any) {
    return this.messagesService.getMessagesByUser(req.user.email);
  }

  /**
   * PATCH /messages/:id — Admin : mise à jour statut uniquement
   */
  @Patch(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.messagesService.updateMessage(id, body);
  }

  /**
   * POST /messages/:id/reply — User ou Admin : répond à un message
   */
  @Post(':id/reply')
  async replyToMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const sender = req.user.role === 'admin' ? 'admin' : 'user';
    return this.messagesService.replyToMessage(id, sender, body.content);
  }

  /**
   * DELETE /messages/:id — Admin : supprime un message
   */
  @Delete(':id')
  async deleteMessage(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new Error('Non autorisé');
    }
    return this.messagesService.deleteMessage(id);
  }
}
