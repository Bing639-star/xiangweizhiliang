require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const ADMIN_TOKEN = "xiangwei2026";

function checkAdmin(req, res, next) {
    const token = req.headers["admin-token"];
    if (token !== ADMIN_TOKEN) {
        return res.status(401).json({ message: "未授权访问" });
    }
    next();
}

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readInquiries() {
    const content = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
        throw new Error("data.json 必须保存为 JSON 数组");
    }
    return data;
}

function saveInquiries(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// 健康检查
app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "乡味智链后端运行正常" });
});

// 提交采购意向
app.post("/api/inquiries", (req, res) => {
    try {
        const body = req.body || {};
        const name = String(body.name || "").trim();
        const phone = String(body.phone || "").trim();
        const product = String(body.product || "").trim();
        const quantity = Number(body.quantity);
        const note = String(body.note || "").trim();

        if (!name || !phone || !product || !body.quantity) {
            return res.status(400).json({
                success: false,
                message: "请填写姓名、联系电话、意向产品和采购数量"
            });
        }
        if (name.length > 50 || product.length > 100) {
            return res.status(400).json({
                success: false,
                message: "姓名或产品名称过长"
            });
        }
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "请输入有效的中国大陆手机号码"
            });
        }
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000000) {
            return res.status(400).json({
                success: false,
                message: "采购数量必须是有效的正整数"
            });
        }
        if (note.length > 500) {
            return res.status(400).json({
                success: false,
                message: "需求备注不能超过500字"
            });
        }

        const inquiries = readInquiries();
        const newInquiry = {
            id: Date.now().toString(),
            name, phone, product, quantity, note,
            createdAt: new Date().toISOString()
        };
        inquiries.push(newInquiry);
        saveInquiries(inquiries);

        return res.status(201).json({
            success: true,
            message: "合作意向已成功提交",
            data: { id: newInquiry.id, createdAt: newInquiry.createdAt }
        });
    } catch (error) {
        console.error("提交采购意向失败：", error);
        return res.status(500).json({
            success: false,
            message: "服务器暂时无法保存数据，请稍后重试"
        });
    }
});

// 查询采购意向（管理员权限）
app.get("/api/inquiries", checkAdmin, (req, res) => {
    try {
        const inquiries = readInquiries();
        res.json({ success: true, total: inquiries.length, data: inquiries });
    } catch (error) {
        console.error("读取采购意向失败：", error);
        res.status(500).json({ success: false, message: "读取数据失败" });
    }
});

// 删除采购意向（管理员权限）
app.delete("/api/inquiries/:id", checkAdmin, (req, res) => {
    try {
        const id = req.params.id;
        const inquiries = readInquiries();
        const index = inquiries.findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: "未找到该记录" });
        }
        inquiries.splice(index, 1);
        saveInquiries(inquiries);
        res.json({ success: true, message: "删除成功" });
    } catch (error) {
        console.error("删除采购意向失败：", error);
        res.status(500).json({ success: false, message: "删除失败" });
    }
});

