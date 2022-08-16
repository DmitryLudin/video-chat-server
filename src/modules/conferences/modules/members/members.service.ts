import { Injectable } from '@nestjs/common';
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
    const member = this.membersRepository.create(memberData);

    await this.membersRepository.save(member);

    return await this.getById(member.id);
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
