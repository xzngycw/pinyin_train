
import type {
  CardItem,
  ParentSettings,
  PracticeQuestion,
  StageDefinition,
  SyllableRecord
} from '../types';

export const defaultSettings: ParentSettings = {
  soundEnabled: true,
  musicEnabled: false,
  reminderMinutes: 10,
  difficulty: 'easy'
};

export const initialCards: CardItem[] = [
  { id: 'b', type: 'initial', text: 'b', displayText: 'b', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'p', type: 'initial', text: 'p', displayText: 'p', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'm', type: 'initial', text: 'm', displayText: 'm', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'd', type: 'initial', text: 'd', displayText: 'd', colorType: 'initial', difficultyTag: 'easy' },
  { id: 't', type: 'initial', text: 't', displayText: 't', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'n', type: 'initial', text: 'n', displayText: 'n', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'l', type: 'initial', text: 'l', displayText: 'l', colorType: 'initial', difficultyTag: 'easy' },
  { id: 'g', type: 'initial', text: 'g', displayText: 'g', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'k', type: 'initial', text: 'k', displayText: 'k', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'h', type: 'initial', text: 'h', displayText: 'h', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'j', type: 'initial', text: 'j', displayText: 'j', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'q', type: 'initial', text: 'q', displayText: 'q', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'x', type: 'initial', text: 'x', displayText: 'x', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'zh', type: 'initial', text: 'zh', displayText: 'zh', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'ch', type: 'initial', text: 'ch', displayText: 'ch', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'sh', type: 'initial', text: 'sh', displayText: 'sh', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'r', type: 'initial', text: 'r', displayText: 'r', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'z', type: 'initial', text: 'z', displayText: 'z', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'c', type: 'initial', text: 'c', displayText: 'c', colorType: 'initial', difficultyTag: 'standard' },
  { id: 's', type: 'initial', text: 's', displayText: 's', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'y', type: 'initial', text: 'y', displayText: 'y', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'w', type: 'initial', text: 'w', displayText: 'w', colorType: 'initial', difficultyTag: 'standard' },
  { id: 'zero', type: 'initial', text: '', displayText: '零声母', colorType: 'initial', difficultyTag: 'easy' }
];

export const finalCards: CardItem[] = [
  { id: 'a', type: 'final', text: 'a', displayText: 'a', colorType: 'final', difficultyTag: 'easy' },
  { id: 'o', type: 'final', text: 'o', displayText: 'o', colorType: 'final', difficultyTag: 'easy' },
  { id: 'e', type: 'final', text: 'e', displayText: 'e', colorType: 'final', difficultyTag: 'easy' },
  { id: 'i', type: 'final', text: 'i', displayText: 'i', colorType: 'final', difficultyTag: 'easy' },
  { id: 'ai', type: 'final', text: 'ai', displayText: 'ai', colorType: 'final', difficultyTag: 'easy' },
  { id: 'an', type: 'final', text: 'an', displayText: 'an', colorType: 'final', difficultyTag: 'easy' },
  { id: 'ou', type: 'final', text: 'ou', displayText: 'ou', colorType: 'final', difficultyTag: 'easy' },
  { id: 'ia', type: 'final', text: 'ia', displayText: 'ia', colorType: 'final', difficultyTag: 'standard' },
  { id: 'iu', type: 'final', text: 'iu', displayText: 'iu', colorType: 'final', difficultyTag: 'standard' },
  { id: 'ue', type: 'final', text: 'ue', displayText: 'ue', colorType: 'final', difficultyTag: 'standard' }
];

export const toneCards: CardItem[] = [
  { id: '1', type: 'tone', text: '1', displayText: '一声', colorType: 'tone', difficultyTag: 'easy' },
  { id: '2', type: 'tone', text: '2', displayText: '二声', colorType: 'tone', difficultyTag: 'easy' },
  { id: '3', type: 'tone', text: '3', displayText: '三声', colorType: 'tone', difficultyTag: 'easy' },
  { id: '4', type: 'tone', text: '4', displayText: '四声', colorType: 'tone', difficultyTag: 'easy' }
];

