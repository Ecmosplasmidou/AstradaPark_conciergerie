import { Controller, Post, Body, Get, Patch, UseGuards, Req } from '@nestjs/common';
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
}