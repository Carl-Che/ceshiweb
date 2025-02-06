require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const imageRouter = require('./routes/image');

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// 图片识别API路由
app.use('/api/image', imageRouter);

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
            model: 'ep-20250205224209-nbg44',
            messages: messages
        };

        console.log('API请求体:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
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

        if (data.error) {
            console.error('API返回异常数据:', data);
            return res.status(500).json({
                error: data.error?.message || 'API返回数据格式错误'
            });
        }

        const responseData = {
            choices: [{
                message: {
                    content: data.choices[0].message.content
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

// 直接启动服务器
startServer();

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