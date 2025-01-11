import { Message, MessageType } from '../types/message';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private messageCallback: ((message: Message) => void) | null = null;

    constructor(url: string) {
        this.url = url;
    }

    connect(userId: string) {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.sendMessage({
                type: MessageType.CONNECT,
                fromUserId: userId,
                content: '',
                timestamp: Date.now()
            });
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data) as Message;
            if (this.messageCallback) {
                this.messageCallback(message);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
    }

    sendMessage(message: Message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    onMessage(callback: (message: Message) => void) {
        this.messageCallback = callback;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
} 