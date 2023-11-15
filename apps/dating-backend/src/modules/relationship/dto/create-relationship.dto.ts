import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Relationship } from '../entities/relationship.entity';
import { RelationshipModeType, RelationshipType } from '@common/consts';
import { Admin } from '@modules/admin/entities';

export class CreateRelationshipDTO implements Partial<Relationship> {
  @ApiProperty()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  iconUrl?: string;

  @ApiPropertyOptional({ type: 'enum', enum: RelationshipModeType })
  mode?: RelationshipModeType;

  @ApiProperty({ type: 'enum', enum: RelationshipType })
  type?: RelationshipType;

  createdBy?: string;
  updatedBy?: string;
}
