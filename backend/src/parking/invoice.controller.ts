import { Controller, Delete, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * GET /invoices — Admin : toutes les factures
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllInvoices(@Req() req: any) {
    // Si admin, retourne tout. Sinon, retourne seulement les siennes.
    if (req.user.role === 'admin') {
      return this.invoiceService.getAllInvoices();
    }
    return this.invoiceService.getInvoicesByEmail(req.user.email);
  }

  /**
   * GET /invoices/my — User : ses propres factures
   */
  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyInvoices(@Req() req: any) {
    return this.invoiceService.getInvoicesByEmail(req.user.email);
  }

  /**
   * DELETE /invoices/:id — Admin uniquement
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteInvoice(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.invoiceService.deleteInvoice(id);
    return { message: 'Facture supprimée' };
  }
}
