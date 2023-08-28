import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDTO {
  @ApiProperty({ type: Number, default: 1, required: false })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  page: number;

  @ApiProperty({ type: Number, default: 100, required: false })
  @Max(100)
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  size: number;
}

export class FilterGetAll extends PaginationDTO {
  @ApiProperty({ type: [String], required: false })
  ids?: string[];

  @ApiProperty({ type: [String], required: false })
  sort?: string[];
}

export class FilterGetOne {
  _id?: string;
}
