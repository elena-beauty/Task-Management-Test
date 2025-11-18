import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '.';
import { todoDeleted, todoUpserted } from '../store/slices/todosSlice';
import { notificationReceived } from '../store/slices/notificationsSlice';
import type { Todo } from '../types';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
const fallbackWs = apiUrl.replace(/\/api$/, '');
const wsUrl = import.meta.env.VITE_WS_URL ?? fallbackWs;

// Transform snake_case backend data to camelCase frontend format
const transformTodo = (data: any): Todo => {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    dueDate: data.due_date || data.dueDate,
    status: data.status,
    assignee: data.assignee
      ? {
          id: data.assignee.id,
          email: data.assignee.email,
          name: data.assignee.name,
        }
      : null,
    team: data.team
      ? {
          id: data.team.id,
          name: data.team.name,
          description: data.team.description,
          owner: data.team.owner
            ? {
                id: data.team.owner.id || data.team.owner_id,
                email: data.team.owner.email || '',
                name: data.team.owner.name || '',
              }
            : {
                id: data.team.owner_id || '',
                email: '',
                name: '',
              },
          role: 'member' as const,
          createdAt: data.team.created_at || data.team.createdAt,
        }
      : {
          id: data.team_id,
          name: '',
          owner: { id: '', email: '', name: '' },
          role: 'member' as const,
        },
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
};

export const useRealtime = (teamId?: string) => {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    
    console.log('Connecting to WebSocket at:', wsUrl);
    console.log('Token available:', !!token);
    
    const socket = io(wsUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      upgrade: true,
      rememberUpgrade: true,
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connected, transport:', socket.io.engine.transport.name);
    });
    
    socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
      });
      // Try to reconnect with polling only if websocket fails
      if (error.type === 'TransportError' || error.message?.includes('websocket')) {
        console.log('Transport error detected, will retry with polling fallback...');
        // The socket will automatically retry with available transports
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });
    
    socket.on('upgrade', () => {
      console.log('Transport upgraded to:', socket.io.engine.transport.name);
    });
    
    socket.on('upgradeError', (error) => {
      console.warn('Transport upgrade error:', error);
      // Continue with polling if upgrade fails
    });
    
    socketRef.current = socket;
    
    socket.on('todo.created', (data: any) => {
      console.log('✅ Received todo.created event:', data);
      const transformed = transformTodo(data);
      dispatch(todoUpserted(transformed));
    });
    
    socket.on('todo.updated', (data: any) => {
      console.log('✅ Received todo.updated event:', data);
      const transformed = transformTodo(data);
      dispatch(todoUpserted(transformed));
    });
    
    socket.on('todo.deleted', (payload: { id: string }) => {
      console.log('✅ Received todo.deleted event:', payload);
      dispatch(todoDeleted(payload.id));
    });
    
    socket.on('team.joined', (data: any) => {
      console.log('✅ Successfully joined team room:', data);
    });
    
    socket.on('notification.created', (notification) => {
      dispatch(notificationReceived(notification));
    });
    
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, token]);

  useEffect(() => {
    if (!teamId) {
      return;
    }
    
    const joinTeam = () => {
      if (socketRef.current?.connected) {
        console.log('Joining team room:', teamId);
        socketRef.current.emit('joinTeam', { teamId }, (response: any) => {
          console.log('Join team response:', response);
        });
      }
    };
    
    if (socketRef.current?.connected) {
      joinTeam();
    } else if (socketRef.current) {
      // If socket exists but not connected yet, wait for connection
      socketRef.current.once('connect', () => {
        console.log('Socket connected, joining team:', teamId);
        joinTeam();
      });
    }
  }, [teamId]);
};

