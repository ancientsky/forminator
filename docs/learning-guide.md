# Forminator 開發學習指南

> 從「表單終結者」的開發實戰中，學到的技術選型、踩坑紀錄與工程思維。
> 適合剛接觸前端開發或第一次碰 Word 文件自動化的人閱讀。

---

## 目錄

0. [技術全景：這個專案用了什麼？](#0-技術全景這個專案用了什麼)
1. [Office Open XML 操作](#1-office-open-xml-操作)
2. [Template-based 文件生成](#2-template-based-文件生成)
3. [LLM API 整合](#3-llm-api-整合)
4. [React Hook Form 多步驟表單](#4-react-hook-form-多步驟表單)
5. [日期處理：民國年與西元年](#5-日期處理民國年與西元年)
6. [自動化工作流程設計](#6-自動化工作流程設計)

---

## 0. 技術全景：這個專案用了什麼？

### 一句話說明

Forminator 是一個**跑在瀏覽器裡的表單應用**，使用者填完表單後，它會在瀏覽器端直接產生 Word 文件打包下載。後端只負責呼叫 AI 做翻譯和摘要。

### 技術堆疊總覽

```
┌─────────────────────────────────────────────────┐
│  瀏覽器（前端）                                    │
│                                                   │
│  React ──── 畫面元件                               │
│  TypeScript ── 型別安全的 JavaScript               │
│  Vite ────── 開發伺服器 & 打包工具                  │
│  Ant Design ─ UI 元件庫（按鈕、表格、日期選擇器等）  │
│  React Hook Form ── 表單資料管理                    │
│  docxtemplater ──── 在 Word 模板裡填入資料          │
│  JSZip + file-saver ── 打包成 ZIP 並下載           │
│  dayjs ──── 日期處理                               │
│                                                   │
├─────────────────────────────────────────────────┤
│  伺服器（後端）                                    │
│                                                   │
│  Vercel Serverless Functions ── 部署在雲端          │
│  Express（備用）── 本地開發用                       │
│  GROQ API（qwen3-32b）── AI 翻譯 & 摘要生成       │
│                                                   │
├─────────────────────────────────────────────────┤
│  開發工具                                          │
│                                                   │
│  Node.js 腳本 ── 在 Word 模板 XML 裡注入佔位符     │
│  Python（輔助）── 分析 .docx 內部 XML 結構          │
│  Git + GitHub ── 版本控制                          │
└─────────────────────────────────────────────────┘
```

### 每個技術詳細介紹

---

#### 🔹 React — 畫面元件框架

**它是什麼？**
React 是 Facebook（現 Meta）開發的 JavaScript UI 框架。核心概念是把畫面拆成一個個**元件（Component）**，每個元件管理自己的狀態（state）和外觀。

**用白話講：** 想像一個樂高模型，每塊樂高就是一個元件。你可以把「日期選擇器」做成一塊，「人員卡片」做成一塊，最後組合起來就是完整的頁面。

**在 Forminator 裡怎麼用？**
```
src/components/
├── wizard/
│   ├── Step1BasicInfo.tsx    ← 步驟一：基本資料（一個元件）
│   ├── Step2Personnel.tsx    ← 步驟二：人員配置（一個元件）
│   ├── Step3Content.tsx      ← 步驟三：研究內容
│   ├── Step4Dates.tsx        ← 步驟四：期程
│   └── Step5Review.tsx       ← 步驟五：預覽
├── FormWizard.tsx            ← 組合以上元件的「外框」
```

每個 Step 元件長這樣：
```tsx
// Step1BasicInfo.tsx（簡化版）
function Step1BasicInfo() {
  // 從共用的表單拿資料
  const { control } = useFormContext();

  return (
    <Form layout="vertical">
      {/* Controller 把 Ant Design 的 Input 接上 React Hook Form */}
      <Controller
        name="project_title_zh"
        control={control}
        render={({ field }) => (
          <Form.Item label="計畫名稱（中文）">
            <Input {...field} />
          </Form.Item>
        )}
      />
    </Form>
  );
}
```

**新手要懂的三個核心概念：**
1. **JSX** — 在 JavaScript 裡寫 HTML（`<div>` 不是字串，是 JSX 語法）
2. **State** — 元件的「記憶」。state 變了，畫面自動更新
3. **Props** — 父元件傳給子元件的參數（像函式的引數）

**學習路線：** [React 官方教學](https://react.dev/learn) → 跑完 Tic-Tac-Toe 教學 → 回來看 Forminator 的 Step 元件

---

#### 🔹 TypeScript — 型別安全的 JavaScript

**它是什麼？**
TypeScript 是 JavaScript 加上**型別標註**。你告訴程式「這個變數是字串」「這個函式回傳數字」，編譯器就會在你寫錯時提醒你。

**用白話講：** JavaScript 是隨便寫都能跑的便利貼，TypeScript 是有格子的筆記本——多了一點限制，但不容易寫歪。

**在 Forminator 裡怎麼用？**
```ts
// src/types/form.ts — 定義表單資料的「形狀」
interface Personnel {
  name_zh: string;     // 中文姓名，一定是字串
  name_en: string;     // 英文姓名
  title: string;       // 職稱
  phone: string;
  fax: string;
  email: string;
  address: string;
  role: 'pi' | 'co_pi' | 'researcher' | 'assistant';
  // ↑ role 只能是這四個值之一，寫錯會報錯
}
```

有了這個定義，你在任何地方用 `Personnel` 的時候，IDE 會自動提示有哪些欄位、是什麼型別。打錯字（例如 `pesronnel.nmae`）會立刻紅線提醒。

**新手只要會這些：**
- `string`、`number`、`boolean` — 基本型別
- `interface` — 定義物件的形狀
- `Type[]` — 陣列（例如 `string[]` 是字串陣列）
- `'a' | 'b'` — 聯合型別（只能是 a 或 b）

**學習路線：** 不用特別學，邊看 Forminator 程式碼邊查就好。看不懂的型別 → 按住 Ctrl 點進去看定義

---

#### 🔹 Vite — 開發伺服器與打包工具

**它是什麼？**
Vite（法文「快」的意思）是前端開發工具，做兩件事：
1. **開發時** — 啟動一個本地伺服器，你改了程式碼瀏覽器立刻更新（HMR, Hot Module Replacement）
2. **上線時** — 把所有 `.tsx`、`.ts`、`.css` 檔案打包壓縮成幾個小檔案放到 `dist/` 資料夾

**新手需要知道的：**
- `npm run dev` → Vite 開發伺服器跑在 `http://localhost:5173`
- `npm run build` → 打包到 `dist/` 資料夾
- 設定檔是 `vite.config.ts`，通常不用改

就這樣。Vite 的設計哲學就是「你不需要知道它怎麼運作」。

---

#### 🔹 Ant Design — UI 元件庫

**它是什麼？**
螞蟻金服開發的 React 元件庫。提供現成的按鈕、輸入框、表格、日期選擇器、步驟條等 UI 元件，不用自己從零寫 CSS。

**用白話講：** 像 IKEA 的家具——買回來組裝就好，不用自己做木工。

**在 Forminator 裡用到的元件：**
```tsx
import {
  Button,        // 按鈕
  Input,         // 輸入框
  Select,        // 下拉選單
  DatePicker,    // 日期選擇器（內建民國年顯示）
  Steps,         // 步驟條（上方的 1→2→3→4→5）
  Card,          // 卡片容器
  Form,          // 表單排版（label + input 的排列）
  Space,         // 間距
  message,       // 頂部提示訊息（例如「生成成功！」）
} from 'antd';
```

**怎麼用：** 到 [Ant Design 元件文件](https://ant.design/components/overview-cn/) 搜尋你需要的元件 → 看範例 → 複製貼上 → 改 props。就這麼簡單。

**中文化：** Forminator 在入口處設定了 `<ConfigProvider locale={zhTW}>`，所以日期選擇器、分頁等元件自動顯示中文。

---

#### 🔹 React Hook Form — 表單狀態管理

**它是什麼？**
專門管理表單資料的函式庫。它記住每個欄位的值、處理驗證、追蹤哪些欄位被改過。

**為什麼不用 `useState`？** 如果用 `useState` 管 30 個欄位，每打一個字整個頁面都會重新渲染。React Hook Form 用 ref 追蹤值，只有需要的元件才更新。

**在 Forminator 裡的架構：**
```
useFormStore.ts
├── useForm({ defaultValues })  ← 建立表單實例
├── FormProvider               ← 透過 Context 傳給所有子元件
│
├── Step1 → useFormContext()   ← 每個步驟都能拿到同一份表單
├── Step2 → useFormContext()
├── Step3 → useFormContext()
├── ...
```

**新手要懂的三個 API：**
1. **`Controller`** — 把第三方元件（如 Ant Design 的 Input）接上 RHF
2. **`watch('fieldName')`** — 監聽某欄位的值（值變了會觸發重新渲染）
3. **`useFieldArray`** — 管理動態陣列（像「新增研究人員」按鈕）

**學習路線：** [React Hook Form 入門](https://react-hook-form.com/get-started) → 看 `useFormStore.ts` → 看任一 Step 元件

---

#### 🔹 docxtemplater — Word 模板填充

**它是什麼？**
一個 JavaScript 函式庫，讀入 `.docx` 模板，把 `{placeholder}` 替換成實際資料，輸出新的 `.docx`。

**在 Forminator 裡的流程：**
```
1. 讀取模板 → fetch('/templates/DOC-4.docx')
2. 解壓 ZIP → new PizZip(data)
3. 建立引擎 → new Docxtemplater(zip)
4. 填入資料 → doc.render({ pi_name_zh: '王小明', ... })
5. 輸出檔案 → doc.getZip().generate({ type: 'blob' })
```

對應的程式碼在 `src/utils/docgen.ts`：
```ts
const response = await fetch(`/templates/${template.file}`);
const data = await response.arrayBuffer();
const zip = new PizZip(data);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});
doc.render(templateData);
```

**詳細說明見 [第 2 章](#2-template-based-文件生成)**

---

#### 🔹 JSZip + file-saver — 打包下載

**它是什麼？**
- **JSZip** — 在瀏覽器裡建立 ZIP 檔案
- **file-saver** — 觸發瀏覽器的「下載檔案」對話框

**在 Forminator 裡：**
```ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const zip = new JSZip();
// 把 7 份 .docx 加進 ZIP
zip.file('DOC-1_研究計畫書.docx', doc1Blob);
zip.file('DOC-2_免審申請表.docx', doc2Blob);
// ...
const zipBlob = await zip.generateAsync({ type: 'blob' });
saveAs(zipBlob, '疾管署研究計畫_王小明.zip');
```

就這麼幾行，使用者點「下載」就能拿到完整的 ZIP。

---

#### 🔹 dayjs — 日期處理

**它是什麼？**
輕量的日期處理函式庫（只有 2KB），API 跟 moment.js 幾乎一樣但小很多。

**為什麼用它：** Ant Design 的 DatePicker 底層需要 dayjs。Forminator 用它來處理日期選擇器的值。

```ts
import dayjs from 'dayjs';
const today = dayjs();                    // 現在
const formatted = today.format('YYYY-MM-DD'); // '2026-03-25'
const rocYear = today.year() - 1911;      // 115（民國年）
```

---

#### 🔹 Vercel — 雲端部署平台

**它是什麼？**
Vercel 是一個前端部署平台。你把程式碼 push 到 GitHub，Vercel 自動幫你打包和部署。它也支援 **Serverless Functions** — 不用管伺服器，寫個函式就能當 API 用。

**在 Forminator 裡：**
- 前端（React app）→ 自動部署到 Vercel CDN
- 後端（LLM API proxy）→ `api/llm/translate-title.js` 和 `api/llm/generate-abstract.js` 是 Vercel Serverless Functions

**Serverless Function 長什麼樣？**
```js
// api/llm/translate-title.js
export default async function handler(req, res) {
  const { project_title_zh } = req.body;
  // 呼叫 GROQ API...
  res.json({ project_title_en: '...' });
}
```

放在 `api/` 資料夾下的 `.js` 檔案，Vercel 自動把它變成一個 API endpoint。檔案路徑 = URL 路徑：`api/llm/translate-title.js` → `https://your-app.vercel.app/api/llm/translate-title`

---

#### 🔹 Express — Node.js Web 框架

**它是什麼？**
最經典的 Node.js Web 框架，用來建立 HTTP 伺服器。在 Forminator 裡是本地開發 / Railway 部署時的備用方案。

**跟 Vercel 的關係：**
- 部署在 Vercel → 用 Serverless Functions（`api/` 資料夾）
- 本地開發或部署在 Railway → 用 Express（`server.js`）
- 兩邊的 API 邏輯一樣，只是「包裝」不同

---

#### 🔹 GROQ API — AI 推論平台

**它是什麼？**
GROQ 是一個 LLM 推論平台，提供 OpenAI 相容的 API 格式。Forminator 用它來跑 `qwen/qwen3-32b` 模型，做計畫名稱英文翻譯和摘要生成。

**為什麼不直接用 OpenAI？** GROQ 的免費額度比較高，適合 MVP 階段。而且 API 格式相容，之後要換 OpenAI 只需要改 URL 和 key。

**詳細說明見 [第 3 章](#3-llm-api-整合)**

---

#### 🔹 Node.js — 伺服器端 JavaScript

**它是什麼？**
讓你在瀏覽器以外的地方跑 JavaScript。在 Forminator 裡，`scripts/inject-placeholders.cjs` 是一個 Node.js 腳本，用來在 Word 模板的 XML 裡注入佔位符。

**為什麼用 Node.js 而不是 Python？** 因為前端已經用 JavaScript/TypeScript 了，用同一個語言寫腳本可以共用知識，不用切換語言。

---

#### 🔹 Python — 輔助分析工具

**它是什麼？**
在 Forminator 裡，Python 只用來做 **一次性的分析工作** — 把 `.docx` 解壓後 dump 出 XML 內容，方便觀察表格結構、文字順序等。

```python
import zipfile, re
with zipfile.ZipFile('DOC-4.docx') as z:
    xml = z.read('word/document.xml').decode('utf-8')
    # 找出所有文字節點
    for i, m in enumerate(re.finditer(r'<w:t[^>]*>([^<]+)</w:t>', xml)):
        print(f'{i}: {m.group(1)}')
```

不是專案核心技術，不會就跳過沒關係。

---

#### 🔹 Git — 版本控制

**它是什麼？**
追蹤檔案的每一次修改。可以隨時回到過去的版本、多人協作不打架。

**新手只需要這幾個指令：**
```bash
git status              # 看哪些檔案被改了
git add 檔案名稱         # 把修改加入「待提交」
git commit -m "訊息"    # 提交修改
git push                # 推到 GitHub
git log --oneline -10   # 看最近 10 次提交
```

**學習路線：** [Git 入門教學（中文）](https://gitbook.tw/)

### 新手 FAQ

**Q: 我需要全部學完才能改這個專案嗎？**
A: 不用。看你要改什麼：
- 改表單欄位 → 只需要懂 React + Ant Design + React Hook Form
- 改文件生成 → 只需要懂 docxtemplater + `docgen.ts`
- 改模板注入 → 只需要懂 Node.js + XML 基礎
- 改 AI 功能 → 只需要懂 `fetch` API + JSON

**Q: 為什麼文件生成不在後端做？**
A: 因為不需要。docxtemplater 跑在瀏覽器裡就好，省掉伺服器成本，也不用處理檔案上傳下載。使用者的資料完全不離開瀏覽器（除了 AI 翻譯/摘要功能）。

**Q: 為什麼不用 Google Docs API 或 Microsoft Graph？**
A: CDC 的表單必須是特定格式的 `.docx`，用 API 反而要處理格式轉換。直接操作 Word 模板最保險。

**Q: 專案怎麼跑起來？**
```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器（前端）
npm run dev
# → 瀏覽器開 http://localhost:5173

# 3.（選用）如果要用 AI 功能，設定環境變數
export GROQ_API_KEY=your-key-here
npm start
# → 後端跑在 http://localhost:3000
```

### 延伸閱讀（新手起步路線）

如果你是完全的新手，建議按這個順序學習：

1. **JavaScript 基礎** → [MDN JavaScript Guide](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide)
2. **React 入門** → [React 官方教學](https://react.dev/learn)
3. **TypeScript 基礎** → [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
4. **Ant Design 元件** → [Ant Design 文件](https://ant.design/components/overview-cn/)
5. **React Hook Form** → [官方入門](https://react-hook-form.com/get-started)
6. **docxtemplater** → [官方 Demo](https://docxtemplater.com/demo/)

---

## 1. Office Open XML 操作

### 這是什麼？

`.docx` 不是一個二進位檔案，它其實是一個 **ZIP 壓縮包**，裡面裝了一堆 XML 檔案。核心內容在 `word/document.xml`。

```
my-doc.docx (ZIP)
├── [Content_Types].xml
├── _rels/.rels
├── word/
│   ├── document.xml    ← 主要內容在這
│   ├── styles.xml      ← 樣式定義
│   ├── numbering.xml   ← 編號/項目符號
│   └── ...
```

### 新手思維 vs 老手思維

| 新手 | 老手 |
|------|------|
| 「用程式從零生成 Word 文件」 | 「用原始 Word 模板，只替換需要的部分」 |
| 「直接字串替換就好了」 | 「Word 會把一個詞拆成多個 XML 節點，要考慮 run splitting」 |
| 「格式用程式設定」 | 「格式讓 Word 保留，我只管內容」 |

### 常見的坑

#### 坑 1：Word 的 Run Splitting

你在 Word 裡看到的「計畫主持人」，在 XML 裡可能變成：

```xml
<w:r><w:t>計畫</w:t></w:r>
<w:r><w:t>主持人</w:t></w:r>
```

甚至更碎：

```xml
<w:r><w:t>計</w:t></w:r>
<w:r><w:t>畫</w:t></w:r>
<w:r><w:t>主</w:t></w:r>
<w:r><w:t>持</w:t></w:r>
<w:r><w:t>人</w:t></w:r>
```

**為什麼？** Word 在編輯過程中會記錄每次修改的歷史（revision tracking），不同時間點輸入的文字會被分成不同的 `<w:r>`（run）。

**解法：** 不要假設文字一定在同一個 run 裡。本專案的做法是：
- 用全形空白 `○○○` 或 `OOO` 作為佔位符號，這些是一次性輸入的，通常不會被拆開
- 如果標籤被拆開（如「電話」→「電」+「話」），用最後一個字作為 anchor

#### 坑 2：表格 cell 中標籤與值的關係

Word 表格中，「標籤」和「值」可能在：
- **同一個 cell**（標籤後面接值）
- **不同 cell**（左 cell 是標籤，右 cell 是值）

你必須先分析 XML 結構才知道 placeholder 該放哪裡。本專案用 Python 腳本分析：

```python
import zipfile, re
with zipfile.ZipFile('template.docx') as z:
    xml = z.read('word/document.xml').decode('utf-8')
    texts = re.findall(r'<w:t[^>]*>([^<]+)</w:t>', xml)
    for i, t in enumerate(texts):
        print(f'{i}: {t}')
```

#### 坑 3：`>OO<` 的替換順序

用 regex 的 `replace` 搭配 counter 來依序替換時，**必須確認模板中佔位符的實際出現順序**。本專案的執行期限就因為假設錯順序而導致「全程計畫」顯示月份=24、日期=31 的 bug。

**教訓：永遠先 dump 出 XML 裡的實際順序，再寫替換邏輯。**

### 延伸思考

- 為什麼不用 `docx-js` 從零生成？→ 因為官方模板有複雜的表格合併、底線、特殊格式，程式重建不划算且容易走樣。
- 如果模板更新了怎麼辦？→ 重新跑 `inject-placeholders.cjs`，但需要驗證 XML 結構是否改變。

### 延伸閱讀

- [ECMA-376 Office Open XML 規範](http://www.ecma-international.org/publications-and-standards/standards/ecma-376/)
- [Understanding Word XML](https://docs.microsoft.com/en-us/office/open-xml/understanding-the-open-xml-file-formats)
- [PizZip GitHub](https://github.com/nicolomaioli/pizzip) — 本專案用來讀寫 ZIP

---

## 2. Template-based 文件生成

### 這是什麼？

[docxtemplater](https://docxtemplater.com/) 是一個在 `.docx` 模板中填入資料的函式庫，語法類似 Mustache：
- `{variable}` — 簡單替換
- `{#loop}...{/loop}` — 迴圈（複製表格行、段落等）
- `{%condition}...{/condition}` — 條件

### 新手思維 vs 老手思維

| 新手 | 老手 |
|------|------|
| 「把所有資料都塞進一個大 JSON」 | 「分層準備：common data → per-doc overrides → per-person data」 |
| 「loop 放在段落裡就好」 | 「loop tag 的位置決定了複製的單位：放在 cell 裡複製 cell，放在 row 裡複製 row」 |
| 「直接 `doc.render(data)`」 | 「先確認 template 裡所有 placeholder 都有對應的 data key，否則 docxtemplater 會 throw」 |

### 常見的坑

#### 坑 1：Loop 的作用範圍

```
{#items}
  {name} — {price}
{/items}
```

如果 `{#items}` 和 `{/items}` 在同一個表格行（`<w:tr>`）的不同 cell 中，docxtemplater 會**複製整個表格行**。如果跨了行，行為就不可預期。

**原則：loop 的開始和結束 tag 必須在同一個結構單位內。**

#### 坑 2：Delimiter 衝突

預設 delimiter 是 `{` `}`，但 Word 裡如果有 JSON 範例或大括號文字，會被誤判為 placeholder。本專案的模板原本就用 `{` `}` 作為佔位符格式，所以剛好不衝突。如果遇到衝突，可以改用：

```js
const doc = new Docxtemplater(zip, {
  delimiters: { start: '<<', end: '>>' },
});
```

### 延伸思考

- docxtemplater 的 loop 不支援巢狀表格（nested tables），如果需要，考慮用 [docxtemplater subtemplate module](https://docxtemplater.com/modules/)（付費）。
- 想在 Word 裡畫出核取方塊（☐ / ☑）？直接用 Unicode 字元 `□`（U+25A1）和 `■`（U+25A0）最簡單。

### 延伸閱讀

- [docxtemplater 官方文件](https://docxtemplater.com/docs/)
- [docxtemplater loops 說明](https://docxtemplater.com/docs/tag-types/#loops)

---

## 3. LLM API 整合

### 這是什麼？

透過 GROQ API（OpenAI 相容格式）呼叫 LLM（qwen3-32b）來做：
1. 中文計畫名稱 → 英文翻譯
2. 研究內容 → 生成中英文摘要與關鍵詞

### 新手思維 vs 老手思維

| 新手 | 老手 |
|------|------|
| 「設 `response_format: json_object` 就保證拿到 JSON」 | 「不是所有模型都支援，要做 fallback」 |
| 「LLM 回傳的就是純內容」 | 「有些模型會加 thinking tags、markdown code blocks、前後綴文字」 |
| 「設 `max_tokens: 200` 翻譯夠了」 | 「thinking 模型的 token 包含思考過程，200 遠遠不夠」 |
| 「錯誤顯示『翻譯失敗』就好」 | 「要把 LLM 的原始回應帶回前端，否則無法 debug」 |

### 常見的坑

#### 坑 1：Thinking 模型的隱藏成本

qwen3 預設開啟 thinking mode，回應格式為：

```
<think>
好的，用户让我翻译...首先我需要确认...
</think>

{"project_title_en": "..."}
```

問題：
1. `<think>` 內容消耗 token → `max_tokens: 200` 可能在思考完之前就截斷
2. 截斷後 `<think>` 沒有 `</think>` 關閉 → regex `/<think>[\s\S]*?<\/think>/` 匹配不到
3. JSON 根本沒有被生成出來

**解法（三層防護）：**

```js
// 1. 給足 token（思考 + 回答）
max_tokens: 1024,

// 2. 清除已關閉和未關閉的 <think>
const cleaned = content
  .replace(/<think>[\s\S]*?<\/think>/g, '')  // 已關閉
  .replace(/<think>[\s\S]*/g, '')            // 未關閉（截斷）
  .trim();

// 3. 從清理後的文字中提取 JSON
const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
```

#### 坑 2：`response_format` 不是萬能的

`response_format: { type: 'json_object' }` 只有部分模型支援（OpenAI GPT-4o、部分 Groq 模型）。不支援的模型會直接回 HTTP 400。

**最穩健的做法：不依賴 `response_format`，用 prompt 引導 + regex 提取。**

#### 坑 3：錯誤訊息要有 debug 資訊

千萬不要只回 `{ error: '翻譯失敗' }`。在開發/除錯階段，把 LLM 的原始回應（截取前 500 字）放進 error response：

```js
return res.status(502).json({
  error: 'LLM 回應格式錯誤',
  debug: cleaned.substring(0, 500),
});
```

前端再把 `debug` 欄位顯示出來，一眼就能看出問題。

### 延伸思考

- 為什麼不直接在前端呼叫 GROQ API？→ API key 會暴露在瀏覽器。
- 為什麼用 GROQ 而不是 OpenAI？→ 免費 tier 額度較高，適合 MVP。
- 如果想關閉 qwen3 的 thinking，可以在 prompt 加 `/no_think`，但這會降低回答品質。

### 延伸閱讀

- [GROQ API 文件](https://console.groq.com/docs/api-reference)
- [OpenAI JSON Mode 說明](https://platform.openai.com/docs/guides/json-mode)
- [Qwen3 Thinking Mode](https://qwen.readthedocs.io/) — 理解 `<think>` 標籤的行為

---

## 4. React Hook Form 多步驟表單

### 這是什麼？

Forminator 用 React Hook Form（RHF）管理一個跨 5 個步驟的大型表單。所有步驟共用同一個 form instance，透過 Context 傳遞。

### 新手思維 vs 老手思維

| 新手 | 老手 |
|------|------|
| 「每個步驟一個 form，最後合併」 | 「一個 form instance 跨所有步驟，資料一致性有保障」 |
| 「用 `useState` 管理表單」 | 「RHF 的 `useForm` 自帶效能優化（不會每次 keystroke re-render）」 |
| 「驗證放在 submit」 | 「用 `rules` 做即時驗證，切步驟時也能檢查」 |

### 常見的坑

#### 坑 1：`useFieldArray` 的 key

動態新增/刪除人員時，`useFieldArray` 會自動管理 key。但如果你用 `index` 作為 React key 而不是 `field.id`，刪除中間項目後表單值會錯亂。

```tsx
// ✅ 正確
{fields.map((field, index) => (
  <Card key={field.id}>...</Card>
))}

// ❌ 錯誤
{fields.map((field, index) => (
  <Card key={index}>...</Card>
))}
```

#### 坑 2：`watch` vs `getValues`

- `watch('field')` — **響應式**，值變化時觸發 re-render
- `getValues('field')` — **非響應式**，只在呼叫時讀取當前值

在 `useEffect` 裡要用 `watch` 的回傳值作為 dependency，不要用 `getValues`。

### 延伸閱讀

- [React Hook Form 官方文件](https://react-hook-form.com/)
- [useFieldArray API](https://react-hook-form.com/docs/usefieldarray)

---

## 5. 日期處理：民國年與西元年

### 這是什麼？

台灣公文用民國紀年（ROC calendar）。民國年 = 西元年 - 1911。

### 常見的坑

#### 坑 1：月份 off-by-one

JavaScript 的 `Date.getMonth()` 是 **0-based**（0=一月、11=十二月）。

```js
// ❌ 錯誤
const month = date.getMonth();     // 一月 → 0

// ✅ 正確
const month = date.getMonth() + 1; // 一月 → 1
```

#### 坑 2：日期字串的時區

`new Date('2026-03-24')` 在不同時區可能是 3/23 或 3/24。如果你只需要日期部分，用 `split('-')` 手動解析比 `new Date()` 更安全。

### 延伸思考

- 為什麼不用 `dayjs`？→ 本專案有用（前端 DatePicker），但 docgen 裡為了減少依賴直接用原生 `Date`。
- 民國 113 年以後的跨年計畫，年份可能跨到 114、115，要確認所有日期欄位都正確轉換。

---

## 6. 自動化工作流程設計

### 這是什麼？

Forminator 的核心設計哲學是：**一次填寫，生成多份文件**。

### 新手思維 vs 老手思維

| 新手 | 老手 |
|------|------|
| 「每份文件獨立填寫」 | 「一個 FormData 對應所有文件，`prepareCommonData()` 統一轉換」 |
| 「模板寫死在程式裡」 | 「模板是獨立的 .docx 檔案，injection 腳本可以重跑」 |
| 「生成完直接下載」 | 「打包成 ZIP，檔名帶計畫名稱，方便歸檔」 |

### 架構決策紀錄

**為什麼從「程式生成模板」改成「原始模板 + placeholder 注入」？**

初版用 `docx-js` 從零生成 Word 文件，但遇到：
1. 表格格式（合併儲存格、框線樣式）難以精確重現
2. 字型、間距等微調需要大量嘗試
3. 每次官方模板更新，要重寫大量程式碼

改用原始模板後：
- 格式 100% 忠於官方
- 只需維護 placeholder 注入邏輯
- 更新模板只需重跑 `node scripts/inject-placeholders.cjs`

**為什麼甘特圖用 ■ 而不是底色填充？**

docxtemplater 只能填文字，不能改 cell 背景色。用 `■`（Unicode 全形方塊）是最簡單的視覺表示。如果需要底色，要用 docxtemplater 的付費 [styling module](https://docxtemplater.com/modules/styling/)。

**為什麼目錄頁碼用 PAGEREF 而不是寫死？**

頁碼取決於 Word 排版引擎（字型、邊距、內容長度），JavaScript 無法計算。插入 PAGEREF 欄位碼後，使用者打開 Word 按 `Ctrl+A → F9` 即可自動更新。

### 延伸思考

- 如果要支援多年期計畫，哪些地方需要改？→ 執行期限要拆成「本年度」和「全程」兩組不同值，甘特圖月份數要動態調整。
- 如果要支援有經費的計畫？→ 需要新增經費表格的 placeholder 注入，表單加上經費編列步驟。

### 延伸閱讀

- [docx-js（programmatic generation）](https://github.com/dolanmiu/docx) — 本專案早期使用，適合從零生成
- [JSZip](https://stuk.github.io/jszip/) — 前端 ZIP 打包
- [file-saver](https://github.com/nicolomaioli/FileSaver.js) — 觸發瀏覽器下載

---

## 總結：從這個專案學到的原則

1. **先理解結構再動手** — 分析 XML、dump 文字順序、確認 cell 邊界，比直接寫 regex 重要十倍
2. **不要假設 LLM 的輸出格式** — 永遠做清理、提取、驗證三步驟
3. **保留原始格式** — 用模板注入而非程式生成，維護成本低且格式保真
4. **錯誤訊息要具體** — 「翻譯失敗」不如「GROQ API 錯誤: 400」不如顯示實際回應內容
5. **增量式開發** — 先跑通最簡單的 placeholder，再逐步加入 loop、PAGEREF 等進階功能
