import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/modules/authentication/dto';
import { TokenPayload } from 'src/modules/authentication/types';
import { PostgresErrorCode } from 'src/modules/database/constants';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registrationData: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    try {
      return await this.usersService.create({
        ...registrationData,
        password: hashedPassword,
      });
    } catch (error: unknown) {
      const postgresError = error as { code?: string };

      if (postgresError?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'Пользователь с таким логином уже существует',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAuthenticatedUser(username: string, plainTextPassword: string) {
    try {
      const user = await this.usersService.getByUsername(username);
      await this.verifyPassword(plainTextPassword, user.password);
      return user;
    } catch {
      throw new HttpException(
        'Предоставленны неверные учетные данные',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  getCookieWithJwtAccessToken(userId: number) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`;
  }

  getCookieWithJwtRefreshToken(userId: number) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    )}`;
    return {
      cookie,
      token,
    };
  }

  getCookiesForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ];
  }

  public async getUserFromAuthenticationToken(token: string) {
    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });

    if (payload.userId) {
      return this.usersService.getById(payload.userId);
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    );

    if (!isPasswordMatching) {
      throw new HttpException(
        'Предоставленны неверные учетные данные',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
