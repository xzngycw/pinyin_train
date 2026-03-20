import { questionBank, syllables } from '../data/pinyin';
import type {
  Difficulty,
  EvaluationResult,
  PracticeMode,
  PracticeQuestion,
  PracticeSlots,
  SyllableRecord
} from '../types';

const toneLabels: Record<string, string> = {
  '1': '一声',
  '2': '二声',
  '3': '三声',
  '4': '四声'
};

export const emptySlots = (): PracticeSlots => ({
  initial: null,
  final: null,
  tone: null
});

export function findSyllable(slots: PracticeSlots): SyllableRecord | undefined {
  if (slots.initial === null || slots.final === null || slots.tone === null) {
    return undefined;
  }

  return syllables.find(
    (item) =>
      item.initial === slots.initial && item.final === slots.final && item.tone === slots.tone
  );
}

export function evaluateSlots(
  mode: PracticeMode,
  slots: PracticeSlots,
  target?: SyllableRecord
): EvaluationResult {
  const match = findSyllable(slots);

  if (!slots.final || !slots.tone || slots.initial === null) {
    return { status: 'idle', message: '先把三节车厢都放到轨道上吧。' };
  }

  if (!match) {
    return {
      status: 'error',
      message: slots.initial === ''
        ? '零声母车头准备好了，再换一个韵母或声调试试。'
        : '这两节车厢还连不上哦，换个韵母或声调试试。'
    };
  }

  if (mode === 'free' || !target) {
    return {
      status: 'success',
      message: `成功拼出 ${match.displaySyllable}，${match.hint}`,
      match
    };
  }

  if (match.id === target.id) {
    return {
      status: 'success',
      message: `答对啦！${match.displaySyllable} 对应“${match.word}”。`,
      match
    };
  }

  if (match.initial !== target.initial) {
    return { status: 'error', message: '声母小车头不对，再试试前面这一节。', match };
  }

  if (match.final !== target.final) {
    return { status: 'error', message: '韵母车厢还没接对，换个绿色积木试试。', match };
  }

  return {
    status: 'error',
    message: `快对了，声调要换成${toneLabels[target.tone]}。`,
    match
  };
}

export function getQuestionPool(
  mode: Exclude<PracticeMode, 'free'>,
  difficulty: Difficulty,
  stageId?: string
): PracticeQuestion[] {
  return questionBank.filter(
    (item) =>
      item.mode === mode &&
      (difficulty === 'standard' || item.targetSyllable.difficulty === 'easy') &&
      (!stageId || item.targetSyllable.stageId === stageId)
  );
}

export function nextQuestion(
  mode: Exclude<PracticeMode, 'free'>,
  difficulty: Difficulty,
  previousId?: string,
  stageId?: string
): PracticeQuestion {
  const pool = getQuestionPool(mode, difficulty, stageId);
  const candidates = previousId ? pool.filter((item) => item.id !== previousId) : pool;
  const safePool = candidates.length > 0 ? candidates : pool;
  const index = Math.floor(Math.random() * safePool.length);
  return safePool[index];
}

export function buildDisplaySyllable(slots: PracticeSlots): string {
  const initial = slots.initial ?? '·';
  const final = slots.final ?? '·';
  const tone = slots.tone ? toneLabels[slots.tone] : '未选声调';
  return `${initial || 'Ø'} + ${final} + ${tone}`;
}
