import { Action } from '@modules/action/entites/action.entity';
import { Report } from '@modules/report/entities/report.entity';
import { Billing } from '@modules/billing/entities/billing.entity';
import { Offering } from '@modules/offering/entities/offering.entity';
import { MatchRequest } from '@modules/match-request/entities/match-request.entity';
import { Model, SortOrder } from 'mongoose';
import { Tag } from '@modules/tag/entities/tag.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversation/entities/conversation.entity';
import { Message } from '@modules/message/entities/message.entity';
import { Relationship } from '@modules/relationship/entities/relationship.entity';

export type SortQuery = { [key: string]: SortOrder };
export type TagModelType = Model<Tag>;
export type UserModelType = Model<User>;
export type ConversationModelType = Model<Conversation>;
export type MessageModelType = Model<Message>;
export type OfferingModelType = Model<Offering>;
export type BillingModelType = Model<Billing>;
export type ActionModelType = Model<Action>;
export type ReportModelType = Model<Report>;
export type MatchRequestModelType = Model<MatchRequest>;
export type RelationshipModelType = Model<Relationship>;
export type MongoQuery =
  | '$eq'
  | '$gte'
  | '$lte'
  | '$in'
  | '$nin'
  | '$elemMatch'
  | '$exists'
  | '$ne';
