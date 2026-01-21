import { io, Socket } from 'socket.io-client';

// Use environment variable or fallback to production URL
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'https://driver-tracking-app-2.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private driverId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(driverId: string): Socket {
    this.driverId = driverId;

    if (this.socket?.connected) {
      return this.socket;
    }

    // Clean up any existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected to:', SOCKET_URL);
      this.socket?.emit('driver:join', driverId);
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // If server closed connection, try to reconnect
      if (reason === 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.driverId) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.driverId) {
        console.log('Attempting to reconnect...');
        this.connect(this.driverId);
      }
    }, 3000);
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
