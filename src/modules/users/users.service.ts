import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/modules/users/dto';
import { User } from 'src/modules/users/user.entity';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getByIds(ids: number[]) {
    return await this.usersRepository.find({
      where: { id: In(ids) },
    });
  }

  async getById(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new HttpException(
        'Пользователь с таким ID не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async getByUsername(username: string) {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException(
        'Пользователь с таким email не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.getById(userId);

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async create(userData: CreateUserDto) {
    const newUser = await this.usersRepository.create(userData);
    await this.usersRepository.save(newUser);

    return newUser;
  }
}
