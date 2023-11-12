import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { Role } from '@common/consts';
import { FilterGetOne } from '@common/dto';
import { Admin } from '../entities';

export class CreateAdminDTO implements Partial<Admin> {
  @ApiProperty()
  @IsNotEmpty()
  name?: string;

  @ApiProperty()
  @IsNotEmpty()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  password?: string;

  @ApiPropertyOptional({ type: 'enum', enum: Role })
  role?: Role;
}

export class FilterGetOneAdminDTO extends FilterGetOne implements Partial<Admin> {
  role?: Role;
  email?: string;
}
