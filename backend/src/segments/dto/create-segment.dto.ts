import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  allowsFreeMessage?: boolean;
}
