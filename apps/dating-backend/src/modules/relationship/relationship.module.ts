import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { RelationshipMongoRepoProvider } from '@dating/repositories';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Relationship,
  RelationshipSchema,
} from './entities/relationship.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Relationship.name, schema: RelationshipSchema },
    ]),
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService, RelationshipMongoRepoProvider],
  exports: [RelationshipService],
})
export class RelationshipModule {}
