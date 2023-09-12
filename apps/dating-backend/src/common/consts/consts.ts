import { Schema } from 'mongoose';

export const PROVIDER_REPO = {
  TAG: 'TAG_REPO_PROVIDER',
  USER: 'USER_REPO_PROVIDER',
  CONVERSATION: 'CONVERSATION_REPO_PROVIDER',
  MESSAGE: 'MESSAGE_REPO_PROVIDER',
  BILLING: 'BILLING_REPO_PROVIDER',
  OFFERING: 'OFFERING_REPO_PROVIDER',
  ACTION: 'ACTION_REPO_PROVIDER',
  REPORT: 'REPORT_REPO_PROVIDER',
  MATCH_REQUEST: 'MATCH_REQUEST',
  RELATIONSHIP: 'RELATIONSHIP',
  NOTIFICATION: 'NOTIFICATION',
};
export const PROVIDER_SERVICE = {
  NEXMO: 'NEXMO_SMS',
};

export const SERVICE_NAME = {
  PAYMENT_SERVICE: 'PAYMENT_SERVICE',
};

export const QUEUE_NAME = {
  UPDATE_FEATURE_ACCESS: 'update_user_feature_access',
  USER_IMAGES_BUILDER: 'user_images_builder',
  MESSAGE_IMAGES_BUILDER: 'message_images_builder',
};

export const RMQ_CHANNEL = {
  USER_CHANNEL: 'user_channel',
  PAYMENT_CHANNEL: 'payment_channel',
  MESSAGE_CHANNEL: 'message_channel',
};

export const LANGUAGE = {
  EN: 'en',
  VI: 'vi',
};

export const DATABASE_TYPE = {
  MONGO: '_MONGO',
};

export const REFRESH_TOKEN_TTL = 365 * 24 * 60 * 60 * 1000;
export const SOCKET = 'Socket_';
export const SMS = 'Sms_';
export const TOKEN = 'Token_';
export const MongoID = Schema.Types.ObjectId;
export const MAX_COUNT_IN_ACTION_UPSERT = 999999;
export const DEFAULT_CHANNEL_ID = 'default_channel';
export const DEFAULT_LIKES_REMAINING = 100;
export const EXCLUDE_FIELDS = {
  USER: '-slug -keyword -registerType -setting -isBlocked -isFistLogin -geoLocation -featureAccess',
};
