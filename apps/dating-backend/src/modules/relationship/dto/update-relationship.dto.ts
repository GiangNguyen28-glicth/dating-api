import { PartialType } from '@nestjs/swagger';
import { CreateRelationshipDTO } from './create-relationship.dto';

export class UpdateRelationshipDto extends PartialType(CreateRelationshipDTO) {}
