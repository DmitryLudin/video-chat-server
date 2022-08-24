// import { Injectable } from '@nestjs/common';
// import { MediaDataService } from 'src/modules/conferences/modules/media-data/media-data.service';
// import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';
// import {
//   IConnectMediaStreamDto,
//   ICreateMediaStreamConsumerDto,
//   ICreateMediaStreamProducerDto,
//   IResumeMediaStreamConsumerDto,
// } from 'src/modules/conferences/types/media-data.types';
// import {
//   ICreateMemberDto,
//   ICreateRoomDto,
// } from 'src/modules/conferences/types/room.types';
//
// @Injectable()
// export class ControllerHelperService {
//   constructor(
//     private readonly roomsService: RoomsService,
//     private readonly mediaDataService: MediaDataService,
//   ) {}
//
//   /* Room */
//   async getRoomByIdAndUserId(roomId: string, userId: number) {
//     return this.roomsService.getByIdAndUserId(roomId, userId);
//   }
//
//   async createRoom(data: ICreateRoomDto) {
//     const room = await this.roomsService.create(data);
//     const member = room.members[0];
//
//     await this.mediaDataService.create(room.id, member.id);
//
//     return room;
//   }
//
//   async joinRoom(roomId: string, data: ICreateMemberDto) {
//     const room = await this.roomsService.addMember(roomId, data);
//     const member = room.members.find(
//       (member) => member.user.id === data.userId,
//     );
//
//     await this.mediaDataService.addMediaStream(roomId, member.id);
//
//     return room;
//   }
//
//   /* Media Stream */
//   async connectMediaStream(roomId: string, data: IConnectMediaStreamDto) {
//     return this.mediaDataService.connectMediaStream(roomId, data);
//   }
//
//   async createMediaStreamProducer(
//     roomId: string,
//     data: ICreateMediaStreamProducerDto,
//   ) {
//     return this.mediaDataService.createMediaStreamProducer(roomId, data);
//   }
//
//   async createMediaStreamConsumer(
//     roomId: string,
//     data: ICreateMediaStreamConsumerDto,
//   ) {
//     return this.mediaDataService.createMediaStreamConsumer(roomId, data);
//   }
//
//   async resumeMediaStreamConsumer(
//     roomId: string,
//     data: IResumeMediaStreamConsumerDto,
//   ) {
//     return this.mediaDataService.resumeMediaStreamConsumer(roomId, data);
//   }
// }
