import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class GenerateQrCodesDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    texts!: string[];
}
