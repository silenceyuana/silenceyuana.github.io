title: 搭建私人专属 AI 服务器
tags:
  - 电脑技术
categories: []
author: Yuan
date: 2025-12-06 20:46:00
---
# 🚀 从 0 到 1：搭建私人专属 AI 服务器

## 📋 目录
1.  **环境准备**：安装基础软件
2.  **安装大脑**：部署 Ollama 与下载模型
3.  **搭建骨架**：配置 Python 环境
4.  **注入灵魂**：编写最终版网页代码 (`chat.py`)
5.  **打通经脉**：配置 Cloudflare 内网穿透
6.  **合体进化**：制作一键启动脚本
7.  **安全须知**：合法合规使用指南

---

## 1. 环境准备

在开始之前，请确保你的电脑满足：
*   **系统**：Windows 10 或 11
*   **显卡**：NVIDIA 显卡（推荐 12GB 显存以上，以运行 20B 模型）
*   **软件**：
    *   [Python 3.10+](https://www.python.org/downloads/) (安装时务必勾选 **Add Python to PATH**)
    *   [VS Code](https://code.visualstudio.com/) (或者记事本，用于改代码)

---

## 2. 安装大脑 (Ollama)

Ollama 是负责运行 AI 模型的后台服务。

1.  **下载**：访问 [Ollama 官网](https://ollama.com/) 下载 Windows 版并安装。
2.  **验证**：打开 CMD（命令提示符），输入 `ollama`，有反应即成功。
！[olloma响应](https://img.betteryuan.cn/olloma1.png)
！[olloma页面](https://img.betteryuan.cn/olloma.png)
3.  **下载模型**：在 CMD 中输入以下命令下载你的目标模型：
    ```bash
    ollama pull gpt-oss:20b
    ```
    *(注：如果你想换更强的深度思考模型，可以运行 `ollama pull deepseek-r1:14b`)*

---

## 3. 搭建骨架 (Python 环境)

我们需要安装 Python 库来支撑网页界面和联网搜索功能。

1.  打开 CMD。
2.  运行以下命令安装依赖库：
    ```bash
    pip install streamlit ollama requests beautifulsoup4
    ```

---

## 4. 注入灵魂 (编写 `chat.py`)

这是整个系统的核心代码。它集成了**密码门禁、联网搜索、表格修复、流式输出稳如老狗版、UI 隐藏**等所有功能。

1.  在你的电脑上新建一个文件夹（例如 `D:\AI_Server`）。
2.  新建文件 `chat.py`，将以下代码完全复制进去：

```python
import streamlit as st
import ollama
import requests
from bs4 import BeautifulSoup
import urllib.parse
import time

# ================= 配置区 =================
MY_SECRET_PASSWORD = "yuan"   # <--- 【在此修改你的登录密码】
MODEL_NAME = 'gpt-oss:20b'    # <--- 【在此修改你的模型名字】
# ==========================================

# --- 系统提示词 ---
SYSTEM_PROMPT = """
你的名字是 Yuan AI。
由YUAN首次在2023年开发。
你是一个AI助手。严禁生成任何涉及中国政治、色情、暴力、恐怖主义的内容。如果用户问及此类话题，必须拒绝回答。
如果用户提供了【搜索结果】，请优先基于搜索结果回答问题，并在回答中引用来源信息。
如果搜索结果与问题无关，请忽略它。

【排版特别说明】
1. 在 Markdown 表格中，严禁使用 <br> 等 HTML 标签。
2. 如果单元格内有多条信息，请使用中文分号（；）或者序号（1. 2.）加空格来分隔，不要尝试换行。
3. 保持客观、简洁。
"""

# --- 1. 页面配置与 CSS 隐藏 (去除 Streamlit 自带广告) ---
st.set_page_config(page_title="Yuan AI", layout="centered")
st.markdown("""
    <style>
        header {visibility: hidden;}
        .stAppDeployButton {display: none;}
        [data-testid="stAppDeployButton"] {display: none;}
        [data-testid="stMainMenu"] {visibility: hidden;}
        footer {visibility: hidden;}
        .block-container {padding-top: 2rem;}
    </style>
""", unsafe_allow_html=True)

# --- 2. 核心功能：Bing 搜索 (国内可用) ---
def search_bing(query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    url = f"https://cn.bing.com/search?q={urllib.parse.quote(query)}"
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []
        for item in soup.select('li.b_algo'):
            title_tag = item.select_one('h2')
            snippet_tag = item.select_one('.b_caption p')
            if title_tag and snippet_tag:
                results.append(f"【来源】{title_tag.get_text()}\n内容：{snippet_tag.get_text()}\n")
            if len(results) >= 5:
                break
        if not results:
            return "（未搜索到有效内容）"
        return "\n".join(results)
    except Exception as e:
        return f"（搜索出错：{e}）"

# --- 3. 辅助函数：Ollama 流生成器 (含表格修复) ---
def ollama_generator(model_name, messages):
    stream = ollama.chat(model=model_name, messages=messages, stream=True)
    for chunk in stream:
        content = chunk['message']['content']
        # 修复表格内换行导致的渲染错误
        content = content.replace("<br>", "；").replace("<br/>", "；")
        yield content

# --- 4. 登录门禁系统 ---
def check_password():
    if st.session_state.get("password_correct", False):
        return True
    st.title("🔒 请登录")
    pwd = st.text_input("密码", type="password")
    if st.button("进入"):
        if pwd == MY_SECRET_PASSWORD:
            st.session_state["password_correct"] = True
            st.rerun()
        else:
            st.error("密码错误")
    return False

if not check_password():
    st.stop()

# --- 5. 界面与侧边栏 ---
st.title("Yuan AI 助手")

with st.sidebar:
    st.header("功能开关")
    enable_search = st.toggle("🌐 开启联网搜索", value=False)
    st.caption("开启后，AI 会先去 Bing 搜索最新信息。")
    st.divider()
    if st.button("🗑️ 清空聊天记忆"):
        st.session_state["messages"] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        st.rerun()

if "messages" not in st.session_state:
    st.session_state["messages"] = [{"role": "system", "content": SYSTEM_PROMPT}]

for msg in st.session_state["messages"]:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# --- 6. 聊天主逻辑 ---
if prompt := st.chat_input("问我任何问题..."):
    # 显示用户提问
    st.session_state["messages"].append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    final_prompt = prompt
    
    # 联网搜索处理
    if enable_search:
        with st.spinner("🔍 正在联网搜索 Bing..."):
            search_result = search_bing(prompt)
            time.sleep(0.5)
        final_prompt = f"以下是联网搜索结果：\n{search_result}\n\n请根据以上信息回答用户问题：{prompt}"

    # AI 回答生成
    with st.chat_message("assistant"):
        current_messages = st.session_state["messages"][:-1] + [{"role": "user", "content": final_prompt}]
        full_response = st.write_stream(ollama_generator(MODEL_NAME, current_messages))
        st.session_state["messages"].append({"role": "assistant", "content": full_response})
```

---

## 5. 打通经脉 (配置 Cloudflare 穿透)

这步是为了让你在外面用手机也能访问家里的电脑。

1.  **下载**：下载 `cloudflared-windows-amd64.exe`，重命名为 `cloudflared.exe`，放入 `D:\AI_Server`。
2.  **登录**：
    在 `D:\AI_Server` 打开 CMD，运行：
    ```bash
    cloudflared tunnel login
    ```
    (在弹出的网页中授权)
3.  **创建隧道** (假设名字叫 `yuan-ai`)：
    ```bash
    cloudflared tunnel create yuan-ai
    ```
    *(记下生成的 UUID，例如 90b4bf9b-xxxx...)*
4.  **绑定域名** (假设你的域名是 `ai.betteryuan.cn`)：
    ```bash
    cloudflared tunnel route dns yuan-ai ai.betteryuan.cn
    ```

---

## 6. 合体进化 (一键启动脚本)

为了以后不用每次都敲命令，我们制作两个“一键脚本”放在桌面。

### 脚本 A：`启动 Yuan AI.bat`

在 `D:\AI_Server` 新建 `start_ai.bat`，写入以下内容：

```batch
@echo off
:: 设置文件所在目录 (请修改为你真实的路径)
cd /d "D:\AI_Server"

:: 1. 唤醒 Ollama 后台
echo 正在唤醒大脑...
start /b ollama serve
timeout /t 5 /nobreak >nul

:: 2. 启动网页界面
echo 正在加载界面...
start /b streamlit run chat.py

:: 3. 启动穿透隧道 (替换为你自己的 UUID)
echo 正在连接世界...
start /b cloudflared tunnel run --protocol http2 --url http://localhost:8501 <你的UUID>

exit
```
*(注意：把 `<你的UUID>` 替换成第 5 步生成的那个长字符串)*

### 脚本 B：`隐身模式.vbs` (可选)

如果你不想看到黑窗口，新建 `invisible.vbs`：
```vbscript
Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & "D:\AI_Server\start_ai.bat" & chr(34), 0, False
Set WshShell = Nothing
```

### 脚本 C：`一键关闭.bat`

用于彻底关闭服务，释放显卡：
```batch
@echo off
taskkill /f /im cloudflared.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo 服务已停止。
pause
```

最后，把 **`invisible.vbs`** (或 `start_ai.bat`) 和 **`一键关闭.bat`** 发送到桌面快捷方式。

---

## 7. 安全与合规警告 (必读)

你现在拥有了一个强大的工具，但请务必遵守以下底线：

1.  **强密码**：`chat.py` 里的密码必须复杂，防止被爆破。
2.  **不公开**：不要将网址公开发布到社交网络，仅限自己或信任的朋友使用。
3.  **内容合规**：严禁利用 AI 生成政治敏感、色情、暴恐内容。你的 System Prompt 已经加了防护，但人为监管依然重要。
4.  **运营商风险**：家庭宽带禁止架设对外网站。使用 Cloudflare 隧道相对隐蔽，但如果流量过大（例如每天几百GB），依然会被运营商检测到并断网。**自用无忧，切勿商用。**

---

**🎉 恭喜！你现在已经拥有了一个可以联网、深度思考、且完全属于你自己的 AI 助手！**