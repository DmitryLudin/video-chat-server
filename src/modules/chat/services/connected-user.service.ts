import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateConnectedUserDto } from 'src/modules/chat/dto';
import { ConnectedUser } from 'src/modules/chat/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ConnectedUserService {
  constructor(
    @InjectRepository(ConnectedUser)
    private readonly connectedUserRepository: Repository<ConnectedUser>,
  ) {}

  async create(connectedUserData: CreateConnectedUserDto) {
    const { userId, ...otherData } = connectedUserData;

    const connectedUser = this.connectedUserRepository.create({
      ...otherData,
      user: userId as unknown,
    });

    return this.connectedUserRepository.save(connectedUser);
  }

  async findAllByUserId(userId: number) {
    return this.connectedUserRepository.find({
      where: { user: userId as unknown },
    });
  }

  async deleteBySocketId(socketId: string) {
    return this.connectedUserRepository.delete({ socketId });
  }

  async deleteAll() {
    await this.connectedUserRepository.clear();
  }
}
