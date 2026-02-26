import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailModule } from "./mail/mail.module";
import { HealthController } from "./mail/mail.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }