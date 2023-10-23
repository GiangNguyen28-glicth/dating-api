export interface IUpdateMany<T> {
  ids: string[];
  entities: Partial<T>;
}
