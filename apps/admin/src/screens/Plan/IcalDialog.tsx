import { useCallback, useEffect, useState } from 'react';
import {
  addIcalFeed,
  type IcalFeed,
  listIcalFeeds,
  macosCalImport,
  macosCalList,
  macosCalOpenPrivacy,
  macosCalRequestAccess,
  macosCalStatus,
  type MacosCalImportReport,
  type MacosCalStatus,
  removeIcalFeed,
  syncIcalFeeds,
} from '../../lib/tauri';
import { Button, Input, Mono, Select, type SelectOption } from '../../components/atoms/Atoms';
import {
  ICAL_SYNC_INTERVALS,
  type IcalSyncInterval,
  readIcalSyncInterval,
  readMacosCalAutoConfig,
  writeIcalSyncInterval,
  writeMacosCalAutoConfig,
} from '../../lib/icalSync';

interface Props {
  open: boolean;
  onClose: () => void;
  onSynced?: () => void;
}

export function IcalDialog({ open, onClose, onSynced }: Props) {
  const [feeds, setFeeds] = useState<IcalFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [macStatus, setMacStatus] = useState<MacosCalStatus | null>(null);
  const [macCalendars, setMacCalendars] = useState<string[]>([]);
  const initialMacCfg = readMacosCalAutoConfig();
  const [selectedCals, setSelectedCals] = useState<string[]>(initialMacCfg.calendars);
  const [daysBack, setDaysBack] = useState(initialMacCfg.daysBack);
  const [daysForward, setDaysForward] = useState(initialMacCfg.daysForward);
  const [macAutoEnabled, setMacAutoEnabled] = useState(initialMacCfg.enabled);
  const [macBusy, setMacBusy] = useState(false);
  const [macReport, setMacReport] = useState<MacosCalImportReport | null>(null);
  const [macError, setMacError] = useState<string | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [syncInterval, setSyncIntervalState] = useState<IcalSyncInterval>(() =>
    readIcalSyncInterval(),
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listIcalFeeds();
      setFeeds(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMac = useCallback(async () => {
    try {
      const status = await macosCalStatus();
      setMacStatus(status);
      if (status.available) {
        try {
          const cals = await macosCalList();
          setMacCalendars(cals);
        } catch (e) {
          setMacError(String(e));
        }
      }
    } catch (e) {
      setMacError(String(e));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMacError(null);
    setMacReport(null);
    refresh();
    refreshMac();
  }, [open, refresh, refreshMac]);

  if (!open) return null;

  const handleAdd = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setError(null);
    try {
      await addIcalFeed(label.trim() || '캘린더', u);
      setLabel('');
      setUrl('');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('이 캘린더 구독을 제거할까요? 이미 동기화된 일정 블록은 그대로 둡니다.')) return;
    setBusy(true);
    try {
      await removeIcalFeed(id);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await syncIcalFeeds();
      setFeeds(next);
      onSynced?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleCal = (name: string) => {
    setSelectedCals((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const handleMacImport = async () => {
    setMacBusy(true);
    setMacError(null);
    setMacReport(null);
    try {
      const report = await macosCalImport({
        calendars: selectedCals,
        daysBack,
        daysForward,
      });
      setMacReport(report);
      writeMacosCalAutoConfig({
        enabled: macAutoEnabled,
        calendars: selectedCals,
        daysBack,
        daysForward,
      });
      onSynced?.();
    } catch (e) {
      setMacError(String(e));
    } finally {
      setMacBusy(false);
    }
  };

  const handleMacAutoToggle = (next: boolean) => {
    setMacAutoEnabled(next);
    writeMacosCalAutoConfig({
      enabled: next,
      calendars: selectedCals,
      daysBack,
      daysForward,
    });
  };

  const handleRequestAccess = async () => {
    setRequestingAccess(true);
    setMacError(null);
    try {
      const status = await macosCalRequestAccess();
      setMacStatus(status);
      if (status.available) {
        try {
          const cals = await macosCalList();
          setMacCalendars(cals);
        } catch (e) {
          setMacError(String(e));
        }
      }
    } catch (e) {
      setMacError(String(e));
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleIntervalChange = (next: IcalSyncInterval) => {
    setSyncIntervalState(next);
    writeIcalSyncInterval(next);
  };

  const handleOpenPrivacy = async () => {
    try {
      await macosCalOpenPrivacy();
    } catch (e) {
      setMacError(String(e));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>캘린더 구독</h2>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>iCal · webcal</Mono>
          <span style={{ flex: 1 }} />
          <Button sm ghost onClick={onClose}>닫기</Button>
        </div>

        <details style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '6px 0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mono style={{ color: 'var(--blue)', fontSize: 11 }}>?</Mono>
              비공개 캘린더 주소는 어디서?
            </span>
          </summary>
          <ul
            style={{
              margin: '6px 0 0 0',
              padding: '8px 12px',
              fontSize: 11.5,
              lineHeight: 1.6,
              listStyle: 'none',
              border: '1px dashed var(--line)',
              borderRadius: 6,
              background: 'var(--bg-soft)',
            }}
          >
            <li>
              <strong>Google · 개인</strong> — calendar.google.com 좌측 캘린더의 ⋮ →{' '}
              <Mono>설정 및 공유 → 비공개 주소(iCal)</Mono>. URL이 <Mono>basic.ics</Mono>로 끝납니다.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>Google · 회사 (Workspace)</strong> — 관리자 정책으로 비공개 URL이 비활성화돼 있다면, OAuth가 필요한{' '}
              <Mono>events.list</Mono> API를 써야 합니다 (현재 Bento 미지원). 임시 우회: 회사 일정을 개인 캘린더에 자동 복사하는{' '}
              <Mono>script.google.com</Mono> 스크립트를 만들어 개인 캘린더의 iCal URL을 등록.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>Apple iCloud</strong> — iCloud.com 캘린더 → 공유 아이콘 → <Mono>공개 캘린더</Mono> 체크 → webcal:// URL 복사.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>Microsoft Outlook</strong> — outlook.office.com → 캘린더 게시 → 공개 권한 → <Mono>ICS</Mono> 링크 복사. 회사 정책상 막혀 있으면 본인 outlook.com 계정으로 우회.
            </li>
            <li style={{ marginTop: 4 }}>
              인증이 필요한 비공개 webcal://는 OS 캘린더 앱이 처리해야 하므로, 그쪽에서 받은 다음 EventKit으로 다시 노출되는 ICS를 쓰거나 OS 캘린더와 동기화하세요.
            </li>
          </ul>
        </details>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr auto',
            gap: 8,
          }}
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (예: 회사)"
            style={{ background: 'var(--bg)' }}
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… 또는 webcal://…"
            style={{ background: 'var(--bg)' }}
          />
          <Button sm onClick={handleAdd} disabled={busy || !url.trim()}>
            추가
          </Button>
        </div>

        {error && (
          <div
            style={{
              padding: 10,
              border: '1px solid var(--err-soft)',
              background: 'var(--err-soft)',
              color: 'var(--err)',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            borderTop: '1px solid var(--line)',
            paddingTop: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
              구독 {feeds.length}개
            </span>
            <span style={{ flex: 1 }} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--ink-mute)',
              }}
            >
              <span>자동 동기화</span>
              <div style={{ width: 110 }}>
                <Select<ActiveInterval>
                  value={syncInterval === 'off' ? null : (syncInterval as ActiveInterval)}
                  options={INTERVAL_OPTIONS}
                  placeholder="꺼짐"
                  onChange={(v) => handleIntervalChange(v ?? 'off')}
                />
              </div>
            </div>
            <Button sm onClick={handleSync} disabled={busy || feeds.length === 0}>
              {busy ? '동기화 중…' : '지금 동기화'}
            </Button>
          </div>

          {loading && feeds.length === 0 ? (
            <Empty text="불러오는 중…" />
          ) : feeds.length === 0 ? (
            <Empty text="등록된 캘린더가 없습니다" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {feeds.map((f) => (
                <FeedRow key={f.id} feed={f} onRemove={() => handleRemove(f.id)} />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid var(--line)',
            paddingTop: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>macOS 캘린더</h3>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>EventKit</Mono>
            <span style={{ flex: 1 }} />
            {macStatus && (
              <Mono
                style={{
                  fontSize: 10.5,
                  color: macStatus.available ? 'var(--ok, var(--blue))' : 'var(--ink-mute)',
                }}
              >
                {macStatus.authorization}
              </Mono>
            )}
          </div>

          {macStatus && !macStatus.available && (
            <div
              style={{
                padding: 12,
                border: '1px dashed var(--line)',
                borderRadius: 6,
                background: 'var(--bg-soft)',
                fontSize: 11.5,
                lineHeight: 1.6,
                color: 'var(--ink-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div>{macStatus.message}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {macStatus.authorization === 'notDetermined' && (
                  <Button sm onClick={handleRequestAccess} disabled={requestingAccess}>
                    {requestingAccess ? '요청 중…' : '캘린더 접근 권한 요청'}
                  </Button>
                )}
                {(macStatus.authorization === 'denied' ||
                  macStatus.authorization === 'restricted') && (
                  <Button sm onClick={handleOpenPrivacy}>
                    권한 설정 열기
                  </Button>
                )}
                <Button sm ghost onClick={refreshMac} disabled={requestingAccess}>
                  다시 확인
                </Button>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                macOS 캘린더 앱에서 회사 계정(Exchange / Google Workspace)을 추가해두면 가져올 수
                있습니다.
              </div>
            </div>
          )}

          {macStatus?.available && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: 'var(--ink-mute)',
                }}
              >
                <span>가져올 캘린더 선택 (전체 비우면 모두)</span>
                <span style={{ flex: 1 }} />
                <button
                  onClick={handleOpenPrivacy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--blue)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  권한 설정 열기
                </button>
              </div>
              {macCalendars.length === 0 && (
                <div
                  style={{
                    padding: 10,
                    border: '1px dashed var(--warn, var(--line))',
                    background: 'var(--bg-soft)',
                    borderRadius: 6,
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    color: 'var(--ink-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div>
                    캘린더 목록이 비었습니다 — 보통 <strong>macOS 캘린더 권한</strong>이 없어서 그렇습니다.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                    시스템 설정 → 개인정보 보호 및 보안 → 캘린더 → <Mono style={{ fontSize: 10.5 }}>Bento</Mono> 켜기.
                    개발 모드라면 터미널/iTerm에 권한을 줘야 할 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Button sm onClick={handleOpenPrivacy}>
                      권한 설정 열기
                    </Button>
                    <Button sm ghost onClick={refreshMac}>
                      다시 확인
                    </Button>
                  </div>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxHeight: 120,
                  overflowY: 'auto',
                  padding: '2px 0',
                }}
              >
                {macCalendars.map((name) => {
                  const on = selectedCals.includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleCal(name)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        border: `1px solid ${on ? 'var(--blue)' : 'var(--line)'}`,
                        background: on ? 'var(--blue)' : 'var(--bg-soft)',
                        color: on ? 'var(--bg)' : 'var(--ink)',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    fontSize: 11,
                    color: 'var(--ink-mute)',
                  }}
                >
                  과거 (일)
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={daysBack}
                    onChange={(e) => setDaysBack(Math.max(0, Number(e.target.value) || 0))}
                    style={{ background: 'var(--bg)' }}
                  />
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    fontSize: 11,
                    color: 'var(--ink-mute)',
                  }}
                >
                  미래 (일)
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={daysForward}
                    onChange={(e) => setDaysForward(Math.max(0, Number(e.target.value) || 0))}
                    style={{ background: 'var(--bg)' }}
                  />
                </label>
                <Button
                  sm
                  onClick={handleMacImport}
                  disabled={macBusy}
                  style={{ alignSelf: 'end' }}
                >
                  {macBusy ? '가져오는 중…' : '가져오기'}
                </Button>
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title="iCal 구독과 같은 주기로 macOS 캘린더도 자동 동기화"
              >
                <input
                  type="checkbox"
                  checked={macAutoEnabled}
                  onChange={(e) => handleMacAutoToggle(e.target.checked)}
                  style={{ accentColor: 'var(--blue)' }}
                />
                자동 동기화 (iCal 구독과 같은 주기)
              </label>

              {macError && (
                <div
                  style={{
                    padding: 10,
                    border: '1px solid var(--err-soft)',
                    background: 'var(--err-soft)',
                    color: 'var(--err)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {macError}
                </div>
              )}

              {macReport && (
                <div
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    background: 'var(--bg-soft)',
                    fontSize: 11.5,
                    color: 'var(--ink-soft)',
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <Mono style={{ fontSize: 11 }}>
                    +{macReport.added} ↻{macReport.updated} skip{macReport.skipped}/{macReport.total}
                  </Mono>
                  <span style={{ color: 'var(--ink-mute)' }}>
                    {macReport.total > 0
                      ? `${macReport.total}개 이벤트 처리됨`
                      : '가져올 이벤트가 없습니다'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ActiveInterval = Exclude<IcalSyncInterval, 'off'>;

const INTERVAL_OPTIONS: SelectOption<ActiveInterval>[] = ICAL_SYNC_INTERVALS.filter(
  (opt): opt is { id: ActiveInterval; label: string; ms: number } => opt.id !== 'off',
).map((opt) => ({ value: opt.id, label: opt.label }));

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '16px 0',
        color: 'var(--ink-mute)',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

function FeedRow({ feed, onRemove }: { feed: IcalFeed; onRemove: () => void }) {
  const r = feed.lastResult;
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderRadius: 6,
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {feed.label}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--err)',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          제거
        </button>
      </div>
      <span title={feed.url} style={{ display: 'block' }}>
        <Mono
          style={{
            fontSize: 10.5,
            color: 'var(--ink-mute)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {feed.url}
        </Mono>
      </span>
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 10.5,
          color: 'var(--ink-mute)',
        }}
      >
        <span>
          마지막 동기화 ·{' '}
          {feed.lastSyncedAt ? prettyTime(feed.lastSyncedAt) : '없음'}
        </span>
        {r && (
          <span>
            +{r.added} ↻{r.updated} skip{r.skipped}/{r.total}
          </span>
        )}
      </div>
    </div>
  );
}

function prettyTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
