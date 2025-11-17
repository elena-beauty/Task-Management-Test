import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(','),
    credentials: true,
  },
  namespace: 'collab',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET', 'super-secret'),
      });
      client.data.user = payload;
      client.join(`user-${payload.sub}`);
      this.logger.debug(`Client connected: ${payload.email}`);
    } catch (error) {
      this.logger.warn(`Socket connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.user) {
      this.logger.debug(`Client disconnected: ${client.data.user.email}`);
    }
  }

  @SubscribeMessage('joinTeam')
  handleJoinTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { teamId: string },
  ) {
    if (!client.data?.user) {
      client.disconnect();
      return;
    }
    client.join(`team-${data.teamId}`);
    client.emit('team.joined', { teamId: data.teamId });
  }

  broadcastTodoChange(teamId: string, event: string, payload: unknown) {
    this.server.to(`team-${teamId}`).emit(event, payload);
  }

  notifyUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user-${userId}`).emit(event, payload);
  }

  private extractToken(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Missing auth token');
    }
    return token;
  }
}

