(() => {
    if (document.getElementById("xiangwei-ai-root")) return;

    const root = document.createElement("div");
    root.id = "xiangwei-ai-root";

    root.innerHTML = `
    <section class="xw-ai-window" id="xwAiWindow"
             role="dialog" aria-label="乡味AI助手">
      <header class="xw-ai-header">
        <div class="xw-ai-brand">
          <strong> 乡味 AI 助手</strong>
          <small>南阳特色产品与乡村文化</small>
        </div>
        <button class="xw-ai-close" id="xwAiClose"
                aria-label="关闭聊天窗口">×</button>
      </header>

      <div class="xw-ai-messages" id="xwAiMessages"
           aria-live="polite">
        <div class="xw-ai-message bot">
          你好！我是乡味 AI 助手。
          我可以帮你了解南阳特色农产品、乡村文化，
          也可以引导你填写产销对接信息。
        </div>
      </div>

      <div class="xw-ai-quick">
        <button type="button" data-question="南阳有哪些特色农产品？">南阳有哪些特产？</button>
        <button type="button" data-question="请介绍西峡猕猴桃的特色。">了解西峡猕猴桃</button>
        <button type="button" data-question="我想采购南阳农产品，应该怎么做？">我要采购农产品</button>
        <button type="button" data-link="ai-features.html" style="background:#b28643;color:white;border-color:#b28643;">使用 AI 高级功能 </button>
      </div>

      <form class="xw-ai-form" id="xwAiForm">
        <input class="xw-ai-input" id="xwAiInput"
               maxlength="1000" autocomplete="off"
               placeholder="输入你想咨询的问题……"
               aria-label="输入咨询问题" required />
        <button class="xw-ai-send" id="xwAiSend" type="submit">发送</button>
      </form>

      <div class="xw-ai-footer">
        <span style="color:#8a9085;font-size:11px">乡味智链 · AI 智能助手</span>
      </div>
    </section>

    <button class="xw-ai-launcher" id="xwAiLauncher"
            type="button" aria-expanded="false">
       乡味 AI
    </button>
  `;

    document.body.appendChild(root);

    const windowEl = root.querySelector("#xwAiWindow");
    const launcher = root.querySelector("#xwAiLauncher");
    const closeBtn = root.querySelector("#xwAiClose");
    const form = root.querySelector("#xwAiForm");
    const input = root.querySelector("#xwAiInput");
    const sendBtn = root.querySelector("#xwAiSend");
    const messages = root.querySelector("#xwAiMessages");

    function toggleWindow(open) {
        windowEl.classList.toggle("is-open", open);
        launcher.setAttribute("aria-expanded", String(open));
        if (open) input.focus();
    }

    function addMessage(text, role) {
        const message = document.createElement("div");
        message.className = `xw-ai-message ${role}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    launcher.addEventListener("click", () => {
        toggleWindow(!windowEl.classList.contains("is-open"));
    });

    closeBtn.addEventListener("click", () => toggleWindow(false));

    root.querySelectorAll("[data-question]").forEach(button => {
        button.addEventListener("click", () => {
            input.value = button.dataset.question;
            form.requestSubmit();
        });
    });

    root.querySelectorAll("[data-question]").forEach(button => {
        button.addEventListener("click", () => {
            input.value = button.dataset.question;
            form.requestSubmit();
        });
    });

    root.querySelectorAll("[data-link]").forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = button.dataset.link;
        });
    });

    async function sendQuestion(question) {
        addMessage(question, "user");

        const waiting = addMessage("正在思考，请稍候……", "bot");
        sendBtn.disabled = true;
        input.disabled = true;

        try {
            // ... existing code ...
            const response = await fetch("/api/ai/chat", {
// ... existing code ...
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: question })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `请求失败（${response.status}）`);
            }

            waiting.textContent = data.answer || "暂时没有收到回答，请稍后重试。";
        } catch (error) {
            waiting.textContent =
                "暂时无法连接 AI 服务。请确认后端已启动，并检查 AI 接口配置。\n" +
                "详细信息：" + error.message;
        } finally {
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
            messages.scrollTop = messages.scrollHeight;
        }
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question || sendBtn.disabled) return;

        input.value = "";
        sendQuestion(question);
    });
})();

// (() => {
//     if (document.getElementById("xiangwei-ai-root")) return;
//
//     const root = document.createElement("div");
//     root.id = "xiangwei-ai-root";
//
//     root.innerHTML = `
//     <section class="xw-ai-window" id="xwAiWindow"
//              role="dialog" aria-label="乡味AI助手">
//       <header class="xw-ai-header">
//         <div class="xw-ai-brand">
//           <strong> 乡味 AI 助手</strong>
//           <small>南阳特色产品与乡村文化</small>
//         </div>
//         <button class="xw-ai-close" id="xwAiClose"
//                 aria-label="关闭聊天窗口">×</button>
//       </header>
//
//       <div class="xw-ai-messages" id="xwAiMessages"
//            aria-live="polite">
//         <div class="xw-ai-message bot">
//           你好！我是乡味 AI 助手。
//           我可以帮你了解南阳特色农产品、乡村文化，
//           也可以引导你填写产销对接信息。
//         </div>
//       </div>
//
//       <div class="xw-ai-quick">
//         <button type="button" data-question="南阳有哪些特色农产品？">南阳有哪些特产？</button>
//         <button type="button" data-question="请介绍西峡猕猴桃的特色。">了解西峡猕猴桃</button>
//         <button type="button" data-question="我想采购南阳农产品，应该怎么做？">我要采购农产品</button>
//       </div>
//
//       <form class="xw-ai-form" id="xwAiForm">
//         <input class="xw-ai-input" id="xwAiInput"
//                maxlength="1000" autocomplete="off"
//                placeholder="输入你想咨询的问题……"
//                aria-label="输入咨询问题" required />
//         <button class="xw-ai-send" id="xwAiSend" type="submit">发送</button>
//       </form>
//
//       <div class="xw-ai-footer">
//         <a href="ai.html" id="xwAiFullLink">进入完整 AI 问答 →</a>
//       </div>
//     </section>
//
//     <button class="xw-ai-launcher" id="xwAiLauncher"
//             type="button" aria-expanded="false">
//        乡味 AI
//     </button>
//   `;
//
//     document.body.appendChild(root);
//
//     const windowEl = root.querySelector("#xwAiWindow");
//     const launcher = root.querySelector("#xwAiLauncher");
//     const closeBtn = root.querySelector("#xwAiClose");
//     const form = root.querySelector("#xwAiForm");
//     const input = root.querySelector("#xwAiInput");
//     const sendBtn = root.querySelector("#xwAiSend");
//     const messages = root.querySelector("#xwAiMessages");
//     const fullLink = root.querySelector("#xwAiFullLink");
//
//     fullLink.href = new URL("ai.html", window.location.href).href;
//
//     function toggleWindow(open) {
//         windowEl.classList.toggle("is-open", open);
//         launcher.setAttribute("aria-expanded", String(open));
//         if (open) input.focus();
//     }
//
//     function addMessage(text, role) {
//         const message = document.createElement("div");
//         message.className = `xw-ai-message ${role}`;
//         message.textContent = text;
//         messages.appendChild(message);
//         messages.scrollTop = messages.scrollHeight;
//         return message;
//     }
//
//     launcher.addEventListener("click", () => {
//         toggleWindow(!windowEl.classList.contains("is-open"));
//     });
//
//     closeBtn.addEventListener("click", () => toggleWindow(false));
//
//     root.querySelectorAll("[data-question]").forEach(button => {
//         button.addEventListener("click", () => {
//             input.value = button.dataset.question;
//             form.requestSubmit();
//         });
//     });
//
//     // ... existing code ...
//     async function sendQuestion(question) {
//         addMessage(question, "user");
//
//         const waiting = addMessage("正在思考，请稍候……", "bot");
//         sendBtn.disabled = true;
//         input.disabled = true;
//
//         try {
//             const response = await fetch("http://localhost:3000/api/ai/chat", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ message: question })
//             });
//
//             const data = await response.json().catch(() => ({}));
//
//             if (!response.ok) {
//                 throw new Error(data.message || `请求失败（${response.status}）`);
//             }
//
//             waiting.textContent = data.answer || "暂时没有收到回答，请稍后重试。";
//         } catch (error) {
//             waiting.textContent =
//                 "暂时无法连接 AI 服务。请确认后端已启动，并检查 AI 接口配置。\n" +
//                 "详细信息：" + error.message;
//         } finally {
//             sendBtn.disabled = false;
//             input.disabled = false;
//             input.focus();
//             messages.scrollTop = messages.scrollHeight;
//         }
//     }
// // ... existing code ...
//
//     form.addEventListener("submit", event => {
//         event.preventDefault();
//         const question = input.value.trim();
//         if (!question || sendBtn.disabled) return;
//
//         input.value = "";
//         sendQuestion(question);
//     });
// })();