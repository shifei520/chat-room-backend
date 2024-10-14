import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async createOneToOne(userId: number, friendId: number) {
    if (!friendId) {
      throw new BadRequestException('聊天好友的 id 不能为空');
    }

    const { id } = await this.prismaService.chatroom.create({
      data: {
        type: false,
        name: '聊天室' + Math.random().toString().slice(2, 8),
      },
    });

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    await this.prismaService.userChatroom.create({
      data: {
        userId: friendId,
        chatroomId: id,
      },
    });

    return id;
  }

  async createGroup(userId: number, name: string) {
    if (!name) {
      throw new BadRequestException('群聊的名字不能为空');
    }

    const { id } = await this.prismaService.chatroom.create({
      data: {
        type: true,
        name,
      },
    });

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    return '创建成功';
  }

  async list(userId: number, name: string) {
    const chatroomsIds = await this.prismaService.userChatroom.findMany({
      where: {
        userId,
      },
      select: {
        chatroomId: true,
      },
    });

    const chatrooms = await this.prismaService.chatroom.findMany({
      where: {
        id: {
          in: chatroomsIds.map((item) => item.chatroomId),
        },
        name: {
          contains: name,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        createTime: true,
      },
    });

    const res = [];

    for (let i = 0; i < chatrooms.length; i++) {
      const chatroomId = chatrooms[i].id;

      const userIds = await this.prismaService.userChatroom.findMany({
        where: {
          chatroomId,
        },
      });

      if (chatrooms[i].type === false) {
        const user = await this.prismaService.user.findUnique({
          where: {
            id: userIds.filter((item) => item.userId !== userId)[0].userId,
          },
        });
        chatrooms[i].name = user.nickName;
      }

      res.push({
        ...chatrooms[i],
        userCount: userIds.length,
        userIds: userIds.map((item) => item.userId),
      });
    }

    return res;
  }

  async members(chatroomId: number) {
    const userIds = await this.prismaService.userChatroom.findMany({
      where: {
        chatroomId,
      },
      select: {
        userId: true,
      },
    });

    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: userIds.map((item) => item.userId),
        },
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
        createTime: true,
        email: true,
      },
    });

    return users;
  }

  async info(id: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });

    const users = await this.members(id);

    return {
      ...chatroom,
      users,
    };
  }

  async join(chatroomId: number, joinUsername: string) {
    if (!chatroomId) {
      throw new BadRequestException('id 不能为空');
    }
    if (!joinUsername) {
      throw new BadRequestException('joinUsername 不能为空');
    }

    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (!chatroom) {
      throw new BadRequestException('聊天室不存在');
    }

    if (!chatroom.type) {
      throw new BadRequestException('一对一聊天室不能加人');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        username: joinUsername,
      },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    await this.prismaService.userChatroom.create({
      data: {
        userId: user.id,
        chatroomId,
      },
    });

    return chatroom.id;
  }

  async quit(chatroomId: number, userId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (!chatroom) {
      throw new BadRequestException('聊天室不存在');
    }

    if (!chatroom.type) {
      throw new BadRequestException('一对一聊天室不能退出');
    }

    await this.prismaService.userChatroom.delete({
      where: {
        userId_chatroomId: {
          userId,
          chatroomId,
        },
      },
    });

    return '退出成功';
  }

  async queryOneToOneChatroom(userId1: number, userId2: number) {
    const chatrooms = await this.prismaService.userChatroom.findMany({
      where: {
        userId: userId1,
      },
    });
    const chatrooms2 = await this.prismaService.userChatroom.findMany({
      where: {
        userId: userId2,
      },
    });

    let res;
    for (let i = 0; i < chatrooms.length; i++) {
      const chatroom = await this.prismaService.chatroom.findFirst({
        where: {
          id: chatrooms[i].chatroomId,
        },
      });
      if (chatroom.type === true) {
        continue;
      }

      const found = chatrooms2.find(
        (item2) => item2.chatroomId === chatroom.id,
      );
      if (found) {
        res = found.chatroomId;
        break;
      }
    }

    return res;
  }
}
