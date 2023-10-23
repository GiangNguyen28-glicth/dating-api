import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import {
  Gender,
  IEntity,
  LookingFor,
  MongoID,
  RegisterType,
  RelationshipModeType,
  Role,
  VerifyUserStatus,
} from '@dating/common';
import { Relationship } from '@modules/relationship/entities';
import { Tag } from '@modules/tag/entities';

@Schema({ _id: false })
export class Image {
  @Prop()
  url: string;

  @Prop()
  blur?: string;

  @Prop()
  insId?: string;
}

@Schema({ _id: false })
export class FeatureAccessItem {
  @Prop({ type: Boolean, default: false })
  unlimited?: boolean;

  @Prop({ type: Number })
  amount?: number;

  constructor(amount: number) {
    this.amount = amount;
  }
}

@Schema({ _id: false })
export class ControlWhoYouSee {
  @Prop({ default: false })
  recentlyActive: boolean;
}
@Schema({ _id: false })
export class ControlWhoSeesYou {
  @Prop({ default: false })
  onlyPeopleIveLiked: boolean;
}

@Schema({ _id: false })
export class FeatureAccess {
  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  blur?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(100) })
  likes?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  rewind?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  superLike?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  hideAds?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  controlWhoSeesYou?: FeatureAccessItem;

  @Prop({ type: FeatureAccessItem, default: new FeatureAccessItem(0) })
  controlWhoYouSee?: FeatureAccessItem;
}

@Schema({ _id: false })
export class DiscoverySetting {
  @Prop({ default: 18 })
  minAge: number;

  @Prop({ default: 35 })
  maxAge: number;

  @Prop({ default: 100 })
  distance: number;

  @Prop({
    type: String,
    trim: true,
    enum: Object.values(LookingFor),
    default: LookingFor.ALL,
  })
  lookingFor: LookingFor;

  @Prop({ default: true })
  onlyShowAgeThisRange: boolean;

  @Prop({ default: true })
  onlyShowDistanceThisRange: boolean;

  @Prop({ default: true })
  recentlyActive: boolean;

  @Prop({ type: String, enum: Object.values(RelationshipModeType) })
  modeGoal: RelationshipModeType;
}

@Schema({ _id: false })
export class HiddenProfile {
  @Prop({ type: Boolean, default: false })
  inFinder?: boolean;

  @Prop({ type: Boolean, default: false })
  weight?: boolean;

  @Prop({ type: Boolean, default: false })
  height?: boolean;
}

@Schema({ _id: false })
export class UserSetting {
  @Prop({ type: DiscoverySetting, default: new DiscoverySetting() })
  discovery?: DiscoverySetting;

  @Prop({ type: ControlWhoSeesYou })
  controlWhoSeesYou?: ControlWhoSeesYou;

  @Prop({ type: ControlWhoYouSee })
  controlWhoYouSee?: ControlWhoYouSee;

  @Prop({ type: HiddenProfile, default: new HiddenProfile() })
  hiddenProfile?: HiddenProfile;
}

@Schema({ _id: false })
export class UserAddress {
  @Prop({ trim: true })
  country: string;

  @Prop({ trim: true })
  province: string;

  @Prop({ trim: true })
  district: string;

  @Prop({ trim: true })
  route: string;

  @Prop({ trim: true })
  fullAddress: string;
}

@Schema({ _id: false })
export class HomeTown {
  @Prop({ trim: true })
  province: string;

  @Prop({ trim: true })
  district: string;

  @Prop({ trim: true })
  ward: string;
}

@Schema({ _id: false })
export class SpotifyInfo {
  @Prop()
  artist: string;

  @Prop({ type: Image })
  image: Image;
}

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[];
}

@Schema({ _id: false })
export class Verify {
  @Prop({ default: false })
  isVerified?: boolean;

  @Prop({ type: String, enum: Object.values(VerifyUserStatus) })
  status?: VerifyUserStatus;

  @Prop()
  sendAt?: Date;

  @Prop()
  receiveDate?: Date;

  @Prop({ default: false })
  success?: boolean;
}

@Schema({ timestamps: true })
export class User implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phoneNumber: string;

  @Prop({ type: Date })
  birthDate: Date;

  @Prop({ type: Number })
  age: number;

  @Prop()
  bio: string;

  @Prop()
  school: string;

  @Prop()
  company: string;

  @Prop({ type: [String] })
  jobs: string[];

  @Prop({ type: Number })
  height: number;

  @Prop({ type: Number })
  weight: number;

  @Prop({ type: String, trim: true, enum: Object.values(Gender) })
  gender: Gender;

  @Prop({ default: true })
  showMeInTinder: boolean;

  @Prop({ type: String, trim: true, enum: Object.values(RegisterType) })
  registerType: RegisterType;

  @Prop({ type: UserAddress, default: new UserAddress() })
  address: UserAddress;

  @Prop({ type: HomeTown, default: new HomeTown() })
  homeTown: HomeTown;

  @Prop({ type: HomeTown, default: new HomeTown() })
  liveAt: HomeTown;

  @Prop({ type: GeoLocation })
  geoLocation: GeoLocation;

  @Prop({ type: UserSetting, default: new UserSetting() })
  setting: UserSetting;

  @Prop({ type: FeatureAccess, default: new FeatureAccess() })
  featureAccess: FeatureAccess;

  @Prop({ type: String, enum: Object.values(Role) })
  role: Role;

  @Prop([{ type: Image, default: [] }])
  images: Image[];

  @Prop()
  blurAvatar: string;

  @Prop([{ type: Image, default: null }])
  insImages: Image[];

  @Prop([{ type: SpotifyInfo, default: null }])
  spotifyInfo: SpotifyInfo[];

  @Prop([{ type: MongoID, ref: Tag.name }])
  tags: Tag[];

  @Prop([{ type: MongoID, ref: Relationship.name }])
  relationships: Relationship[];

  @Prop({
    type: MongoID,
    ref: Relationship.name,
  })
  relationshipStatus: Relationship;

  @Prop({ default: 0 })
  totalFinishProfile: number;

  @Prop({ type: Boolean, default: true })
  onlineNow: boolean;

  @Prop({ type: Date, default: new Date() })
  lastActiveDate: Date;

  @Prop()
  stripeCustomerId: string;

  @Prop({ type: Verify })
  verify: Verify;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Number, default: 0 })
  stepStarted: number;

  @Prop()
  slug: string;

  @Prop()
  keyword: string;

  createdAt?: Date;
  updatedAt?: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({
  geoLocation: '2dsphere',
  isBlocked: 1,
  isDeleted: 1,
  lastActiveDate: 1,
  age: 1,
  gender: 1,
});
