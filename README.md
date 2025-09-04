# AI CLI Tool

เครื่องมือ命令行สำหรับทำงานกับ AI โดยใช้ OpenAI API

## คุณสมบัติ

- สนทนากับ AI (`chat` command)
- แก้ไขเนื้อหาด้วย AI (`edit` command)

## การติดตั้ง

1. ติดตั้ง [Bun](https://bun.sh/)
2. ติดตั้ง dependencies:
```bash
bun install
```
3. สร้างไฟล์ `.env` และกำหนดค่า OPENAI_API_KEY:
```env
OPENAI_API_KEY=your_api_key_here
```

## การใช้งาน

### คำสั่งสนทนา (chat)
```bash
bun run chat "ข้อความของคุณ"
```

### คำสั่งแก้ไข (edit)
```bash
bun run edit "ข้อความที่ต้องการแก้ไข"
```

## การพัฒนา

โครงสร้างโปรเจค:
```
src/
  commands/
    chat.ts    # ฟังก์ชันการสนทนากับ AI
    edit.ts    # ฟังก์ชันการแก้ไขด้วย AI
  utils/
    useOpenAI.ts # ตัวช่วยสำหรับทำงานกับ OpenAI API
```

## ข้อกำหนด

- Node.js 18+
- Bun
- OpenAI API Key