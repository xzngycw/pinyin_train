import { useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultSettings,
  finalCards,
  initialCards,
  stages,
  syllables,
  toneCards
} from './data/pinyin';
import { buildDisplaySyllable, emptySlots, evaluateSlots, nextQuestion } from './lib/engine';
import {
  clearAppData,
  emptyMetrics,
  loadMetrics,
  loadSettings,
  saveMetrics,
  saveSettings
} from './lib/storage';
import type {
  AppView,
  CardItem,
  ParentSettings,
  PracticeQuestion,
  PracticeMode,
  PracticeSlots,
  SlotKey,
  SyllableRecord
} from './types';

type DragPayload = Pick<CardItem, 'type' | 'text'>;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const slotMeta: Record<SlotKey, { title: string; empty: string; helper: string }> = {
  initial: { title: '声母车头', empty: '拖入声母或零声母', helper: '蓝色积木' },
  final: { title: '韵母车厢', empty: '拖入韵母', helper: '绿色积木' },
  tone: { title: '声调烟囱', empty: '拖入声调', helper: '橙色积木' }
};

const trainBadge: Record<SlotKey, string> = {
  initial: '勇气号',
  final: '甜甜号',
  tone: '小火苗'
};

const modeMeta: Record<PracticeMode, { title: string; subtitle: string }> = {
  free: { title: '自由拼读', subtitle: '自由搭积木，探索更多合法音节。' },
  goal: { title: '目标拼读', subtitle: '按目标拼出来，完成一节节任务车厢。' },
  listen: { title: '听音拼读', subtitle: '先听声音，再把正确积木搭出来。' },
  review: { title: '错题复习', subtitle: '把做错过的音节重新拼对，集中补弱项。' }
};

const navItems: Array<{ view: AppView; label: string; icon: string }> = [
  { view: 'home', label: '首页', icon: '🏠' },
  { view: 'practice', label: '拼读台', icon: '🚂' },
  { view: 'progress', label: '我的成长', icon: '⭐' },
  { view: 'parent', label: '家长中心', icon: '🧰' }
];

