import { Controller, Post, Body, Get, Patch, Delete, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() authData: any) {
    return this.authService.signUp(authData);
  }

  @Post('login')
  async login(@Body() loginData: any) {
    return this.authService.login(loginData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Req() req, @Body() updateData: any) {
    return this.authService.updateProfile(req.user.userId, updateData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  async getAllUsers() {
    return this.authService.findAllUsers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.authService.updateUserById(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.authService.deleteUser(id);
    return { message: 'Client supprimé' };
  }
}