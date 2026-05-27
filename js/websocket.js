/**
 * ================================================
 * 世界烈酒图鉴 - WebSocket 实时通信
 * T15: WebSocket实现（可选功能）
 * ================================================
 */

/**
 * WebSocket管理器
 */
class WebSocketManager {
    constructor(options = {}) {
        this.options = {
            url: options.url || 'wss://example.com/ws', // 可配置WebSocket服务器
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            heartbeatInterval: options.heartbeatInterval || 30000,
            ...options
        };
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.messageHandlers = new Map();
        this.pendingMessages = [];
        this.listeners = [];
    }

    /**
     * 连接到WebSocket服务器
     * @returns {Promise}
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            
            try {
                this.ws = new WebSocket(this.options.url);
                
                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.flushPendingMessages();
                    this.notifyListeners('open');
                    console.log('WebSocket已连接');
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.ws.onerror = (error) => {
                    console.warn('WebSocket错误:', error);
                    this.notifyListeners('error', error);
                };
                
                this.ws.onclose = () => {
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.notifyListeners('close');
                    this.scheduleReconnect();
                };
                
            } catch (error) {
                console.warn('WebSocket连接失败:', error);
                // WebSocket不可用时静默降级
                this.isConnected = false;
                resolve(); // 不拒绝，让应用继续运行
            }
        });
    }

    /**
     * 处理接收到的消息
     * @param {MessageEvent} event
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            
            // 调用对应的处理器
            const handler = this.messageHandlers.get(type);
            if (handler) {
                handler(payload);
            }
            
            this.notifyListeners('message', data);
        } catch (error) {
            console.warn('消息解析失败:', error);
        }
    }

    /**
     * 发送消息
     * @param {string} type - 消息类型
     * @param {any} payload - 消息数据
     * @returns {boolean}
     */
    send(type, payload = {}) {
        const message = { type, payload, timestamp: Date.now() };
        
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // 缓存消息，稍后重发
            this.pendingMessages.push(message);
            return false;
        }
        
        try {
            this.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.warn('消息发送失败:', error);
            this.pendingMessages.push(message);
            return false;
        }
    }

    /**
     * 注册消息处理器
     * @param {string} type - 消息类型
     * @param {Function} handler - 处理函数
     */
    on(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    /**
     * 移除消息处理器
     * @param {string} type
     */
    off(type) {
        this.messageHandlers.delete(type);
    }

    /**
     * 添加事件监听器
     * @param {Function} callback
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 通知所有监听器
     * @param {string} event
     * @param {any} data
     */
    notifyListeners(event, data) {
        this.listeners.forEach(cb => cb(event, data));
    }

    /**
     * 刷新待发送消息
     */
    flushPendingMessages() {
        while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift();
            const { type, payload } = msg;
            this.send(type, payload);
        }
    }

    /**
     * 启动心跳
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send('ping', { timestamp: Date.now() });
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 计划重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.warn('WebSocket重连次数已达上限');
            return;
        }
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`WebSocket尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
            this.connect();
        }, this.options.reconnectInterval);
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.stopHeartbeat();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
    }
}

/**
 * 创建WebSocket管理器实例（延迟初始化）
 */
function createWebSocketManager(options = {}) {
    return new WebSocketManager(options);
}

// 模拟实时更新（当WebSocket不可用时的降级方案）
const MockRealtime = {
    isEnabled: false,
    updateInterval: null,
    listeners: [],
    
    enable(interval = 30000) {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        this.updateInterval = setInterval(() => {
            this.notifyListeners('update', {
                timestamp: Date.now(),
                type: 'periodic'
            });
        }, interval);
        
        console.log('模拟实时更新已启用');
    },
    
    disable() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isEnabled = false;
    },
    
    addListener(callback) {
        this.listeners.push(callback);
    },
    
    notifyListeners(event, data) {
        this.listeners.forEach(cb => cb(event, data));
    }
};

// 创建全局实例（延迟初始化）
let wsManager = null;

/**
 * 获取WebSocket管理器
 * @returns {WebSocketManager}
 */
function getWebSocketManager() {
    if (!wsManager) {
        wsManager = createWebSocketManager();
    }
    return wsManager;
}

// 导出全局
window.WebSocketManager = WebSocketManager;
window.createWebSocketManager = createWebSocketManager;
window.getWebSocketManager = getWebSocketManager;
window.MockRealtime = MockRealtime;