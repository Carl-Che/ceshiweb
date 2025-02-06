import OpenAI from "openai";
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

try {
    const openai = new OpenAI(
        {
            apiKey: process.env.ARK_API_KEY,
            baseURL: "https://ark.cn-beijing.volces.com/api/v3"
        }
    );
    const completion = await openai.chat.completions.create({
        model: "ep-20250205224209-nbg44",  // 火山引擎模型ID
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "你是谁？" }
        ],
    });
    console.log(completion.choices[0].message.content);
} catch (error) {
    console.log(`错误信息：${error}`);
    console.log("请参考文档：https://help.aliyun.com/zh/model-studio/developer-reference/error-code");
}