app.get("/api/ai/test", async (req, res) => {
    try {
        const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.AI_API_KEY;
        const model = process.env.AI_MODEL;

        if (!baseUrl || !apiKey || !model) {
            return res.status(503).json({
                success: false,
                message: "AI 服务尚未配置，请检查 server/.env 文件。"
            });
        }

        const response = await fetch(
            `${baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "user",
                            content: "请用一句话介绍河南南阳。"
                        }
                    ],
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        console.log("AI返回：", data);

        if (!response.ok) {
            return res.status(500).json({
                success: false,
                message: "AI API调用失败",
                error: data
            });
        }

        const answer = data.choices?.[0]?.message?.content || "没有获取到AI回答";

        res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error("AI测试失败：", error);
        res.status(500).json({
            success: false,
            message: "AI接口连接失败",
            error: error.message
        });
    }
});

/* ============================
   AI 聊天接口（真实 AI 模型）
============================ */
app.post("/api/ai/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "请输入问题"
            });
        }
       
        const systemPrompt = `
你是"乡味智链"的南阳乡村产业智能助手。

你的服务对象包括：
1. 普通消费者
2. 农产品采购商
3. 农户
4. 农产品经营者
5. 对南阳乡村文化感兴趣的用户

你主要服务于河南省南阳市。

你需要重点围绕以下内容回答：

一、南阳特色农产品
包括但不限于：
西峡猕猴桃、
西峡香菇、
南召辛夷、
方城裕丹参、
南阳艾草、
唐河桐蛋、
南阳特色农产品等。

二、南阳乡村文化
包括乡村特色、农业文化、地方产业和乡村振兴等内容。

三、农产品采购
可以帮助用户分析：
产品选择、
采购需求、
产品规格、
产地、
运输、
包装、
供货能力等。

四、特色产品推荐
根据用户的用途、预算、需求推荐适合的南阳特色产品。

回答要求：
1. 使用中文。
2. 回答清晰、简洁。
3. 不要假装知道平台不存在的真实库存。
4. 不要编造具体商家联系方式。
5. 如果用户询问平台没有的数据，应明确说明"当前平台暂无该数据"。
6. 尽量引导用户使用"产品档案"和"产销对接"功能。
`;

        const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.AI_API_KEY;
        const model = process.env.AI_MODEL;

        if (!baseUrl || !apiKey || !model) {
            return res.status(503).json({
                success: false,
                message: "AI 服务尚未配置，请检查 server/.env 文件。"
            });
        }

        const response = await fetch(
            `${baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("AI API错误：", data);
            return res.status(500).json({
                success: false,
                message: "AI服务暂时不可用"
            });
        }

        const answer = data.choices?.[0]?.message?.content || "暂时没有获得有效回答。";

        res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error("AI请求失败：", error);
        res.status(500).json({
            success: false,
            message: "AI助手连接失败"
        });
    }
});
app.post("/api/ai/generate-archive", async (req, res) => {
    try {
        const { productName, description } = req.body;

        if (!productName || !productName.trim()) {
            return res.status(400).json({
                success: false,
                message: "请输入产品名称"
            });
        }

        const systemPrompt = `你是"乡味智链"平台的农产品数字档案智能生成助手。

你的任务是根据农户提供的产品名称和简单描述，自动生成一份完整的农产品数字档案。

档案必须包含以下字段：
1. 品种：产品的具体品种名称
2. 产地：具体到县/乡镇的产地信息（以河南省南阳市为主）
3. 成熟季节/上市时间
4. 规格：产品的大小、等级、分选标准
5. 包装方式：常见的包装形式
6. 储存条件：保鲜、储存要求
7. 供应主体：可能的供应方类型（合作社、种植基地等）
8. 产品特性：口感、外观、营养价值等
9. 产业文化：与该产品相关的乡土文化或历史

回答要求：
1. 使用中文，格式清晰，每个字段一行。
2. 以南阳地区农产品为主要参考。
3. 如果信息不确定，标注"待核实"。
4. 不要编造具体的商家名称和联系方式。
5. 输出格式示例：
   品种：xxx
   产地：河南省南阳市xxx县
   成熟季节：xxx
   规格：xxx
   包装方式：xxx
   储存条件：xxx
   供应主体：xxx
   产品特性：xxx
   产业文化：xxx`;

        const userMessage = description
            ? `产品名称：${productName}\n农户描述：${description}\n\n请根据以上信息生成完整的农产品数字档案。`
            : `产品名称：${productName}\n请根据产品名称生成完整的农产品数字档案。`;

        const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.AI_API_KEY;
        const model = process.env.AI_MODEL;

        if (!baseUrl || !apiKey || !model) {
            return res.status(503).json({
                success: false,
                message: "AI 服务尚未配置，请检查 server/.env 文件。"
            });
        }

        const response = await fetch(
            `${baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("AI 档案生成错误：", data);
            return res.status(500).json({
                success: false,
                message: "AI 档案生成失败"
            });
        }

        const answer = data.choices?.[0]?.message?.content || "未能生成档案内容。";

        res.json({ success: true, answer: answer });

    } catch (error) {
        console.error("AI 档案生成失败：", error);
        res.status(500).json({
            success: false,
            message: "AI 档案生成服务异常"
        });
    }
});

/* ============================
   AI 产业助手接口
   产业分析 + 智能科普 + 文案生成
============================ */
app.post("/api/ai/industry", async (req, res) => {
    try {
        const { question, mode } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "请输入您的问题"
            });
        }

        const modePrompts = {
            analysis: `你是南阳农业产业分析专家。请围绕河南省南阳市的农业产业，分析用户询问的品类或产品的：
1. 近年产量趋势（如数据不确定请说明）
2. 市场参考价格区间
3. 主要销售渠道
4. 产业发展建议
回答要求：数据不确定时明确标注"仅供参考"，不编造精确数字。`,

            education: `你是南阳农产品科普专家。请用通俗易懂的语言，讲解用户询问的农产品的：
1. 食用价值/药用价值
2. 营养成分
3. 适宜人群
4. 食用/使用方法
5. 注意事项
回答要求：科学准确，通俗易懂，适合普通消费者阅读。`,

            copywriting: `你是南阳农产品营销文案专家。请根据用户提供的产品信息，生成用于宣传推广的文案：
1. 产品宣传语（一句话 slogan）
2. 产品卖点（3-5 条）
3. 社交媒体推广文案（100 字以内）
4. 产品故事（150 字以内）
回答要求：文案要有感染力，突出南阳地域特色和产品优势。`
        };

        const systemPrompt = modePrompts[mode] || modePrompts.education;

        const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.AI_API_KEY;
        const model = process.env.AI_MODEL;

        if (!baseUrl || !apiKey || !model) {
            return res.status(503).json({
                success: false,
                message: "AI 服务尚未配置，请检查 server/.env 文件。"
            });
        }

        const response = await fetch(
            `${baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question }
                    ],
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("AI 产业助手错误：", data);
            return res.status(500).json({
                success: false,
                message: "AI 产业助手服务暂时不可用"
            });
        }

        const answer = data.choices?.[0]?.message?.content || "暂时没有获得有效回答。";

        res.json({ success: true, answer: answer });

    } catch (error) {
        console.error("AI 产业助手失败：", error);
        res.status(500).json({
            success: false,
            message: "AI 产业助手服务异常"
        });
    }
});

