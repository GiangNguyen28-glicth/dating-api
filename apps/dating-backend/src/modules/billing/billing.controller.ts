import { CurrentUser } from '@common/decorators';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { Billing } from './entities/billing.entity';

@ApiTags(Billing.name)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  async findAllByUser(@CurrentUser() user: User): Promise<IResult<Billing>> {
    return await this.billingService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Billing> {
    return await this.billingService.findOne({ _id: id });
  }

  @Delete(':id')
  async remove(@Param('id') _id: string): Promise<IResponse> {
    return await this.billingService.remove(_id);
  }
}
