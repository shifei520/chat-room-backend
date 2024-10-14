import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.163.com',
      port: 25,
      secure: false,
      auth: {
        user: 'shifei200004@163.com',
        pass: 'RLKZKUZOYHIDADPK',
      },
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: '聊天室',
        address: 'shifei200004@163.com',
      },
      to,
      subject,
      html,
    });
  }
}
