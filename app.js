class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'pencil';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.shapes = [];
        this.users = new Map();
        this.userId = this.generateUserId();
        this.userColor = this.generateRandomColor();
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupUI();
        this.simulateOtherUsers();
        this.render();
    }

    setupCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set initial drawing styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(touch);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(touch);
        });
        
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
            });
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentColor = e.currentTarget.dataset.color;
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.fillStyle = this.currentColor;
            });
        });

        // Color picker for mobile
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.fillStyle = this.currentColor;
        });

        // Brush size slider
        const brushSlider = document.getElementById('brushSize');
        const brushValue = document.getElementById('brushValue');
        brushSlider.addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            brushValue.textContent = `${this.brushSize}px`;
            this.ctx.lineWidth = this.brushSize;
        });

        // Clear buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('mobileClear').addEventListener('click', () => this.clearCanvas());

        // Chat functionality
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                this.addChatMessage('You', message, this.userColor);
                this.simulateChatResponse(message);
                chatInput.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    setupUI() {
        // Update user count display
        this.updateUserCount();
        
        // Set initial active states
        document.querySelector('[data-tool="pencil"]').classList.add('active');
        document.querySelector('[data-color="#000000"]').classList.add('active');
        
        // Set color picker to match
        document.getElementById('colorPicker').value = this.currentColor;
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        // For shapes, store starting point
        if (['rectangle', 'circle', 'line'].includes(this.currentTool)) {
            this.startX = this.lastX;
            this.startY = this.lastY;
        }
        
        // For pencil/eraser, start path immediately
        if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        switch(this.currentTool) {
            case 'pencil':
                this.drawPencil(currentX, currentY);
                break;
            case 'eraser':
                this.drawEraser(currentX, currentY);
                break;
            case 'line':
                this.drawLine(currentX, currentY);
                break;
            case 'rectangle':
                this.drawRectangle(currentX, currentY);
                break;
            case 'circle':
                this.drawCircle(currentX, currentY);
                break;
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    drawPencil(x, y) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawEraser(x, y) {
        this.ctx.save();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLine(x, y) {
        // Clear and redraw with the line
        this.redrawCanvas();
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawRectangle(x, y) {
        this.redrawCanvas();
        const width = x - this.startX;
        const height = y - this.startY;
        
        if (this.currentColor === 'eraser') {
            this.ctx.clearRect(this.startX, this.startY, width, height);
        } else {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        }
    }

    drawCircle(x, y) {
        this.redrawCanvas();
        const radius = Math.sqrt(
            Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2)
        );
        
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.ctx.closePath();
        
        // Save the drawn shape
        if (this.currentTool !== 'pencil' && this.currentTool !== 'eraser') {
            this.shapes.push({
                tool: this.currentTool,
                color: this.currentColor,
                startX: this.startX,
                startY: this.startY,
                endX: this.lastX,
                endY: this.lastY,
                brushSize: this.brushSize
            });
        }
    }

    redrawCanvas() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redraw all saved shapes
        this.shapes.forEach(shape => {
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.brushSize;
            
            switch(shape.tool) {
                case 'line':
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.startX, shape.startY);
                    this.ctx.lineTo(shape.endX, shape.endY);
                    this.ctx.stroke();
                    break;
                case 'rectangle':
                    this.ctx.strokeRect(
                        shape.startX,
                        shape.startY,
                        shape.endX - shape.startX,
                        shape.endY - shape.startY
                    );
                    break;
                case 'circle':
                    const radius = Math.sqrt(
                        Math.pow(shape.endX - shape.startX, 2) + 
                        Math.pow(shape.endY - shape.startY, 2)
                    );
                    this.ctx.beginPath();
                    this.ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
            }
        });
        
        // Reset current drawing settings
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.shapes = [];
            this.addChatMessage('System', 'Canvas cleared', '#3B82F6');
        }
    }

    addChatMessage(user, message, color) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message mb-2';
        messageElement.innerHTML = `
            <span class="font-bold" style="color: ${color}">${user}:</span>
            <span class="ml-2">${message}</span>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateUserCount() {
        const userCount = 1 + this.users.size; // Current user + simulated users
        document.getElementById('userCount').textContent = userCount;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    generateRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    simulateOtherUsers() {
        // Simulate other users drawing (for demo purposes)
        setInterval(() => {
            if (Math.random() > 0.7 && this.users.size < 5) {
                const userId = 'user_' + Math.random().toString(36).substr(2, 5);
                const color = this.generateRandomColor();
                this.users.set(userId, { color, lastActive: Date.now() });
                this.updateUserCount();
                this.addChatMessage('System', `User ${userId.substring(0, 5)} joined the room`, '#10B981');
                
                // Simulate drawing activity
                setTimeout(() => {
                    this.simulateUserDrawing(userId, color);
                }, 1000);
            }
        }, 5000);
    }

    simulateUserDrawing(userId, color) {
        // Simulate a random shape being drawn
        const tools = ['rectangle', 'circle', 'line'];
        const tool = tools[Math.floor(Math.random() * tools.length)];
        
        const shape = {
            tool,
            color,
            startX: Math.random() * this.canvas.width * 0.8 + 50,
            startY: Math.random() * this.canvas.height * 0.8 + 50,
            endX: Math.random() * this.canvas.width * 0.8 + 50,
            endY: Math.random() * this.canvas.height * 0.8 + 50,
            brushSize: Math.floor(Math.random() * 10) + 2
        };
        
        this.shapes.push(shape);
        this.redrawCanvas();
    }

    simulateChatResponse(message) {
        // Simulate AI responses to certain keywords
        setTimeout(() => {
            const responses = {
                'hello': `Hello there! I'm a simulated user. Nice drawing!`,
                'hi': `Hi! How's your drawing going?`,
                'help': `You can use different tools from the sidebar. Try the circle tool!`,
                'cool': `Thanks! This app is built with Canvas and Tailwind CSS.`,
                'bye': `Goodbye! Keep creating amazing art!`
            };
            
            const lowerMsg = message.toLowerCase();
            let response = null;
            
            for (const [key, value] of Object.entries(responses)) {
                if (lowerMsg.includes(key)) {
                    response = value;
                    break;
                }
            }
            
            if (!response && Math.random() > 0.5) {
                const randomResponses = [
                    "That's interesting! What are you drawing?",
                    "I like your color choice!",
                    "Have you tried the rectangle tool?",
                    "This collaborative drawing is fun!",
                    "The brush size slider is really useful."
                ];
                response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
            }
            
            if (response) {
                this.addChatMessage('SimUser', response, '#8B5CF6');
            }
        }, 1000);
    }

    render() {
        // Animation or continuous rendering if needed
        requestAnimationFrame(() => this.render());
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});