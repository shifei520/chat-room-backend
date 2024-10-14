import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { md5 } from 'src/utils';
import { loginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user-dto';
@Injectable()
export class UserService {
  @Inject(RedisService)
  private redisService: RedisService;
  @Inject(PrismaService)
  private prismaService: PrismaService;

  private logger = new Logger();

  async register(registerUserDto: RegisterUserDto) {
    const captcha = await this.redisService.get(
      `captcha_${registerUserDto.email}`,
    );
    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (registerUserDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: registerUserDto.username,
      },
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.prismaService.user.create({
        data: {
          username: registerUserDto.username,
          password: md5(registerUserDto.password),
          nickName: registerUserDto.nickName,
          email: registerUserDto.email,
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          headPic: true,
          createTime: true,
        },
      });
    } catch (error) {
      this.logger.error(error, UserService);
      return null;
    }
  }

  async login(loginUserDto: loginUserDto) {
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: loginUserDto.username,
      },
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (foundUser.password !== md5(loginUserDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    delete foundUser.password;

    return foundUser;
  }

  async findUserDetailById(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        headPic: true,
        createTime: true,
      },
    });

    return user;
  }

  async updatePassword(updateUserPasswordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `update_password_captcha_${updateUserPasswordDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (updateUserPasswordDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: updateUserPasswordDto.username,
      },
    });
    foundUser.password = md5(updateUserPasswordDto.password);

    try {
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: foundUser,
      });
      return '密码修改成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '密码修改失败';
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }

    try {
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: foundUser,
      });
      return '用户信息修改成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '用户信息修改失败';
    }
  }
}
