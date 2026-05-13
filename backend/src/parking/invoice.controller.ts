import { Controller, Get, UseGuards, Req } from '@nestjs/common';
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
}
