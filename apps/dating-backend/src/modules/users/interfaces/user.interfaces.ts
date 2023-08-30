import { ImageDTO } from '../dto/update-user.dto';

export interface IImageBuilder {
  userId: string;
  images: ImageDTO[];
}
