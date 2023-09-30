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
