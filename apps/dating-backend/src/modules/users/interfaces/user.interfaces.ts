import { PipelineStage } from 'mongoose';
export interface FinalCondRecommendation {
  $lookup?: PipelineStage.Lookup;
  $geoNear?: PipelineStage.GeoNear;
  $match?: PipelineStage.Match;
}
