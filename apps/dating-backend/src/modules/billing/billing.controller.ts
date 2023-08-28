import { CurrentUser } from '@common/decorators';
import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Billing } from './entities/billing.entity';
import { User } from '@modules/users/entities/user.entity';
import { IResponse, IResult } from '@common/interfaces';

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
