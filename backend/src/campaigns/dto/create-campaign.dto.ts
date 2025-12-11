import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Speed } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Speed)
  @IsNotEmpty()
  speed: Speed;

  @IsString()
  @IsNotEmpty()
  segment: string;
}