/* ============================
   AI 图像识别检索接口
   用户描述图片内容，AI 匹配南阳特产档案
============================ */
app.post("/api/ai/identify", async (req, res) => {
    try {
        const { imageDescription } = req.body;

        if (!imageDescription || !imageDescription.trim()) {
            return res.status(400).json({
                success: false,
                message: "请描述您拍摄的农产品图片内容"
            });
        }

        const systemPrompt = `你是"乡味智链"平台的农产品智能识别助手。

用户会描述他们拍摄的农产品照片内容，你需要：

第一步：识别判断
根据用户的描述，判断这可能是哪种南阳特色农产品。

南阳特色农产品知识库：
1. 西峡猕猴桃 - 椭圆形绿色/黄褐色果实，表面有细毛，果肉绿色
2. 西峡香菇 - 伞状菌菇，褐色菌盖，白色菌褶，生长在木段上
3. 南召辛夷 - 毛茸茸的花蕾，灰绿色，形似毛笔头
4. 南阳月季 - 多色花朵，粉色/红色/黄色，有刺灌木
5. 桐柏茶叶 - 嫩绿色细长叶片，条索状
6. 南阳黄牛 - 黄色皮毛，体型高大健壮
7. 方城裕丹参 - 紫红色根部，羽状叶片
8. 南阳艾草 - 灰绿色叶片，背面有白色绒毛，有特殊香气
9. 唐河桐蛋 - 椭圆形蛋类，青白色蛋壳

第二步：输出匹配结果
请按以下格式输出：

🔍 识别结果：[最匹配的产品名称]
📋 匹配度：[高/中/低]
📍 产地：[产地信息]
📖 产品简介：[简要介绍]
🔗 建议：引导用户前往"产品档案"页面查看完整信息

如果无法判断，请说明"无法从描述中识别出具体产品"，并列出可能的选项。`;

        const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.AI_API_KEY;
        const model = process.env.AI_MODEL;

        if (!baseUrl || !apiKey || !model) {
            return res.status(503).json({
                success: false,
                message: "AI 服务尚未配置，请检查 server/.env 文件。"
            });
        }

        const response = await fetch(
            `${baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `请识别以下农产品照片：${imageDescription}` }
                    ],
                    temperature: 0.5
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("AI 图像识别错误：", data);
            return res.status(500).json({
                success: false,
                message: "AI 图像识别失败"
            });
        }

        const answer = data.choices?.[0]?.message?.content || "未能识别图片内容。";

        res.json({ success: true, answer: answer });

    } catch (error) {
        console.error("AI 图像识别失败：", error);
        res.status(500).json({
            success: false,
            message: "AI 图像识别服务异常"
        });
    }
});

// 启动服务
app.listen(PORT, () => {
    console.log(`乡味智链后端已启动：http://localhost:${PORT}`);
    console.log(`健康检查：http://localhost:${PORT}/api/health`);
    console.log(`AI测试接口：http://localhost:${PORT}/api/ai/test`);
});
