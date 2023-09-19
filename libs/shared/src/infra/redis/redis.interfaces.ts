export interface IRedisSet {
  key: string;
  ttl: number;
  data: string;
}
