import { Global, Module } from '@nestjs/common';
import { ImageService } from './image.service';

@Global()
@Module({
  imports: [],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
