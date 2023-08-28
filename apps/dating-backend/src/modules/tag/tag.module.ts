import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagMongoRepoProvider } from '@dating/repositories';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { Tag, TagSchema } from './entities/tag.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }])],
  controllers: [TagController],
  providers: [TagService, TagMongoRepoProvider],
  exports: [TagService, TagMongoRepoProvider],
})
export class TagModule {}
