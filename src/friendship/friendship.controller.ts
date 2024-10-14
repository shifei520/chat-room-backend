import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { RequireLogin, UserInfo } from 'src/custom-decorator';
import { FriendAddDto } from './dto/friend-add.dto';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('add')
  @RequireLogin()
  async addFriend(
    @UserInfo('userId') userId: number,
    @Body() friendAddDto: FriendAddDto,
  ) {
    return await this.friendshipService.addFriend(userId, friendAddDto);
  }

  @Get('request_list')
  @RequireLogin()
  async list(@UserInfo('userId') userId: number) {
    return await this.friendshipService.list(userId);
  }

  @Get('agree/:id')
  @RequireLogin()
  async agree(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.agree(friendId, userId);
  }

  @Get('reject/:id')
  @RequireLogin()
  async reject(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.reject(friendId, userId);
  }

  @Get('list')
  @RequireLogin()
  async friendship(
    @UserInfo('userId') userId: number,
    @Query('name') name: string,
  ) {
    return await this.friendshipService.friendship(userId, name);
  }

  @Get('remove/:id')
  @RequireLogin()
  async remove(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    return this.friendshipService.remove(friendId, userId);
  }
}
