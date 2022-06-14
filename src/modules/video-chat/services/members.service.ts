import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMemberDto } from 'src/modules/video-chat/dto';
import { Member } from 'src/modules/video-chat/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  async create(memberData: CreateMemberDto) {
    const member = this.membersRepository.create(memberData);

    return await this.membersRepository.save(member);
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