export const syllables: SyllableRecord[] = [
  { id: 'ba1', initial: 'b', final: 'a', tone: '1', syllable: 'ba1', displaySyllable: 'bā', word: '八', emoji: '8️⃣', hint: '把 b 和 a 连起来，拉上一声小车铃。', audioUrl: './audio/ba1.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['basic'] },
  { id: 'ba3', initial: 'b', final: 'a', tone: '3', syllable: 'ba3', displaySyllable: 'bǎ', word: '把', emoji: '🫳', hint: '注意第三声像小山坡。', audioUrl: './audio/ba3.m4a', difficulty: 'easy', stageId: 'tone', tags: ['tone'] },
  { id: 'ma1', initial: 'm', final: 'a', tone: '1', syllable: 'ma1', displaySyllable: 'mā', word: '妈', emoji: '👩', hint: '妈妈的妈是一声。', audioUrl: './audio/ma1.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['basic'] },
  { id: 'ma3', initial: 'm', final: 'a', tone: '3', syllable: 'ma3', displaySyllable: 'mǎ', word: '马', emoji: '🐎', hint: '马字要用第三声。', audioUrl: './audio/ma3.m4a', difficulty: 'easy', stageId: 'tone', tags: ['tone'] },
  { id: 'da4', initial: 'd', final: 'a', tone: '4', syllable: 'da4', displaySyllable: 'dà', word: '大', emoji: '🦕', hint: '第四声像滑滑梯。', audioUrl: './audio/da4.m4a', difficulty: 'easy', stageId: 'tone', tags: ['basic'] },
  { id: 'ta1', initial: 't', final: 'a', tone: '1', syllable: 'ta1', displaySyllable: 'tā', word: '他', emoji: '🧒', hint: '他和她都读 tā。', audioUrl: './audio/ta1.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['basic'] },
  { id: 'na2', initial: 'n', final: 'a', tone: '2', syllable: 'na2', displaySyllable: 'ná', word: '拿', emoji: '🤲', hint: '第二声像上楼梯。', audioUrl: './audio/na2.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['basic'] },
  { id: 'la4', initial: 'l', final: 'a', tone: '4', syllable: 'la4', displaySyllable: 'là', word: '辣', emoji: '🌶️', hint: '先找到 l，再挂上第四声。', audioUrl: './audio/la4.m4a', difficulty: 'easy', stageId: 'tone', tags: ['tone'] },
  { id: 'bo1', initial: 'b', final: 'o', tone: '1', syllable: 'bo1', displaySyllable: 'bō', word: '波', emoji: '🌊', hint: '圆圆的 o 像小车轮。', audioUrl: './audio/bo1.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['basic'] },
  { id: 'po2', initial: 'p', final: 'o', tone: '2', syllable: 'po2', displaySyllable: 'pó', word: '婆', emoji: '👵', hint: '听一听第二声往上扬。', audioUrl: './audio/po2.m4a', difficulty: 'easy', stageId: 'tone', tags: ['basic'] },
  { id: 'mo4', initial: 'm', final: 'o', tone: '4', syllable: 'mo4', displaySyllable: 'mò', word: '墨', emoji: '🖋️', hint: 'm 和 o 组成 mò。', audioUrl: './audio/mo4.m4a', difficulty: 'easy', stageId: 'tone', tags: ['basic'] },
  { id: 'de2', initial: 'd', final: 'e', tone: '2', syllable: 'de2', displaySyllable: 'dé', word: '得', emoji: '🏅', hint: 'e 车厢上挂二声。', audioUrl: './audio/de2.m4a', difficulty: 'easy', stageId: 'tone', tags: ['basic'] },
  { id: 'ge1', initial: 'g', final: 'e', tone: '1', syllable: 'ge1', displaySyllable: 'gē', word: '歌', emoji: '🎤', hint: 'g 的小火车开进 e 站台。', audioUrl: './audio/ge1.m4a', difficulty: 'standard', stageId: 'advanced', tags: ['basic'] },
  { id: 'ke3', initial: 'k', final: 'e', tone: '3', syllable: 'ke3', displaySyllable: 'kě', word: '可', emoji: '✅', hint: '第三声要记得拐弯。', audioUrl: './audio/ke3.m4a', difficulty: 'standard', stageId: 'advanced', tags: ['tone'] },
  { id: 'he2', initial: 'h', final: 'e', tone: '2', syllable: 'he2', displaySyllable: 'hé', word: '河', emoji: '🏞️', hint: 'h 和 e 可以组成 hé。', audioUrl: './audio/he2.m4a', difficulty: 'standard', stageId: 'advanced', tags: ['basic'] },
  { id: 'ji1', initial: 'j', final: 'i', tone: '1', syllable: 'ji1', displaySyllable: 'jī', word: '鸡', emoji: '🐔', hint: 'j 后面跟 i，读作 jī。', audioUrl: './audio/ji1.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'jia1', initial: 'j', final: 'ia', tone: '1', syllable: 'jia1', displaySyllable: 'jiā', word: '家', emoji: '🏠', hint: '家字音节是 jiā。', audioUrl: './audio/jia1.m4a', difficulty: 'standard', stageId: 'special', tags: ['compound'] },
  { id: 'qiu2', initial: 'q', final: 'iu', tone: '2', syllable: 'qiu2', displaySyllable: 'qiú', word: '球', emoji: '⚽', hint: 'q 和 iu 组成 qiú。', audioUrl: './audio/qiu2.m4a', difficulty: 'standard', stageId: 'special', tags: ['compound'] },
  { id: 'xue2', initial: 'x', final: 'ue', tone: '2', syllable: 'xue2', displaySyllable: 'xué', word: '学', emoji: '📘', hint: 'x 和 ue 是重点组合。', audioUrl: './audio/xue2.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'zhi1', initial: 'zh', final: 'i', tone: '1', syllable: 'zhi1', displaySyllable: 'zhī', word: '知', emoji: '🧠', hint: 'zh 是整体声母车头。', audioUrl: './audio/zhi1.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'chi1', initial: 'ch', final: 'i', tone: '1', syllable: 'chi1', displaySyllable: 'chī', word: '吃', emoji: '🍚', hint: '吃饭的吃读 chī。', audioUrl: './audio/chi1.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'shi4', initial: 'sh', final: 'i', tone: '4', syllable: 'shi4', displaySyllable: 'shì', word: '是', emoji: '✔️', hint: '注意 sh 和第四声。', audioUrl: './audio/shi4.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'ri4', initial: 'r', final: 'i', tone: '4', syllable: 'ri4', displaySyllable: 'rì', word: '日', emoji: '☀️', hint: '太阳的日读 rì。', audioUrl: './audio/ri4.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'zi3', initial: 'z', final: 'i', tone: '3', syllable: 'zi3', displaySyllable: 'zǐ', word: '子', emoji: '👦', hint: 'z 和 i 也能组成音节。', audioUrl: './audio/zi3.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'ci2', initial: 'c', final: 'i', tone: '2', syllable: 'ci2', displaySyllable: 'cí', word: '词', emoji: '📝', hint: '第二声要往上提。', audioUrl: './audio/ci2.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'si1', initial: 's', final: 'i', tone: '1', syllable: 'si1', displaySyllable: 'sī', word: '丝', emoji: '🧵', hint: 's 和 i 组成 sī。', audioUrl: './audio/si1.m4a', difficulty: 'standard', stageId: 'special', tags: ['special'] },
  { id: 'ya1', initial: 'y', final: 'a', tone: '1', syllable: 'ya1', displaySyllable: 'yā', word: '鸭', emoji: '🦆', hint: 'y 开头的音节也常见。', audioUrl: './audio/ya1.m4a', difficulty: 'standard', stageId: 'advanced', tags: ['yw'] },
  { id: 'wo3', initial: 'w', final: 'o', tone: '3', syllable: 'wo3', displaySyllable: 'wǒ', word: '我', emoji: '🙋', hint: '我是 wǒ。', audioUrl: './audio/wo3.m4a', difficulty: 'standard', stageId: 'advanced', tags: ['yw'] },
  { id: 'ai4', initial: '', final: 'ai', tone: '4', syllable: 'ai4', displaySyllable: 'ài', word: '爱', emoji: '❤️', hint: '零声母也能单独发车。', audioUrl: './audio/ai4.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['zero'] },
  { id: 'an1', initial: '', final: 'an', tone: '1', syllable: 'an1', displaySyllable: 'ān', word: '安', emoji: '🛏️', hint: '零声母加 an 是 ān。', audioUrl: './audio/an1.m4a', difficulty: 'easy', stageId: 'foundation', tags: ['zero'] },
  { id: 'ou3', initial: '', final: 'ou', tone: '3', syllable: 'ou3', displaySyllable: 'ǒu', word: '藕', emoji: '🪷', hint: 'ou 前面也可以没有声母。', audioUrl: './audio/ou3.m4a', difficulty: 'easy', stageId: 'advanced', tags: ['zero'] }
];

export const stages: StageDefinition[] = [
  {
    id: 'foundation',
    title: '启程站',
    description: '先练最基础的开口呼和零声母音节。',
    emoji: '🚂',
    difficulty: 'easy',
    syllableIds: ['ba1', 'ma1', 'ta1', 'na2', 'bo1', 'ai4', 'an1']
  },
  {
    id: 'tone',
    title: '声调站',
    description: '重点区分一二三四声，练耳朵也练手感。',
    emoji: '🎵',
    difficulty: 'easy',
    syllableIds: ['ba3', 'ma3', 'da4', 'la4', 'po2', 'mo4', 'de2']
  },
  {
    id: 'special',
    title: '特殊音节站',
    description: '挑战 j/q/x、zh/ch/sh/r 和 z/c/s。',
    emoji: '🧩',
    difficulty: 'standard',
    syllableIds: ['ji1', 'jia1', 'qiu2', 'xue2', 'zhi1', 'chi1', 'shi4', 'ri4', 'zi3', 'ci2', 'si1']
  },
  {
    id: 'advanced',
    title: '进阶小站',
    description: '加入 y/w 开头和更多综合音节。',
    emoji: '🌈',
    difficulty: 'standard',
    syllableIds: ['ge1', 'ke3', 'he2', 'ya1', 'wo3', 'ou3']
  }
];

const buildQuestionSet = (mode: 'goal' | 'listen'): PracticeQuestion[] =>
  syllables.map((item) => ({
    id: `${mode}-${item.id}`,
    mode,
    targetSyllable: item
  }));

export const questionBank: PracticeQuestion[] = [
  ...buildQuestionSet('goal'),
  ...buildQuestionSet('listen')
];
