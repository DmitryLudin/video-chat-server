import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateConnectedUserDto } from 'src/modules/video-chat/dto';
import { ConnectedUser } from 'src/modules/video-chat/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ConnectedUsersService {
  constructor(
    @InjectRepository(ConnectedUser)
    private readonly connectedUsersRepository: Repository<ConnectedUser>,
  ) {}

  async create(connectedUserData: CreateConnectedUserDto) {
    const { userId, ...otherData } = connectedUserData;

    const connectedUser = this.connectedUsersRepository.create({
      ...otherData,
      user: userId as unknown,
    });

    return this.connectedUsersRepository.save(connectedUser);
  }

  async findUserById(userId: number) {
    return this.connectedUsersRepository.findOne({
      where: { user: userId as unknown },
    });
  }

  async findUserBySocketId(socketId: string) {
    return this.connectedUsersRepository.findOne({
      where: { socketId },
    });
  }

  async findAllUsersBySocketId(socketId: string) {
    return this.connectedUsersRepository.find({
      where: { socketId },
    });
  }

  async deleteBySocketId(socketId: string) {
    return this.connectedUsersRepository.delete({ socketId });
  }

  async deleteAll() {
    await this.connectedUsersRepository.clear();
  }
}
