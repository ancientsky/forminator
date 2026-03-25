// ===== DOC-7 模板生成 =====
// 使用 docx-js 建立 .docx 檔案，內含 {placeholder} 標籤
// DOC-1~6 由 inject-placeholders.cjs 從原始 CDC 模板注入，不在此腳本處理

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType,
} = require('docx');

const OUT = path.join(__dirname, '..', 'public', 'templates');
fs.mkdirSync(OUT, { recursive: true });

// ===== 共用樣式 =====
const FONT = '標楷體';
const A4 = { width: 11906, height: 16838 }; // A4 in DXA

function t(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || 28, ...opts });
}

function p(children, opts = {}) {
  if (typeof children === 'string') children = [t(children)];
  return new Paragraph({ children, ...opts });
}

async function save(doc, filename) {
  const buffer = await Packer.toBuffer(doc);
  const fp = path.join(OUT, filename);
  fs.writeFileSync(fp, buffer);
  console.log(`✅ ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ========================================
// DOC-7: 研究計畫簽呈（公文）
// ========================================
async function genDOC7() {
  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 28 } } },
    },
    sections: [{
      properties: {
        page: { size: A4, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        // 標題
        p([t('簽', { bold: true, size: 36 })], { alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        // 主旨
        p([t('主旨：', { bold: true }), t('{responsible_unit}擬執行{project_year}年度無經費需求署內自行研究計畫一件，簽請鑒核。')], { spacing: { after: 300 } }),
        // 說明
        p([t('說明：', { bold: true })], { spacing: { after: 100 } }),
        p([t('本研究計畫名稱為「{project_title_zh}」，研究計畫書內容詳如附件。')], { indent: { left: 480 }, spacing: { after: 300 } }),
        // 擬辦
        p([t('擬辦：', { bold: true })], { spacing: { after: 100 } }),
        p([t('奉核後據以辦理相關後續事宜。')], { indent: { left: 480 } }),
      ],
    }],
  });
  await save(doc, 'DOC-7.docx');
}

// ========================================
// 主程式
// ========================================
async function main() {
  console.log('🏗️  Generating DOC-7 template...\n');
  await genDOC7();
  console.log('\n✅ DOC-7 generated in public/templates/');
  console.log('ℹ️  DOC-1~6 由 inject-placeholders.cjs 從原始 CDC 模板注入');
}

main().catch(console.error);
