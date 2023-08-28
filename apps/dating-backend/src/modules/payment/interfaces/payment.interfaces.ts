import { User } from '@modules/users/entities/user.entity';
import { CheckoutDTO } from '../dto/card.dto';

export interface IPaymentStrategy {
  createPayment(user: User, cardDto: CheckoutDTO): Promise<any>;
}
