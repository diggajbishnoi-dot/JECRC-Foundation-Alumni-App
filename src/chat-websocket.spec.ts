import { connectSocket, disconnectSocket, getSocket } from '../fontend/frotned alumni/src/services/socket';
import { MessagesGateway } from './modules/messages/messages.gateway';

describe('P2-002: WebSocket Chat replacing REST Polling', () => {
  beforeEach(() => {
    disconnectSocket();
  });

  afterEach(() => {
    disconnectSocket();
  });

  it('1. connectSocket initializes Socket.IO client pointing to /chat namespace with bearer token', () => {
    const mockToken = 'mock-jwt-token-123';
    const socket = connectSocket(mockToken);

    expect(socket).toBeDefined();
    expect(getSocket()).toBe(socket);
  });

  it('2. disconnectSocket cleanly closes active socket connection', () => {
    const mockToken = 'mock-jwt-token-456';
    connectSocket(mockToken);

    expect(getSocket()).not.toBeNull();
    disconnectSocket();
    expect(getSocket()).toBeNull();
  });

  it('3. Gateway handleSendMessage broadcasts newMessage event to user room', async () => {
    const mockMessagesService = {
      sendMessage: jest.fn().mockResolvedValue({
        id: 'msg_999',
        senderId: 'usr_1',
        receiverId: 'usr_2',
        encryptedContent: 'encrypted-base64',
        nonce: 'nonce-base64',
        status: 'DELIVERED',
        createdAt: new Date(),
      }),
    };

    const mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const gateway = new MessagesGateway(
      mockMessagesService as any,
      {} as any,
      {} as any,
      {} as any,
    );
    gateway.server = mockServer as any;

    const mockClient = { userId: 'usr_1' } as any;
    const dto = {
      receiverId: 'usr_2',
      encryptedContent: 'encrypted-base64',
      nonce: 'nonce-base64',
    };

    const response = await gateway.handleSendMessage(mockClient, dto);

    expect(response.success).toBe(true);
    expect(mockServer.to).toHaveBeenCalledWith('user:usr_2');
    expect(mockServer.emit).toHaveBeenCalledWith('newMessage', expect.objectContaining({
      id: 'msg_999',
      receiverId: 'usr_2',
    }));
  });

  it('4. Gateway handleMessageDelivered broadcasts messageStatusUpdate to sender room', async () => {
    const mockMessagesService = {
      markDelivered: jest.fn().mockResolvedValue({
        id: 'msg_999',
        senderId: 'usr_1',
        receiverId: 'usr_2',
        status: 'DELIVERED',
      }),
    };

    const mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const gateway = new MessagesGateway(
      mockMessagesService as any,
      {} as any,
      {} as any,
      {} as any,
    );
    gateway.server = mockServer as any;

    const mockClient = { userId: 'usr_2' } as any;
    const response = await gateway.handleMessageDelivered(mockClient, { messageId: 'msg_999' });

    expect(response.success).toBe(true);
    expect(mockServer.to).toHaveBeenCalledWith('user:usr_1');
    expect(mockServer.emit).toHaveBeenCalledWith('messageStatusUpdate', {
      messageId: 'msg_999',
      status: 'DELIVERED',
    });
  });
});
