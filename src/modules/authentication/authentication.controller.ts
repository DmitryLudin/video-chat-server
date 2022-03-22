import {
  Body,
  Req,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
} from '@nestjs/common';
import { RegisterDto } from 'src/modules/authentication/dto';
import {
  CookieAuthenticationGuard,
  LogInWithCredentialsGuard,
} from 'src/modules/authentication/guards';
import { RequestWithUser } from 'src/modules/authentication/types';
import { AuthenticationService } from './authentication.service';

@Controller('authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LogInWithCredentialsGuard)
  @Post('log-in')
  async logIn(@Req() request: RequestWithUser) {
    return request.user;
  }

  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
  @Get()
  async authenticate(@Req() request: RequestWithUser) {
    return request.user;
  }

  @HttpCode(200)
  @UseGuards(CookieAuthenticationGuard)
  @Post('log-out')
  async logOut(@Req() request: RequestWithUser) {
    request.logOut();
    request.session.cookie.maxAge = 0;
  }
}
