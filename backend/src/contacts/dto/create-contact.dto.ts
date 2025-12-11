import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsOptional()
  segment?: number;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  contract?: string;
}
