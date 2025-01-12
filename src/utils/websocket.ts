import { Message, MessageType } from '../types/message';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private messageHandlers: ((message: Message) => void)[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private messageQueue: Message[] = [];

    constructor(private url: string) {}

    async connect(userId: number): Promise<void> {
        if (this.isConnecting) {
            console.log('Connection already in progress...');
            return;
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                console.log('Connecting to WebSocket...', this.url);
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected, sending CONNECT message...');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;

                    // 发送连接消息
                    this.sendMessage({
                        type: MessageType.CONNECT,
                        fromUserId: userId,
                        timestamp: Date.now()
                    });

                    // 发送队列中的消息
                    while (this.messageQueue.length > 0) {
                        const message = this.messageQueue.shift();
                        if (message) this.sendMessage(message);
                    }

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data) as Message;
                        console.log('Received message:', message);
                        this.messageHandlers.forEach(handler => handler(message));
                    } catch (error) {
                        console.error('Failed to parse message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnecting = false;
                    this.attemptReconnect(userId);
                };
            } catch (error) {
                this.isConnecting = false;
                console.error('Failed to connect WebSocket:', error);
                reject(error);
            }
        });
    }

    private attemptReconnect(userId: number) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(userId), 3000);
        }
    }

    sendMessage(message: Message) {
        console.log('Attempting to send message:', message);
        
        if (!message.fromUserId || typeof message.fromUserId !== 'number') {
            console.error('Invalid fromUserId in message:', message);
            throw new Error('Invalid message: missing or invalid fromUserId');
        }

        if (message.type === MessageType.PRIVATE_MSG && (!message.toUserId || typeof message.toUserId !== 'number')) {
            console.error('Invalid toUserId in private message:', message);
            throw new Error('Invalid message: missing or invalid toUserId');
        }
        
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not ready, queueing message');
            this.messageQueue.push(message);
            return;
        }

        try {
            const messageText = JSON.stringify(message);
            console.log('Sending message text:', messageText);
            this.ws.send(messageText);
        } catch (error) {
            console.error('Error sending message:', error);
            this.messageQueue.push(message);
            throw error;
        }
    }

    onMessage(handler: (message: Message) => void) {
        this.messageHandlers.push(handler);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
} 