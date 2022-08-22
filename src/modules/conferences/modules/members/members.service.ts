import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/modules/conferences/entities';
import { CreateMemberDto } from 'src/modules/conferences/modules/members/dto';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  async getById(id: string) {
    return await this.membersRepository.findOne({ where: { id } });
  }

  async getByUserId(userId: number) {
    return await this.membersRepository.findOne({ where: { userId } });
  }

  async create(memberData: CreateMemberDto) {
    let member = await this.membersRepository.findOne({
      where: { userId: memberData.userId },
      withDeleted: true,
    });

    if (member) {
      await this.restore(member.id);
    } else {
      member = this.membersRepository.create(memberData);
      await this.membersRepository.save(member);
    }

    return await this.getById(member.id);
  }

  async restore(id: string) {
    const restoreResponse = await this.membersRepository.restore(id);
    if (!restoreResponse.affected) {
      throw new HttpException(
        'Пользователь уже является участником встречи',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(id: string) {
    return await this.membersRepository.softDelete({ id });
  }

  async deleteByUserId(userId: number) {
    return await this.membersRepository.softDelete({ userId });
  }

  async disableAudio(memberId: string) {
    return this.membersRepository.update(memberId, { isAudioOn: false });
  }

  async enableAudio(memberId: string) {
    return this.membersRepository.update(memberId, { isAudioOn: true });
  }

  async disableVideo(memberId: string) {
    return this.membersRepository.update(memberId, { isVideoOn: false });
  }

  async enableVideo(memberId: string) {
    return this.membersRepository.update(memberId, { isVideoOn: true });
  }
}
