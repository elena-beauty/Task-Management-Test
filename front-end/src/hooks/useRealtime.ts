import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '.';
import { todoDeleted, todoUpserted } from '../store/slices/todosSlice';
import { notificationReceived } from '../store/slices/notificationsSlice';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const fallbackWs = apiUrl.replace(/\/api$/, '');
const wsUrl = import.meta.env.VITE_WS_URL ?? fallbackWs;

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
    const socket = io(`${wsUrl}/collab`, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;
    socket.on('todo.created', (todo) => dispatch(todoUpserted(todo)));
    socket.on('todo.updated', (todo) => dispatch(todoUpserted(todo)));
    socket.on('todo.deleted', (payload: { id: string }) => {
      dispatch(todoDeleted(payload.id));
    });
    socket.on('notification.created', (notification) =>
      dispatch(notificationReceived(notification)),
    );
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, token]);

  useEffect(() => {
    if (teamId && socketRef.current) {
      socketRef.current.emit('joinTeam', { teamId });
    }
  }, [teamId]);
};

