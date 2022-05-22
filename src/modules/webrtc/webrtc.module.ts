import { Module } from '@nestjs/common';
import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

@Module({
  providers: [WebRtcService],
  exports: [WebRtcService],
})
export class WebRtcModule {}
