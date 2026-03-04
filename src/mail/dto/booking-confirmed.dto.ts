import { Type } from "class-transformer";
import { IsArray, IsEmail, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class ReceiptItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  amount!: number;
}

export class TicketDto {
  @IsString()
  ticketNo!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  travelDate?: string;

  @IsString()
  description!: string;
}

export class BookingConfirmedDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsString()
  @MinLength(1)
  bookingId!: string;

  @IsString()
  @MinLength(1)
  travelDateText!: string; // "24 JAN 2026"

  @IsString()
  @MinLength(1)
  manageUrl!: string;

  @IsOptional()
  @IsString()
  qrBase64?: string; 

  @IsOptional()
  @IsString()
  qrFilename?: string; // "QR-Code.png"

  // ฟิลด์สำหรับใบเสร็จ (Receipt)
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @IsOptional()
  @IsString()
  receiptDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  receiptItems?: ReceiptItemDto[];

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ticketQrCodes?: string[];

  // For PDF Tickets with detailed info
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketDto)
  tickets?: TicketDto[];
}