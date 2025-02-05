require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// 文本生成API路由
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            console.error('无效的请求格式:', req.body);
            return res.status(400).json({ error: '无效的消息格式' });
        }

        console.log('发送请求数据:', JSON.stringify({ messages }, null, 2));

        const requestBody = {
            model: 'qwen-plus',
            input: {
                messages: messages
            }
        };

        console.log('API请求体:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'disable'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('API响应解析错误:', responseText);
            return res.status(500).json({
                error: '服务器响应解析失败'
            });
        }

        if (!response.ok) {
            console.error('API响应错误状态:', response.status, response.statusText);
            console.error('API错误详情:', responseText);
            return res.status(response.status).json({
                error: `API请求失败: ${data.message || response.statusText}`
            });
        }

        console.log('API响应数据:', JSON.stringify(data, null, 2));

        if (data.code || !data.output) {
            console.error('API返回异常数据:', data);
            return res.status(500).json({
                error: data.message || data.error?.message || 'API返回数据格式错误'
            });
        }

        const responseData = {
            choices: [{
                message: {
                    content: data.output.text
                }
            }]
        };

        console.log('发送响应数据:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
    } catch (error) {
        console.error('API调用错误:', error);
        res.status(500).json({
            error: `服务器错误: ${error.message || '未知错误'}`
        });
    }
});

const PORT = process.env.PORT || 3000;

// 检查端口是否被占用
const net = require('net');
const server = net.createServer();

server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`端口 ${PORT} 已被占用，正在尝试关闭占用的进程...`);
        // 在 Windows 和 Unix 系统上尝试关闭占用端口的进程
        const { execSync } = require('child_process');
        try {
            if (process.platform === 'win32') {
                execSync(`netstat -ano | findstr :${PORT}`);
            } else {
                execSync(`lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
            }
            console.log(`成功释放端口 ${PORT}`);
            startServer();
        } catch (error) {
            console.error(`无法释放端口 ${PORT}:`, error);
            process.exit(1);
        }
    }
});

server.once('listening', () => {
    server.close();
    startServer();
});

server.listen(PORT);

function startServer() {
    app.listen(PORT)
        .on('error', (error) => {
            console.error('服务器启动错误:', error);
            process.exit(1);
        })
        .on('listening', () => {
            console.log(`服务器运行在端口 ${PORT}`);
        });
}