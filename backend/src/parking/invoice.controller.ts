import { Controller, Delete, Get, Patch, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllInvoices(@Req() req: any) {
    if (req.user.role === 'admin') {
      return this.invoiceService.getAllInvoices();
    }
    return this.invoiceService.getInvoicesByEmail(req.user.email);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyInvoices(@Req() req: any) {
    return this.invoiceService.getInvoicesByEmail(req.user.email);
  }

  /** PATCH /invoices/update-client-name — corrige nom/prénom sur toutes les factures d'un client */
  @Patch('update-client-name')
  @UseGuards(AuthGuard('jwt'))
  async updateClientName(
    @Body() body: { slotNumber: number; clientEmail: string; clientNom: string; clientPrenom: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    const count = await this.invoiceService.updateClientName(body.slotNumber, body.clientEmail, body.clientNom, body.clientPrenom);
    return { message: `${count} facture(s) mise(s) à jour` };
  }

  /** PATCH /invoices/:id — met à jour le montant ou l'adhésion d'une facture */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateInvoice(
    @Param('id') id: string,
    @Body() body: { amount?: number; adhesionAmount?: number },
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.invoiceService.updateInvoice(id, body);
    return { message: 'Facture mise à jour' };
  }

  /** DELETE /invoices/by-client — supprime toutes les factures d'un client pour une place */
  @Delete('by-client')
  @UseGuards(AuthGuard('jwt'))
  async deleteByClient(
    @Body() body: { slotNumber: number; clientEmail: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    const count = await this.invoiceService.deleteInvoicesByClient(body.slotNumber, body.clientEmail);
    return { message: `${count} facture(s) supprimée(s)` };
  }

  /** DELETE /invoices/:id — supprime une facture individuelle */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteInvoice(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.invoiceService.deleteInvoice(id);
    return { message: 'Facture supprimée' };
  }
}
