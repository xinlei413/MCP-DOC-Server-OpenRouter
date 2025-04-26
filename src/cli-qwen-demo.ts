import { openrouterChat } from "./utils/openrouter";

async function main() {
  const input = process.argv[2] || "请总结这段文档：OpenRouter 支持多模型 AI 能力。";
  const result = await openrouterChat({
    model: "qwen/qwen2.5-vl-32b-instruct:free",
    messages: [
      { role: "user", content: input }
    ]
  });
  console.log("Qwen 回复：", result.choices?.[0]?.message?.content || JSON.stringify(result));
}

main().catch(e => {
  console.error("Qwen 调用失败：", e);
  process.exit(1);
});
