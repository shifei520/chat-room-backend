import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FriendAddDto } from './dto/friend-add.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendshipService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async addFriend(userId: number, friendAddDto: FriendAddDto) {
    const friend = await this.prismaService.user.findUnique({
      where: {
        username: friendAddDto.username,
      },
    });

    if (!friend) {
      throw new BadRequestException('用户不存在');
    }

    if (friend.id === userId) {
      throw new BadRequestException('不能添加自己为好友');
    }

    const found = await this.prismaService.friendship.findMany({
      where: {
        OR: [
          {
            userId,
            friendId: friend.id,
          },
          {
            userId: friend.id,
            friendId: userId,
          },
        ],
      },
    });

    if (found.length) {
      throw new BadRequestException('已经是好友了');
    }
    return await this.prismaService.friendRequest.create({
      data: {
        fromUserId: userId,
        toUserId: friend.id,
        reason: friendAddDto.reason,
        status: 0,
      },
    });
  }

  async list(userId: number) {
    const fromMeRequest = await this.prismaService.friendRequest.findMany({
      where: {
        fromUserId: userId,
      },
    });

    const toMeRequest = await this.prismaService.friendRequest.findMany({
      where: {
        toUserId: userId,
      },
    });

    const res = {
      toMe: [],
      fromMe: [],
    };

    for (let i = 0; i < fromMeRequest.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: fromMeRequest[i].toUserId,
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
      res.fromMe.push({
        ...fromMeRequest[i],
        toUser: user,
      });
    }

    for (let i = 0; i < toMeRequest.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: toMeRequest[i].fromUserId,
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
      res.toMe.push({
        ...toMeRequest[i],
        fromUser: user,
      });
    }

    return res;
  }

  async agree(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: friendId,
        toUserId: userId,
        status: 0,
      },
      data: {
        status: 1,
      },
    });

    const res = await this.prismaService.friendship.findMany({
      where: {
        userId,
        friendId,
      },
    });

    if (!res.length) {
      await this.prismaService.friendship.create({
        data: {
          userId,
          friendId,
        },
      });
    }
    return '添加成功';
  }

  async reject(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: friendId,
        toUserId: userId,
        status: 0,
      },
      data: {
        status: 2,
      },
    });
    return '已拒绝';
  }

  async friendship(userId: number, name: string) {
    const friends = await this.prismaService.friendship.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            friendId: userId,
          },
        ],
      },
    });

    const set = new Set<number>();

    for (const friend of friends) {
      set.add(friend.friendId);
      set.add(friend.userId);
    }

    const friendIds = Array.from(set).filter((id) => id !== userId);

    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: friendIds,
        },
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
      },
    });

    return users.filter((user) => user.nickName.includes(name));
  }

  async remove(friendId: number, userId: number) {
    await this.prismaService.friendship.deleteMany({
      where: {
        userId,
        friendId,
      },
    });
    return '删除成功';
  }
}
