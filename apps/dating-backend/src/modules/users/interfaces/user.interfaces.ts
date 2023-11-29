import { PipelineStage } from 'mongoose';
export interface FinalCondRecommendation {
  $lookup?: PipelineStage.Lookup;
  $geoNear?: PipelineStage.GeoNear;
  $match?: PipelineStage.Match;
}

export interface InsPayload {
  id: string;
  media_type: string;
  media_url: string;
  user_name: string;
  timestamp: string;
}

export interface SpotifyImagePayload {
  height: number;
  url: string;
  width: string;
}

export interface SpotifyPayload {
  images: SpotifyImagePayload[];
  name: string;
}

export const excludeFieldRecommendation = {
  __v: 0,
  geoLocation: 0,
  setting: 0,
  registerType: 0,
  featureAccess: 0,
  isBlocked: 0,
  isDeleted: 0,
  stepStarted: 0,
  createdAt: 0,
  updatedAt: 0,
  showMeInFinder: 0,
};
