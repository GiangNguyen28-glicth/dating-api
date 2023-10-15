import { AIAuthor } from '@common/consts';

export interface IPayloadAISuggestion {
  author: AIAuthor;
  content: string;
}

export interface IPayloadPlace {
  name?: string;
  address?: string;
  textSearch?: string;
  rawContent?: string;
}
