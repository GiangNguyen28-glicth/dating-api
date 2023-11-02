import { Global, Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { CloudinaryProvider } from '@common/provider';

@Global()
@Module({
  imports: [],
  providers: [ImageService, CloudinaryProvider],
  exports: [ImageService],
})
export class ImageModule {}
