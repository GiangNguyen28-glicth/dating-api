import { PartialType } from '@nestjs/swagger';
import { CreateMatchRequestDto } from './create-match-request.dto';

export class UpdateMatchRequestDto extends PartialType(CreateMatchRequestDto) {}
