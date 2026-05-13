import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Post('seed')
  async seed() {
    return await this.parkingService.seedParkingSlots();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll() {
    return this.parkingService.findAll();
  }

  @Patch(':number')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('number') number: string, @Body() updateData: any) {
    return this.parkingService.updateSlot(+number, updateData);
  }
}