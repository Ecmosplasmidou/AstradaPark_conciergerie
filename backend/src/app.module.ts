import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ParkingModule } from './parking/parking.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import * as ejs from 'ejs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/parking'),
    AuthModule,
    ParkingModule,
    MailerModule.forRoot({
      transport: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: { 
          user: 'TON_USER', 
          pass: 'TON_PASS' 
        },
      },
      defaults: {
        from: '"KELVAL SARL" <noreply@kelval.fr>',
      },
      template: {
        dir: join(__dirname, 'parking', 'templates'),
        // SOLUTION ULTIME : Un adapter manuel pour ne plus dépendre du module interne
        adapter: {
          compile: (mail: any, callback: any) => {
            ejs.renderFile(mail.data.template, mail.data.context, {}, (err, html) => {
              if (err) return callback(err);
              mail.data.html = html;
              return callback();
            });
          },
        },
        options: {
          strict: true,
        },
      },
    }),
  ],
})
export class AppModule {}