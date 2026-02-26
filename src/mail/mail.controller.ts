import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { MailService } from "./mail.service";
import { BookingConfirmedDto } from "./dto/booking-confirmed.dto";
import { ApiKeyGuard } from "../common/guards/api-key.guard";

@Controller("mail")
export class MailController {
  constructor(private mail: MailService) {}

  @UseGuards(ApiKeyGuard)
  @Post("booking-confirmed")
  async bookingConfirmed(@Body() dto: BookingConfirmedDto) {
    await this.mail.sendBookingConfirmed(dto);
    return { ok: true };
  }
}

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { ok: true };
  }
}