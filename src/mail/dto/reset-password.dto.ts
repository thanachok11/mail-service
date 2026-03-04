import { IsEmail, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    to!: string;

    @IsString()
    @MinLength(1)
    customerName!: string;

    @IsString()
    @MinLength(1)
    resetUrl!: string;
}
