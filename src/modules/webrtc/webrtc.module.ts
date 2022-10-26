import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

@Module({
  imports: [ConfigModule],
  providers: [WebRtcService],
  exports: [WebRtcService],
})
export class WebRtcModule {}
