import { Model, SortOrder } from 'mongoose';
import { Action } from '@modules/action/entities';
import { Report } from '@modules/report/entities';
import { Billing } from '@modules/billing/entities';
import { Offering } from '@modules/offering/entities/';
import { MatchRequest, PassesRequest } from '@modules/match-request/entities';
import { Tag } from '@modules/tag/entities';
import { User } from '@modules/users/entities';
import { Conversation } from '@modules/conversation/entities';
import { Message } from '@modules/message/entities';
import { Relationship } from '@modules/relationship/entities';
import { Notification } from '@modules/notification/entities';
import { Schedule } from '@modules/schedule/entities';

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
export type NotificationModelType = Model<Notification>;
export type ScheduleModelType = Model<Schedule>;
export type PassesRequestModelType = Model<PassesRequest>;
export type MongoQuery = '$eq' | '$gte' | '$lte' | '$in' | '$nin' | '$elemMatch' | '$exists' | '$ne' | '$all';

export enum BulkWriteKey {
  insertOne = 'insertOne',
  updateOne = 'updateOne',
  updateMany = 'updateMany',
}
export type IBulkWrite = Partial<Record<BulkWriteKey, any>>;
