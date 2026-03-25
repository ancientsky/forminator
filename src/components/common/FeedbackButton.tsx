// ===== 意見回饋浮動按鈕 + Google Form 內嵌 Modal =====

import { useState } from 'react';
import { FloatButton, Modal } from 'antd';
import { CommentOutlined } from '@ant-design/icons';

// 替換成你的 Google Form 嵌入網址（「傳送」→「嵌入 HTML」→ 取 src 的 URL）
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdd8NQIo2oVTZRJnDWG8-9rHWaR7Z8WNn3d4xKiGY9pm8oVHg/viewform?embedded=true';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  if (!GOOGLE_FORM_URL) {
    return null;
  }

  return (
    <>
      <FloatButton
        icon={<CommentOutlined />}
        tooltip="意見回饋 / 問題通報"
        onClick={() => setOpen(true)}
        style={{ right: 24, bottom: 24 }}
      />
      <Modal
        title="意見回饋 / 問題通報"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={640}
        styles={{ body: { padding: 0, height: 520 } }}
        destroyOnClose
      >
        <iframe
          src={GOOGLE_FORM_URL}
          width="100%"
          height="520"
          style={{ border: 'none' }}
          title="意見回饋表單"
        />
      </Modal>
    </>
  );
}
