require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 文本生成API路由
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY || 'sk-956ff0915b4b4dc2b82f13a182866e0c'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: messages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '请求失败');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('API调用错误:', error);
        res.status(500).json({
            error: '抱歉，AI服务暂时无法响应，请稍后再试。'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});