export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum VerifyUserStatus {
  ACCEPT = 'Accept',
  DECLINE = 'Decline',
  WAIT_FOR_DETECT = 'Wait for detect',
}

export enum TagType {
  EDUCATION = 'Education',
  PETS = 'Pets',
  DIETARY_PREFERENCE = 'Dietary Preference',
  PERSONALITY_TYPE = 'Personality Type',
  ZODIAC = 'Zodiac',
  SMOKE_QUESTION = 'Smoke question',
  LOVE_QUESTION = 'Love question',
  DO_EXERCISE = 'Do exercise',
}

export enum RegisterType {
  GOOGLE = 'Google',
  FACEBOOK = 'Facebook',
  PHONE_NUMBER = 'Phone number',
}

export enum LookingFor {
  MALE = 'Male',
  FEMALE = 'Female',
  ALL = 'All',
}

export enum MessageType {
  TEXT = 'Text',
  IMAGE = 'Image',
  GIF = 'Gif',
  VIDEO = 'Video',
  CALL = 'Call',
}

export enum MessageStatus {
  SEEN = 'Seen',
  SENT = 'Sent',
  RECEIVED = 'Received',
}

export enum ConversationType {
  MATCHED = 'Matched',
  SUPER_LIKE = 'Super like',
}

export enum BillingStatus {
  SUCCESS = 'Success',
  INPROGRESS = 'Inprogress',
  ERROR = 'Error',
}

export enum BillingProcess {
  INPROGRESS = 'Inprogress',
  EXPIRED = 'Expired',
}

export enum RefreshIntervalUnit {
  MINUTES = 'Minutes',
  HOURS = 'Hours',
  DAY = 'Day',
  WEEK = 'Week',
  MONTH = 'Month',
  YEAR = 'Year',
}

export enum Currency {
  'VND' = 'VND',
  'USD' = 'USD',
}

export enum OfferingType {
  FINDER_GOLD = 'Gold',
  FINDER_PREMIUM = 'Premium',
  FINDER_PLUS = 'Plus',
  FINDER_BOOSTS = 'Boosts',
  FINDER_SUPER_LIKE = 'Super like',
}

export enum MerchandisingType {
  HIDE_ADS = 'Hide ads',
  LIKE = 'Like',
  REWIND = 'Rewind',
  SUPER_LIKE = 'Super like',
  UN_BLUR = 'UnBlur',
  BOOSTS = 'Boosts',
}

export enum LimitType {
  UNLIMITED = 'Unlimited',
  RENEWABLE = 'Renewable',
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum RelationshipModeType {
  BFF = 'Bff',
  DATE = 'Date',
}

export enum TagRelationshipModeType {
  BFF = 'Bff',
  DATE = 'Date',
  ALL = 'All',
}

export enum ParentTagType {
  LIFE_STYLE = 'Life style',
  ABOUT_ME = 'About me',
}

export enum RelationshipType {
  RELATIONSHIP_STATUS = 'Relationship status',
  MODE = 'Mode',
  LOOKING_FOR = 'Looking for',
}

export enum JobStatus {
  INPROGRESS = 'Inprogress',
  TODO = 'Todo',
  DONE = 'Done',
  ERROR = 'Error',
}

export enum NotificationType {
  SYSTEM = 'System',
  MESSAGE = 'Message',
  PROMOTION = 'Promotion',
  LIKE = 'Like',
  SUPER_LIKE = 'Super like',
  MATCHED = 'Matched',
  SCHEDULE_DATING = 'Invite schedule dating',
  CANCEL_SCHEDULE_DATING = 'Cancel schedule dating',
  ACCEPT_SCHEDULE_DATING = 'Accept schedule dating',
  DECLINE_SCHEDULE_DATING = 'Decline schedule dating',
}

export enum NotificationStatus {
  SEEN = 'Seen',
  NOT_SEEN = 'Not seen',
  RECEIVED = 'Received',
  NOT_RECEIVED = 'Not received',
}

export enum MatchRqStatus {
  MATCHED = 'Matched',
  REQUESTED = 'Requested',
  SKIP = 'Skip',
  SUPER_LIKE = 'Super like',
}

export enum RequestDatingStatus {
  ACCEPT = 'Accept',
  DECLINE = 'Decline',
  WAIT_FOR_APPROVAL = 'Wait for approval',
  CANCEL = 'Cancel',
  SELF_CANCEL = 'Self cancel',
}

export enum CreatedDatingType {
  MANUAL = 'Manual',
  AI = 'AI',
}

export enum DatingStatus {
  YES = 'Yes',
  NO = 'No',
  HALFWAY = 'Halfway',
}
