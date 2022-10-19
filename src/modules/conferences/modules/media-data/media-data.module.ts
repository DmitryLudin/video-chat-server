import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { RoomsModule } from 'src/modules/conferences/modules/rooms';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';
import { WebRtcModule } from 'src/modules/webrtc/webrtc.module';
import { MediaDataService } from './media-data.service';
import { MediaDataController } from './media-data.controller';
import { MediaDataGateway } from './media-data.gateway';

@Module({
  imports: [WebRtcModule, AuthenticationModule, RoomsModule],
  providers: [
    MediaDataService,
    MediaDataGateway,
    ConferenceGatewayHelperService,
  ],
  exports: [MediaDataService],
  controllers: [MediaDataController],
})
export class MediaDataModule {}
