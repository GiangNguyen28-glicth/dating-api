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
  MATCH_REQUEST: 'MATCH_REQUEST_REPO_PROVIDER',
  PASSES_REQUEST: 'PASSES_REQUEST_REPO_PROVIDER',
  RELATIONSHIP: 'RELATIONSHIP_REPO_PROVIDER',
  NOTIFICATION: 'NOTIFICATION_REPO_PROVIDER',
  SCHEDULE: 'SCHEDULE_REPO_PROVIDER',
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
  NOTIFICATION_UPDATER: 'notification_updater',
  SEND_MAIL: 'send_mail',
};

export const RMQ_CHANNEL = {
  USER_CHANNEL: 'user_channel',
  PAYMENT_CHANNEL: 'payment_channel',
  MESSAGE_CHANNEL: 'message_channel',
  NOTIFICATION_CHANNEL: 'notification_channel',
  MAIL_CHANNEL: 'mail_channel',
};

export const LANGUAGE = {
  EN: 'en',
  VI: 'vi',
};

export const DATABASE_TYPE = {
  MONGO: '_MONGO',
};

export const REFRESH_TOKEN_TTL = 365 * 24 * 60 * 60;
export const SOCKET_ID_TTL = 24 * 60 * 60;
export const REDIS_KEY_PREFIX = {
  NOTI_MATCHED: 'NOTI_MATCHED_',
  SOCKET: 'SOCKET_',
  AI_SUGGESTION: 'AI_SUGGESTION_',
};

export type AIAuthor = 'user' | 'bot';

export const SOCKET = 'SOCKET_';
export const SMS_LOGIN = 'SMS_LOGIN_';
export const SMS_DELETE_ACCOUNT = 'SMS_DELETE_ACCOUNT_';
export const TOKEN = 'TOKEN_LOGIN_';
export const OTP_EXPIRED_TIME = 5 * 60;
export const MongoID = Schema.Types.ObjectId;
export const MAX_COUNT_IN_ACTION_UPSERT = 999999;
export const DEFAULT_CHANNEL_ID = 'default_channel';
export const DEFAULT_LIKES_REMAINING = 100;
export const EXCLUDE_FIELDS = {
  USER: '-registerType -setting -isBlocked -isFistLogin -geoLocation -featureAccess -showMeInFinder',
};

export const ADMIN = 'ADMIN';
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const OK = 'OK';
