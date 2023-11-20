import { FilterGetAll, FilterGetOne } from '@common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Conversation } from '../entities';
import { User } from '@modules/users/entities';
import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class FilterGetAllConversationDTO extends FilterGetAll {
  @ApiProperty()
  message?: number;
}

export class FilterGetOneConversationDTO extends FilterGetOne implements Partial<Conversation> {
  members?: User[];
  toJSON?: boolean;
  populate?: boolean;
}

export class SafeModeDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  enable: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  conversation: string;
}
