import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RelationshipMongoRepoProvider } from '@dating/repositories';

import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { Relationship, RelationshipSchema } from './entities';

@Module({
  imports: [MongooseModule.forFeature([{ name: Relationship.name, schema: RelationshipSchema }])],
  controllers: [RelationshipController],
  providers: [RelationshipService, RelationshipMongoRepoProvider],
  exports: [RelationshipService],
})
export class RelationshipModule {}
