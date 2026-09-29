import { llmChat, llmHealth } from '../../lib/tauri';

const SYSTEM = `당신은 한국어 블로그 글쓰기를 돕는 편집 보조입니다. 요청에 대해 간결하고 정확하게 응답합니다.`;

export async function checkLlmAvailable(): Promise<boolean> {
  try {
    return await llmHealth();
  } catch {
    return false;
  }
}

export async function runSpellCheck(text: string): Promise<string> {
  return llmChat({
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `다음 한국어 텍스트의 맞춤법과 문체를 교정해주세요. 원문의 의미와 문체를 최대한 유지하면서 틀린 부분만 고쳐주세요. 교정된 전체 텍스트만 출력하세요.\n\n---\n${text}`,
      },
    ],
    temperature: 0.2,
  });
}

export async function continueWriting(text: string): Promise<string> {
  const context = text.slice(-1500);
  return llmChat({
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `다음 블로그 글의 마지막 부분 이후에 이어지는 단락을 한국어로 작성해주세요. 기존 글의 주제와 문체를 자연스럽게 이어가세요. 이어쓸 내용만 출력하세요 (앞의 내용은 포함하지 마세요).\n\n---\n${context}`,
      },
    ],
    temperature: 0.7,
  });
}

export async function improveText(selected: string, context: string): Promise<string> {
  return llmChat({
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `다음 텍스트를 더 명확하고 자연스러운 한국어로 개선해주세요.\n\n문맥:\n${context.slice(-600)}\n\n개선할 텍스트:\n${selected}\n\n개선된 텍스트만 출력하세요.`,
      },
    ],
    temperature: 0.5,
  });
}

export async function suggestReferences(text: string): Promise<string> {
  return llmChat({
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `다음 블로그 글의 주제를 분석하고, 독자에게 도움이 될 만한 참고 자료와 키워드를 제안해주세요. 공식 문서, 주요 개념, 관련 도구 등을 포함하세요. 마크다운 목록 형식으로 출력하세요.\n\n---\n${text.slice(0, 2000)}`,
      },
    ],
    temperature: 0.5,
  });
}

export async function suggestMeta(text: string): Promise<string> {
  return llmChat({
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `다음 블로그 글을 분석하고 아래 형식으로 메타 정보를 제안해주세요:\n\n제목: (50자 이내)\n설명: (150자 이내의 요약)\n태그: (쉼표로 구분, 5개 이하)\n\n---\n${text.slice(0, 2000)}`,
      },
    ],
    temperature: 0.3,
  });
}