function getTodayLabel() {
  return new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function App() {
  const [view, setView] = useState<AppView>('home');
  const [mode, setMode] = useState<PracticeMode>('free');
  const [slots, setSlots] = useState<PracticeSlots>(emptySlots());
  const [activeSlot, setActiveSlot] = useState<SlotKey>('initial');
  const [feedback, setFeedback] = useState('把车头、车厢和声调放到轨道上吧。');
  const [settings, setSettings] = useState<ParentSettings>(defaultSettings);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [currentMatch, setCurrentMatch] = useState<SyllableRecord | null>(null);
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? 'foundation');
  const [reviewQueue, setReviewQueue] = useState<SyllableRecord[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [hasUnlockedAudio, setHasUnlockedAudio] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );
  const [isBusy, setIsBusy] = useState(true);
  const [celebration, setCelebration] = useState({ active: false, stars: 0, message: '' });
  const [draggingType, setDraggingType] = useState<SlotKey | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<SlotKey | null>(null);
  const [pressedCardId, setPressedCardId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastEvalRef = useRef('');
  const currentQuestionRef = useRef<PracticeQuestion | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  const stageProgress = useMemo(() => {
    let previousPercent = 100;

    return stages.map((stage, index) => {
      const available = settings.difficulty === 'standard' || stage.difficulty === 'easy';
      const availableCount = stage.syllableIds.length;
      const masteredCount = stage.syllableIds.filter((id) => metrics.masteredSyllables.includes(id)).length;
      const wrongCount = stage.syllableIds.reduce((total, id) => total + (metrics.wrongSyllables[id] ?? 0), 0);
      const percent = availableCount === 0 ? 0 : Math.round((masteredCount / availableCount) * 100);
      const stars = percent >= 100 ? 3 : percent >= 67 ? 2 : percent >= 34 ? 1 : 0;
      const unlockedByProgress = index === 0 || previousPercent >= 60;
      const unlocked = available && unlockedByProgress;
      const lockedReason = !available
        ? '切换到标准难度后解锁'
        : index === 0 || unlockedByProgress
          ? ''
          : '前一站完成度达到 60% 后解锁';
      previousPercent = percent;

      return {
        ...stage,
        available,
        unlocked,
        lockedReason,
        availableCount,
        masteredCount,
        wrongCount,
        percent,
        stars,
        badge: stars === 3 ? '金牌列车长' : stars === 2 ? '闪亮小司机' : stars === 1 ? '启程新司机' : null
      };
    });
  }, [metrics.masteredSyllables, metrics.wrongSyllables, settings.difficulty]);

  const availableStages = useMemo(
    () => stageProgress.filter((stage) => stage.available),
    [stageProgress]
  );

  const unlockedStages = useMemo(
    () => availableStages.filter((stage) => stage.unlocked),
    [availableStages]
  );

  const earnedBadges = useMemo(
    () => stageProgress.filter((stage) => stage.badge),
    [stageProgress]
  );

  const selectedStage = useMemo(
    () => unlockedStages.find((stage) => stage.id === selectedStageId) ?? unlockedStages[0] ?? availableStages[0],
    [availableStages, selectedStageId, unlockedStages]
  );

  const topWrong = Object.entries(metrics.wrongSyllables)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const reviewRecords = useMemo(() => {
    return Object.entries(metrics.wrongSyllables)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => syllables.find((item) => item.id === id))
      .filter((item): item is SyllableRecord => Boolean(item))
      .filter((item) => settings.difficulty === 'standard' || item.difficulty === 'easy');
  }, [metrics.wrongSyllables, settings.difficulty]);

  const visibleInitials = useMemo(
    () => initialCards.filter((card) => settings.difficulty === 'standard' || card.difficultyTag === 'easy'),
    [settings.difficulty]
  );
  const visibleFinals = useMemo(
    () => finalCards.filter((card) => settings.difficulty === 'standard' || card.difficultyTag === 'easy'),
    [settings.difficulty]
  );

  const deckMap: Record<SlotKey, CardItem[]> = {
    initial: visibleInitials,
    final: visibleFinals,
    tone: toneCards
  };

  const currentQuestionTarget = question?.targetSyllable;
  const activeStage = currentQuestionTarget
    ? stageProgress.find((item) => item.id === currentQuestionTarget.stageId)
    : selectedStage;
  const currentDisplay = currentMatch?.displaySyllable ?? buildDisplaySyllable(slots);

  useEffect(() => {
    currentQuestionRef.current = question;
  }, [question]);

  useEffect(() => {
    const storedSettings = loadSettings();
    setSettings(storedSettings);
    loadMetrics().then((storedMetrics) => {
      setMetrics(storedMetrics);
      setIsBusy(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStage && unlockedStages[0]) {
      setSelectedStageId(unlockedStages[0].id);
    }
  }, [selectedStage, unlockedStages]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setIsInstalled(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'listen' || !question || !hasUnlockedAudio || !settings.soundEnabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      void playSyllable(question.targetSyllable);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, question, hasUnlockedAudio, settings.soundEnabled]);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  function unlockAudio() {
    if (!hasUnlockedAudio) {
      setHasUnlockedAudio(true);
    }
  }

  function triggerCelebration(stars: number, message: string) {
    setCelebration({ active: true, stars, message });
    window.setTimeout(() => {
      setCelebration((prev) => ({ ...prev, active: false }));
    }, 1400);
  }

  function commitMetrics(updater: (prev: typeof metrics) => typeof metrics) {
    setMetrics((prev) => {
      const next = updater(prev);
      void saveMetrics(next);
      return next;
    });
  }

  function createDragPreview(label: string) {
    const preview = document.createElement('div');
    preview.textContent = label;
    preview.style.position = 'fixed';
    preview.style.top = '-9999px';
    preview.style.left = '-9999px';
    preview.style.padding = '10px 14px';
    preview.style.borderRadius = '999px';
    preview.style.background = 'linear-gradient(135deg, #ffb54c, #ff8a3d)';
    preview.style.color = '#fff';
    preview.style.fontWeight = '700';
    preview.style.fontSize = '18px';
    preview.style.boxShadow = '0 12px 24px rgba(255, 138, 61, 0.24)';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '9999';
    document.body.appendChild(preview);
    return preview;
  }

  function syncReviewQuestion(nextQueue: SyllableRecord[], nextIndex: number) {
    const current = nextQueue[nextIndex];
    if (!current) {
      setQuestion(null);
      setFeedback('错题列车已经全部复习完成，回成长页看看新的进步吧。');
      return;
    }

    setQuestion({
      id: `review-${current.id}-${nextIndex}`,
      mode: 'goal',
      targetSyllable: current
    });
    setFeedback(`复习目标：${current.emoji} ${current.displaySyllable}（${current.word}）`);
  }

  function beginReview() {
    unlockAudio();
    if (reviewRecords.length === 0) {
      setView('progress');
      setMode('review');
      setQuestion(null);
      setReviewQueue([]);
      setReviewIndex(0);
      setFeedback('当前没有可复习的错题，继续去闯关吧。');
      return;
    }

    setMode('review');
    setView('practice');
    setSlots(emptySlots());
    setCurrentMatch(null);
    setActiveSlot('initial');
    lastEvalRef.current = '';
    setReviewQueue(reviewRecords);
    setReviewIndex(0);
    syncReviewQuestion(reviewRecords, 0);
  }

  function beginMode(nextMode: PracticeMode, stageOverride?: string) {
    unlockAudio();

    if (nextMode === 'review') {
      beginReview();
      return;
    }

    setMode(nextMode);
    setView('practice');
    setSlots(emptySlots());
    setCurrentMatch(null);
    setActiveSlot('initial');
    setReviewQueue([]);
    setReviewIndex(0);
    lastEvalRef.current = '';

    if (nextMode === 'free') {
      setQuestion(null);
      setFeedback('自由搭建吧，拼成合法音节后小火车就会发车。');
      return;
    }

    const stageId = stageOverride ?? selectedStage?.id ?? unlockedStages[0]?.id ?? stages[0].id;
    const stageSummary = stageProgress.find((item) => item.id === stageId);
    if (!stageSummary?.unlocked) {
      setView('home');
      setFeedback(stageSummary?.lockedReason || '该小站尚未解锁。');
      return;
    }

    setSelectedStageId(stageId);
    const next = nextQuestion(nextMode, settings.difficulty, undefined, stageId);
    setQuestion(next);
    setFeedback(
      nextMode === 'goal'
        ? `目标音节：${next.targetSyllable.displaySyllable}（${next.targetSyllable.word}）`
        : '先听音，再把车厢拼出来。'
    );
  }

  function applyCard(slot: SlotKey, text: string) {
    unlockAudio();
    setSlots((prev) => ({ ...prev, [slot]: text }));
    setFeedback(`已放入${slotMeta[slot].title}，继续搭下一节吧。`);
    if (slot === 'initial') setActiveSlot('final');
    if (slot === 'final') setActiveSlot('tone');
  }

  function handleCardPick(card: CardItem) {
    const targetSlot = activeSlot;
    if (targetSlot !== card.type) {
      setFeedback(`先把${slotMeta[targetSlot].title}放到轨道上哦。`);
      return;
    }
    applyCard(card.type, card.text);
  }

  function clearCardPressState() {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressedCardId(null);
  }

  function handleCardPointerDown(card: CardItem, pointerType: string) {
    if (pointerType !== 'touch') return;
    clearCardPressState();
    setPressedCardId(card.id);
    pressTimerRef.current = window.setTimeout(() => {
      setActiveSlot(card.type);
      navigator.vibrate?.(12);
      setFeedback(`已帮你选中${slotMeta[card.type].title}，松手即可放入。`);
    }, 180);
  }

  function handleDrop(slot: SlotKey, payload: DragPayload) {
    unlockAudio();
    setDragOverSlot(null);
    if (payload.type !== slot) {
      setFeedback(`${slotMeta[slot].title}需要对应颜色的积木。`);
      return;
    }
    applyCard(slot, payload.text);
  }

  function resetBoard() {
    setSlots(emptySlots());
    setCurrentMatch(null);
    setActiveSlot('initial');
    setDragOverSlot(null);
    setDraggingType(null);
    setFeedback('轨道清空啦，再搭一次吧。');
    lastEvalRef.current = '';
  }

  function updateMetrics(success: boolean, targetId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    commitMetrics((prev) => {
      const next = { ...prev };
      next.attempts += 1;
      next.lastPlayedDate = today;
      next.todayCount += 1;

      if (success && targetId) {
        next.successCount += 1;
        next.streak += 1;
        next.bestStreak = Math.max(next.bestStreak, next.streak);
        next.completedChallenges += 1;
        next.recentSuccesses = [targetId, ...next.recentSuccesses.filter((id) => id !== targetId)].slice(0, 6);
        if (!next.masteredSyllables.includes(targetId)) {
          next.masteredSyllables = [...next.masteredSyllables, targetId];
        }
      } else if (targetId) {
        next.errorCount += 1;
        next.streak = 0;
        next.wrongSyllables = {
          ...next.wrongSyllables,
          [targetId]: (next.wrongSyllables[targetId] ?? 0) + 1
        };
      }

      return next;
    });
  }

  async function playSyllable(record: SyllableRecord) {
    if (!settings.soundEnabled) return;

    try {
      audioRef.current?.pause();
      const audio = new Audio(record.audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(record.displaySyllable);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  function nextChallenge() {
    if (mode === 'review') {
      const nextIndex = reviewIndex + 1;
      setSlots(emptySlots());
      setCurrentMatch(null);
      setActiveSlot('initial');
      lastEvalRef.current = '';
      setReviewIndex(nextIndex);
      syncReviewQuestion(reviewQueue, nextIndex);
      return;
    }

    if (mode === 'free') {
      resetBoard();
      return;
    }

    const stageId = currentQuestionRef.current?.targetSyllable.stageId ?? selectedStage?.id;
    if (!stageId) return;

    const next = nextQuestion(mode, settings.difficulty, currentQuestionRef.current?.id, stageId);
    setQuestion(next);
    setSlots(emptySlots());
    setCurrentMatch(null);
    setActiveSlot('initial');
    setFeedback(
      mode === 'goal'
        ? `目标音节：${next.targetSyllable.displaySyllable}（${next.targetSyllable.word}）`
        : '先听音，再把车厢拼出来。'
    );
    lastEvalRef.current = '';
  }

  function updateParentSetting<K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  async function clearAllData() {
    const confirmed = window.confirm('确定清空本地学习记录和家长设置吗？');
    if (!confirmed) return;

    await clearAppData();
    setSettings(defaultSettings);
    setMetrics(emptyMetrics);
    setSelectedStageId(stages[0].id);
    setReviewQueue([]);
    setReviewIndex(0);
    setCelebration({ active: false, stars: 0, message: '' });
    setFeedback('本地记录已清空。');
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }

  useEffect(() => {
    const { initial, final, tone } = slots;
    if (initial === null || final === null || tone === null) {
      return;
    }

    const currentKey = `${mode}-${question?.id ?? 'free'}-${initial}-${final}-${tone}`;
    if (lastEvalRef.current === currentKey) {
      return;
    }
    lastEvalRef.current = currentKey;

    const result = evaluateSlots(mode, slots, currentQuestionTarget);
    setFeedback(result.message);
    setCurrentMatch(result.match ?? null);

    if (result.status === 'success' && result.match) {
      void playSyllable(result.match);
      updateMetrics(true, mode === 'free' ? result.match.id : currentQuestionTarget?.id);
      triggerCelebration(Math.max(activeStage?.stars ?? 0, 1), `答对了：${result.match.displaySyllable}`);
    }

    if (result.status === 'error') {
      updateMetrics(false, currentQuestionTarget?.id ?? result.match?.id);
    }
  }, [slots, mode, question, currentQuestionTarget]);

  if (isBusy) {
    return <main className="loading-screen">正在装载拼音车站…</main>;
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">商用教育应用 MVP</p>
          <h1>拼音拼读小火车</h1>
          <p className="subtitle">像搭积木一样拼读，拼成后立刻听到标准音节。</p>
        </div>
        <div className="status-stack">
          <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '在线' : '离线可练习'}
          </span>
          <span className="status-pill warm">今日 {metrics.todayCount} 次</span>
        </div>
      </header>

      {view === 'home' && (
        <section className="view home-view">
          <div className="hero-card home-hero">
            <div>
              <p className="hero-badge">PWA · 平板优先 · 静态部署</p>
              <h2>把声母、韵母、声调搭成一列会发音的小火车</h2>
              <p>
                适合幼小衔接和小学低年级。自由探索、目标拼读、听音拼读三种玩法都已经可用，
                现在还支持按小站分阶段练习。
              </p>
            </div>
            <div className="train-illustration" aria-hidden="true">
              <span className="hero-cloud hero-cloud-one" />
              <span className="hero-cloud hero-cloud-two" />
              <span className="hero-flag" />
              <div className="train-head">声母</div>
              <div className="train-body">韵母</div>
              <div className="train-tail">声调</div>
            </div>
          </div>

          <section className="panel quick-actions">
            <div className="panel-heading">
              <div>
                <h3>开始拼读</h3>
                <p>先选择玩法，也可以先选一个关卡小站。</p>
              </div>
              {!isInstalled && installPrompt && (
                <button className="secondary-btn" onClick={() => void installApp()}>
                  安装到主屏幕
                </button>
              )}
            </div>
            <div className="mode-grid four-grid">
              {(['free', 'goal', 'listen'] as PracticeMode[]).map((item) => (
                <button key={item} className="mode-card" onClick={() => beginMode(item)}>
                  <strong>{modeMeta[item].title}</strong>
                  <span>{modeMeta[item].subtitle}</span>
                </button>
              ))}
              <button className="mode-card review-card" onClick={beginReview}>
                <strong>错题复习</strong>
                <span>{reviewRecords.length > 0 ? `待复习 ${reviewRecords.length} 个音节` : '当前没有待复习错题'}</span>
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>关卡模式</h3>
                <p>按学习阶段进入对应小站，逐步完成从基础到特殊音节的训练。</p>
              </div>
              <span className="status-pill">当前难度：{settings.difficulty === 'easy' ? '简单' : '标准'}</span>
            </div>
            <div className="stage-grid">
              {availableStages.map((stage) => {
                const progress = stageProgress.find((item) => item.id === stage.id);
                const isActive = selectedStage?.id === stage.id;
                return (
                  <article
                    key={stage.id}
                    className={`stage-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedStageId(stage.id)}
                  >
                    <div className="stage-top">
                      <div>
                        <span className="stage-emoji">{stage.emoji}</span>
                        <h4>{stage.title}</h4>
                      </div>
                      <span className="stage-percent">{progress?.percent ?? 0}%</span>
                    </div>
                    <p>{stage.description}</p>
                    <div className="progress-strip">
                      <span style={{ width: `${progress?.percent ?? 0}%` }} />
                    </div>
                    <div className="stage-meta-row">
                      <span>已掌握 {progress?.masteredCount ?? 0}/{stage.syllableIds.length}</span>
                      <span>错题 {progress?.wrongCount ?? 0}</span>
                    </div>
                    <div className="star-row" aria-label="阶段星级">
                      {[1, 2, 3].map((star) => (
                        <span key={star} className={star <= stage.stars ? 'filled' : ''}>★</span>
                      ))}
                    </div>
                    {stage.badge && <div className="badge-chip">🏅 {stage.badge}</div>}
                    {!stage.unlocked && <div className="lock-tip">🔒 {stage.lockedReason}</div>}
                    <div className="stage-actions">
                      <button
                        className="secondary-btn"
                        disabled={!stage.unlocked}
                        onClick={(event) => {
                          event.stopPropagation();
                          beginMode('goal', stage.id);
                        }}
                      >
                        目标拼读
                      </button>
                      <button
                        className="secondary-btn"
                        disabled={!stage.unlocked}
                        onClick={(event) => {
                          event.stopPropagation();
                          beginMode('listen', stage.id);
                        }}
                      >
                        听音拼读
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="dashboard-grid">
            <article className="panel metric-card">
              <h3>今日进度</h3>
              <div className="metric-row">
                <span>{getTodayLabel()}</span>
                <strong>{metrics.todayCount}</strong>
              </div>
              <div className="metric-row">
                <span>连续正确</span>
                <strong>{metrics.streak}</strong>
              </div>
              <div className="metric-row">
                <span>最好连击</span>
                <strong>{metrics.bestStreak}</strong>
              </div>
            </article>
            <article className="panel metric-card">
              <h3>推荐小站</h3>
              <p className="muted">
                {selectedStage ? `${selectedStage.emoji} ${selectedStage.title}` : '请选择一个关卡小站'}
              </p>
              <ul className="simple-list">
                <li>根据当前难度自动筛选可用关卡</li>
                <li>每个小站支持目标拼读与听音拼读</li>
                <li>完成率会同步记录到成长页</li>
              </ul>
            </article>
            <article className="panel metric-card">
              <h3>勋章墙</h3>
              <div className="chip-wrap">
                {earnedBadges.length > 0 ? earnedBadges.map((stage) => (
                  <span key={stage.id} className="chip success-chip">🏅 {stage.title}</span>
                )) : <p className="muted">继续闯关，解锁第一枚勋章。</p>}
              </div>
            </article>
            <article className="panel metric-card">
              <h3>最近掌握</h3>
              <div className="chip-wrap">
                {(metrics.recentSuccesses.length > 0 ? metrics.recentSuccesses : ['ma1', 'ba1', 'ai4'])
                  .map((id) => syllables.find((item) => item.id === id))
                  .map((item) => (
                    <span key={item?.id ?? 'fallback'} className="chip warm-chip">
                      {item?.emoji ?? '⭐'} {item?.displaySyllable ?? item?.id}
                    </span>
                  ))}
              </div>
            </article>
          </section>
        </section>
      )}

      {view === 'practice' && (
        <section className="view practice-view">
          <div className="practice-layout station-layout">
            <section className="panel workspace-panel arrival-panel">
              <div className="panel-heading">
                <div>
                  <h2>{modeMeta[mode].title}</h2>
                  <p>{modeMeta[mode].subtitle}</p>
                </div>
                <div className="heading-actions">
                  {mode !== 'free' && currentQuestionTarget && (
                    <button className="primary-btn horn-btn" onClick={() => void playSyllable(currentQuestionTarget)}>
                      {mode === 'listen' ? '🔔 再听一遍' : '📣 播放目标音'}
                    </button>
                  )}
                  <button className="secondary-btn toy-btn" onClick={resetBoard}>重置轨道</button>
                </div>
              </div>

              {activeStage && (
                <div className="stage-banner">
                  <span className="stage-emoji">{activeStage.emoji}</span>
                  <div>
                    <strong>{activeStage.title}</strong>
                    <p>{activeStage.description}</p>
                  </div>
                  <div className="stage-banner-stars">
                    {[1, 2, 3].map((star) => (
                      <span key={star} className={star <= activeStage.stars ? 'filled' : ''}>★</span>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestionTarget && mode !== 'free' && (
                <div className="picture-card">
                  <div className="picture-emoji" aria-hidden="true">{currentQuestionTarget.emoji}</div>
                  <div>
                    <p className="eyebrow">图词提示</p>
                    <h3>{currentQuestionTarget.word}</h3>
                    <p className="muted">拼音：{currentQuestionTarget.displaySyllable}</p>
                  </div>
                </div>
              )}

              <div className="goal-banner">
                {mode === 'free' && <strong>自由探索：尝试拼出任意合法音节</strong>}
                {mode === 'goal' && currentQuestionTarget && (
                  <strong>
                    目标：{currentQuestionTarget.emoji} {currentQuestionTarget.displaySyllable} · {currentQuestionTarget.word}
                  </strong>
                )}
                {mode === 'listen' && currentQuestionTarget && (
                  <strong>
                    听音后拼出对应音节，提示词：{currentQuestionTarget.emoji} {currentQuestionTarget.word}
                  </strong>
                )}
                {mode === 'review' && currentQuestionTarget && (
                  <strong>
                    错题复习 {reviewIndex + 1}/{reviewQueue.length}：{currentQuestionTarget.emoji} {currentQuestionTarget.displaySyllable} · {currentQuestionTarget.word}
                  </strong>
                )}
              </div>

              <div className="track-board">
                {(['initial', 'final', 'tone'] as SlotKey[]).map((slot) => {
                  const slotValue = slots[slot];
                  const slotCard = deckMap[slot].find((item) => item.text === slotValue);
                  return (
                    <button
                      key={slot}
                      className={`track-slot ${slot} ${activeSlot === slot ? 'active' : ''} ${dragOverSlot === slot ? (draggingType === slot ? 'drag-match' : 'drag-mismatch') : ''}`}
                      onClick={() => setActiveSlot(slot)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragOverSlot !== slot) {
                          setDragOverSlot(slot);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverSlot((prev) => (prev === slot ? null : prev));
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const raw = event.dataTransfer.getData('application/json');
                        if (!raw) return;
                        handleDrop(slot, JSON.parse(raw) as DragPayload);
                      }}
                    >
                      <span className="slot-lamp" aria-hidden="true" />
                      <span className="slot-face" aria-hidden="true">
                        <span className="eye" />
                        <span className="eye" />
                        <span className="smile" />
                      </span>
                      <span className="slot-badge">{trainBadge[slot]}</span>
                      <span className="slot-title">{slotMeta[slot].title}</span>
                      <span className="slot-value">{slotCard?.displayText ?? slotMeta[slot].empty}</span>
                      <span className="slot-helper">{slotMeta[slot].helper}</span>
                      <span className="slot-ticket">{slotValue ? '已装车' : '待装车'}</span>
                    </button>
                  );
                })}
              </div>

              <div className="result-ribbon">
                <div>
                  <span className="label">当前组合</span>
                  <strong>{currentDisplay}</strong>
                </div>
                {currentMatch && (
                  <button className="primary-btn horn-btn" onClick={() => void playSyllable(currentMatch)}>
                    🚂 重播发音
                  </button>
                )}
              </div>

              {celebration.active && (
                <div className="celebration-panel">
                  <div className="celebration-confetti" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="moving-train">🚂✨🚃</div>
                  <div className="star-row large-stars" aria-hidden="true">
                    {Array.from({ length: celebration.stars }).map((_, index) => (
                      <span key={`celebrate-${index}`} className="filled">★</span>
                    ))}
                  </div>
                  <strong>{celebration.message}</strong>
                </div>
              )}

              <article className={`feedback-card ${currentMatch ? 'success' : ''}`}>
                <p>{feedback}</p>
                <div className="feedback-actions">
                  <button className="secondary-btn" onClick={nextChallenge}>
                    {mode === 'free' ? '继续自由搭建' : mode === 'review' ? '下一道错题' : '下一题'}
                  </button>
                  <button className="secondary-btn" onClick={() => setView('progress')}>
                    查看成长
                  </button>
                </div>
              </article>
            </section>

            <section className="panel card-panel toy-depot">
              <div className="depot-scene" aria-hidden="true">
                <span className="depot-cloud cloud-one" />
                <span className="depot-cloud cloud-two" />
                <span className="depot-flag" />
              </div>
              <div className="panel-heading compact depot-heading">
                <div>
                  <h3>积木卡片库</h3>
                  <p>点击卡片会放到当前高亮轨道，也支持拖拽。</p>
                </div>
                <span className="status-pill">当前放置：{slotMeta[activeSlot].title}</span>
              </div>

              {mode !== 'free' && mode !== 'review' && selectedStage && (
                <div className="mini-stage-list">
                  {availableStages.map((stage) => (
                    <button
                      key={stage.id}
                      className={`mini-stage-chip ${selectedStage.id === stage.id ? 'active' : ''}`}
                      disabled={!stage.unlocked}
                      onClick={() => beginMode(mode, stage.id)}
                    >
                      {stage.unlocked ? stage.emoji : '🔒'} {stage.title}
                    </button>
                  ))}
                </div>
              )}

              {(['initial', 'final', 'tone'] as SlotKey[]).map((slot) => (
                <div key={slot} className="deck-section depot-section">
                  <div className="deck-title depot-title">
                    <strong>{slotMeta[slot].title}</strong>
                    <span>{slotMeta[slot].helper}</span>
                  </div>
                  <div className="card-grid storage-bin">
                    {deckMap[slot].map((card) => (
                      <button
                        key={`${slot}-${card.id}`}
                        className={`pinyin-card ${slot} ${pressedCardId === card.id ? 'pressed' : ''}`}
                        draggable
                        onDragStart={(event) => {
                          unlockAudio();
                          setDraggingType(card.type);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({ type: card.type, text: card.text } satisfies DragPayload)
                          );

                          const preview = createDragPreview(card.displayText);
                          event.dataTransfer.setDragImage(
                            preview,
                            Math.round(preview.offsetWidth / 2),
                            Math.round(preview.offsetHeight / 2)
                          );
                          window.setTimeout(() => preview.remove(), 0);
                        }}
                        onDragEnd={() => {
                          setDraggingType(null);
                          setDragOverSlot(null);
                        }}
                        onPointerDown={(event) => handleCardPointerDown(card, event.pointerType)}
                        onPointerUp={clearCardPressState}
                        onPointerCancel={clearCardPressState}
                        onPointerLeave={clearCardPressState}
                        onClick={() => handleCardPick(card)}
                      >
                        <strong>{card.displayText}</strong>
                        <span>{card.text === '' ? 'Ø' : card.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </section>
      )}

      {view === 'progress' && (
        <section className="view dashboard-view">
          <section className="dashboard-grid progress-grid">
            <article className="panel metric-card">
              <h3>学习总览</h3>
              <div className="metric-row"><span>总尝试次数</span><strong>{metrics.attempts}</strong></div>
              <div className="metric-row"><span>正确次数</span><strong>{metrics.successCount}</strong></div>
              <div className="metric-row"><span>错误次数</span><strong>{metrics.errorCount}</strong></div>
              <div className="metric-row"><span>已掌握音节</span><strong>{metrics.masteredSyllables.length}</strong></div>
            </article>
            <article className="panel metric-card">
              <h3>最近拼对</h3>
              <div className="chip-wrap">
                {metrics.recentSuccesses.length > 0 ? metrics.recentSuccesses.map((id) => {
                  const item = syllables.find((entry) => entry.id === id);
                  return <span key={id} className="chip success-chip">{item?.emoji ?? '⭐'} {item?.displaySyllable ?? id}</span>;
                }) : <p className="muted">还没有记录，先去拼一拼吧。</p>}
              </div>
            </article>
            <article className="panel metric-card">
              <h3>易错音节</h3>
              {topWrong.length > 0 ? (
                <>
                  <ul className="simple-list">
                    {topWrong.map(([id, count]) => {
                      const item = syllables.find((entry) => entry.id === id);
                      return (
                        <li key={id}>
                          {item?.emoji ?? '⚠️'} {item?.displaySyllable ?? id} · {count} 次
                        </li>
                      );
                    })}
                  </ul>
                  <div className="wrong-review-actions">
                    <button className="secondary-btn" onClick={beginReview}>
                      开始错题复习
                    </button>
                    <span className="muted">按错题频次排序，优先复习最容易混淆的音节。</span>
                  </div>
                </>
              ) : (
                <p className="muted">当前没有高频错题。</p>
              )}
            </article>
            <article className="panel metric-card">
              <h3>勋章与星级</h3>
              <div className="chip-wrap">
                {earnedBadges.length > 0 ? earnedBadges.map((stage) => (
                  <span key={stage.id} className="chip warm-chip">🏅 {stage.badge}</span>
                )) : <p className="muted">先完成一个小站，点亮你的第一枚勋章。</p>}
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>关卡完成度</h3>
                <p>查看每个小站的掌握情况，并从成长页继续练习。</p>
              </div>
            </div>
            <div className="stage-grid">
              {stageProgress.map((stage) => (
                <article key={stage.id} className="stage-card compact-stage">
                  <div className="stage-top">
                    <div>
                      <span className="stage-emoji">{stage.emoji}</span>
                      <h4>{stage.title}</h4>
                    </div>
                    <span className="stage-percent">{stage.percent}%</span>
                  </div>
                  <p>{stage.description}</p>
                  <div className="progress-strip">
                    <span style={{ width: `${stage.percent}%` }} />
                  </div>
                  <div className="stage-meta-row">
                    <span>已掌握 {stage.masteredCount}/{stage.availableCount}</span>
                    <span>错题 {stage.wrongCount}</span>
                  </div>
                  <div className="star-row" aria-label="阶段星级">
                    {[1, 2, 3].map((star) => (
                      <span key={star} className={star <= stage.stars ? 'filled' : ''}>★</span>
                    ))}
                  </div>
                  {stage.badge && <div className="badge-chip">🏅 {stage.badge}</div>}
                  {!stage.unlocked && <div className="lock-tip">🔒 {stage.lockedReason}</div>}
                  <div className="stage-actions">
                    <button className="secondary-btn" disabled={!stage.unlocked} onClick={() => beginMode('goal', stage.id)}>
                      去练这一站
                    </button>
                    <button className="secondary-btn" disabled={!stage.unlocked} onClick={() => beginMode('listen', stage.id)}>
                      听音挑战
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {view === 'parent' && (
        <section className="view parent-view">
          <div className="dashboard-grid parent-grid">
            <article className="panel metric-card parent-settings-card">
              <h3>家长设置</h3>
              <label className="setting-row setting-toggle-row">
                <span>发音反馈</span>
                <span className="toggle-shell">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(event) => updateParentSetting('soundEnabled', event.target.checked)}
                  />
                  <span className="toggle-slider" aria-hidden="true" />
                </span>
              </label>
              <label className="setting-row setting-toggle-row">
                <span>背景音乐</span>
                <span className="toggle-shell">
                  <input
                    type="checkbox"
                    checked={settings.musicEnabled}
                    onChange={(event) => updateParentSetting('musicEnabled', event.target.checked)}
                  />
                  <span className="toggle-slider" aria-hidden="true" />
                </span>
              </label>
              <label className="setting-row stacked">
                <span>学习难度</span>
                <select
                  className="toy-select"
                  value={settings.difficulty}
                  onChange={(event) => updateParentSetting('difficulty', event.target.value as ParentSettings['difficulty'])}
                >
                  <option value="easy">简单</option>
                  <option value="standard">标准</option>
                </select>
              </label>
              <label className="setting-row stacked">
                <span>学习提醒（分钟）</span>
                <input
                  className="toy-number"
                  type="number"
                  min={5}
                  max={30}
                  value={settings.reminderMinutes}
                  onChange={(event) => updateParentSetting('reminderMinutes', Number(event.target.value))}
                />
              </label>
            </article>

            <article className="panel metric-card parent-note-card">
              <h3>学习说明</h3>
              <ul className="simple-list">
                <li>蓝色积木代表声母，绿色积木代表韵母，橙色积木代表声调。</li>
                <li>点击轨道可切换当前放置位置，小屏手机上更容易操作。</li>
                <li>新增关卡模式，可按阶段持续练习不同小站。</li>
                <li>应用默认离线保存数据，清除浏览器缓存后记录会丢失。</li>
              </ul>
            </article>

            <article className="panel metric-card parent-summary-card">
              <h3>成长摘要</h3>
              <div className="metric-row"><span>今日练习</span><strong>{metrics.todayCount}</strong></div>
              <div className="metric-row"><span>完成挑战</span><strong>{metrics.completedChallenges}</strong></div>
              <div className="metric-row"><span>最好连击</span><strong>{metrics.bestStreak}</strong></div>
            </article>

            <article className="panel metric-card danger-card">
              <h3>本地数据管理</h3>
              <p className="muted">如需重置体验，可清空本地记录与设置。</p>
              <button className="danger-btn" onClick={() => void clearAllData()}>
                清空本地记录
              </button>
            </article>
          </div>
        </section>
      )}

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.view}
            className={view === item.view ? 'active' : ''}
            onClick={() => setView(item.view)}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

export default App;
