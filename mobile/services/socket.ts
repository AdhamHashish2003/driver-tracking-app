import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private driverId: string | null = null;

  connect(driverId: string): Socket {
    this.driverId = driverId;

    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('driver:join', driverId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  sendLocation(lat: number, lng: number, speed?: number, heading?: number): void {
    if (!this.socket || !this.driverId) return;

    this.socket.emit('driver:location', {
      driverId: this.driverId,
      lat,
      lng,
      speed: speed || 0,
      heading: heading || 0,
    });
  }

  updateStatus(status: string): void {
    if (!this.socket || !this.driverId) return;

    this.socket.emit('driver:status', {
      driverId: this.driverId,
      status,
    });
  }

  updateDelivery(deliveryId: string, status: string, notes?: string): void {
    if (!this.socket) return;

    this.socket.emit('delivery:update', {
      deliveryId,
      status,
      notes,
    });
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.driverId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
