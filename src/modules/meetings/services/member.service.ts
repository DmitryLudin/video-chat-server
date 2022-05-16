import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Router } from 'mediasoup/node/lib/Router';
import { ConsumeDto, ProduceDto } from 'src/modules/mediasoup/dto';
import { MediasoupService } from 'src/modules/mediasoup/mediasoup.service';
import {
  ConnectWebRtcTransportDto,
  CreateMemberDto,
  CreateWebrtcTransportDto,
} from 'src/modules/meetings/dto';
import { Member } from 'src/modules/meetings/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly mediasoupService: MediasoupService,
  ) {}

  async getById(memberId: string) {
    return await this.membersRepository.findOne({ where: { id: memberId } });
  }

  async create(memberData: CreateMemberDto) {
    const member = this.membersRepository.create(memberData);
    const savedMember = await this.membersRepository.save(member);
    return this.getById(savedMember.id);
  }

  async deleteByUserId(userId: number) {
    const member = await this.membersRepository.findOne({
      where: { user: { id: userId } },
    });
    member.webRtcConsumeTransport.close();
    member.webRtcProduceTransport.close();

    return await this.membersRepository.delete({ userId });
  }

  async createWebRtcTransport(
    memberId: string,
    createWebRtcTransportData: CreateWebrtcTransportDto,
  ) {
    const transport = await this.mediasoupService.createWebRtcTransport(
      createWebRtcTransportData.webRtcRouter,
    );

    await this.membersRepository.update(
      { id: memberId },
      createWebRtcTransportData.isConsumeTransport
        ? { webRtcConsumeTransport: transport }
        : { webRtcProduceTransport: transport },
    );

    return transport;
  }

  async connectWebRtcTransport(
    memberId: string,
    { dtlsParameters, isConsumeTransport }: ConnectWebRtcTransportDto,
  ) {
    const member = await this.getById(memberId);

    if (isConsumeTransport) {
      return await member.webRtcConsumeTransport.connect({ dtlsParameters });
    }

    return await member.webRtcProduceTransport.connect({ dtlsParameters });
  }

  async produce(memberId: string, produceData: ProduceDto) {
    const member = await this.getById(memberId);

    const producer = await this.mediasoupService.createProducer(
      member.webRtcProduceTransport,
      produceData,
    );

    return await this.membersRepository.save({ ...member, producer });
  }

  async consume(memberId: string, consumeData: ConsumeDto) {
    const member = await this.getById(memberId);

    const consumer = await this.mediasoupService.createConsumer(
      member.webRtcConsumeTransport,
      { ...consumeData, producerId: member.producer.id },
    );

    return await this.membersRepository.save({ ...member, consumer });
  }
}
