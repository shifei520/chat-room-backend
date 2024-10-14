import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { RequireLogin, UserInfo } from 'src/custom-decorator';

@Controller('chatroom')
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  @Get('create-one-to-one')
  @RequireLogin()
  async createOneToOne(
    @UserInfo('userId') userId: number,
    @Query('friendId') friendId: number,
  ) {
    return await this.chatroomService.createOneToOne(userId, friendId);
  }

  @Get('create-group')
  @RequireLogin()
  async createGroup(
    @UserInfo('userId') userId: number,
    @Query('name') name: string,
  ) {
    return await this.chatroomService.createGroup(userId, name);
  }

  @Get('list')
  @RequireLogin()
  async list(@UserInfo('userId') userId: number, @Query('name') name: string) {
    return await this.chatroomService.list(userId, name);
  }

  @Get('members')
  @RequireLogin()
  async members(@Query('chatroomId') chatroomId: number) {
    return await this.chatroomService.members(chatroomId);
  }

  @Get('info/:id')
  @RequireLogin()
  async info(@Param('id') id: number) {
    return await this.chatroomService.info(id);
  }

  @Get('join/:id')
  @RequireLogin()
  async join(
    @Param('id') id: number,
    @Query('joinUsername') joinUsername: string,
  ) {
    return await this.chatroomService.join(id, joinUsername);
  }

  @Get('quit/:id')
  @RequireLogin()
  async quit(@Param('id') id: number, @UserInfo('userId') userId: number) {
    return await this.chatroomService.quit(id, userId);
  }

  @Get('findChatroom')
  @RequireLogin()
  async findChatroom(
    @Query('userId1') userId1: string,
    @Query('userId2') userId2: string,
  ) {
    if (!userId1 || !userId2) {
      throw new BadRequestException('用户 id 不能为空');
    }
    return this.chatroomService.queryOneToOneChatroom(+userId1, +userId2);
  }
}
