import { Module } from '@nestjs/common';
import { WebRtcModule } from 'src/modules/webrtc/webrtc.module';
import { MediaDataService } from './media-data.service';

@Module({
  imports: [WebRtcModule],
  providers: [MediaDataService],
  exports: [MediaDataService],
})
export class MediaDataModule {}
