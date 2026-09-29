import { useState } from 'react';
import type { MacosCalStatus } from '../../lib/tauri';
import { macosCalOpenPrivacy, macosCalRequestAccess, macosCalStatus } from '../../lib/tauri';
import { Button } from '../../components/atoms/Atoms';

interface Props {
  status: MacosCalStatus;
  onClose: () => void;
  onGranted: () => void;
}

export function CalPermissionModal({ status, onClose, onGranted }: Props) {
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(status);

  const handleRequest = async () => {
    setBusy(true);
    try {
      const next = await macosCalRequestAccess();
      setCurrent(next);
      if (next.available) onGranted();
    } finally {
      setBusy(false);
    }
  };

  const handleOpenSettings = async () => {
    await macosCalOpenPrivacy().catch(() => {});
  };

  const handleRecheck = async () => {
    setBusy(true);
    try {
      const next = await macosCalStatus();
      setCurrent(next);
      if (next.available) onGranted();
    } finally {
      setBusy(false);
    }
  };

  const isDenied = current.authorization === 'denied' || current.authorization === 'restricted';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.48)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--ink)',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '18px 24px 0',
          }}
        >
          <CalendarIcon size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>캘린더 접근 권한이 필요합니다</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>
              macOS 캘린더에서 일정을 가져오려면 권한을 허용해야 합니다.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-mute)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
              alignSelf: 'flex-start',
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            padding: '20px 24px 24px',
          }}
        >
          {/* 좌측: 설명 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.7,
                color: 'var(--ink-soft)',
              }}
            >
              {isDenied ? (
                <>
                  <strong style={{ color: 'var(--ink)' }}>Bento의 캘린더 접근이 차단</strong>돼 있습니다.
                  {' '}오른쪽 가이드를 참고해 <strong style={{ color: 'var(--ink)' }}>시스템 설정</strong>에서
                  Bento를 허용한 뒤 아래 "다시 확인" 버튼을 눌러주세요.
                </>
              ) : (
                <>
                  권한 요청이 아직 이루어지지 않았습니다.
                  {' '}<strong style={{ color: 'var(--ink)' }}>허용하기</strong> 버튼을 눌러
                  macOS 권한 요청 다이얼로그를 띄워주세요.
                </>
              )}
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 11.5,
                lineHeight: 1.7,
                color: 'var(--ink-mute)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>
                {isDenied ? '설정 경로' : '권한이 필요한 이유'}
              </div>
              {isDenied ? (
                <>
                  시스템 설정 → 개인정보 보호 및 보안 → 캘린더
                  → <strong>Bento</strong> 토글을 켜주세요.
                </>
              ) : (
                <>
                  Bento는 macOS 캘린더 앱에 등록된 Google, Exchange,
                  iCloud 등의 일정을 Plan 화면으로 자동으로 가져옵니다.
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {isDenied ? (
                <>
                  <Button onClick={handleOpenSettings}>
                    시스템 설정 열기
                  </Button>
                  <Button ghost onClick={handleRecheck} disabled={busy}>
                    {busy ? '확인 중…' : '허용했어요 — 다시 확인'}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleRequest} disabled={busy}>
                    {busy ? '요청 중…' : '허용하기'}
                  </Button>
                  <Button ghost onClick={handleOpenSettings}>
                    시스템 설정에서 직접 허용
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-mute)',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontFamily: 'inherit',
                  padding: '4px 0',
                  textAlign: 'left',
                }}
              >
                나중에 설정하기
              </button>
            </div>
          </div>

          {/* 우측: macOS 시스템 설정 프리뷰 */}
          <MacosSettingsPreview />
        </div>
      </div>
    </div>
  );
}

function MacosSettingsPreview() {
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--line)',
        background: '#1e1e1e',
        fontSize: 11,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* 타이틀바 */}
      <div
        style={{
          background: '#2a2a2a',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #3a3a3a',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', color: '#aaa', fontSize: 11, fontWeight: 500 }}>
          시스템 설정
        </div>
      </div>

      <div style={{ display: 'flex', height: 240 }}>
        {/* 사이드바 */}
        <div
          style={{
            width: 88,
            background: '#252525',
            borderRight: '1px solid #3a3a3a',
            padding: '10px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {[
            { icon: '🔒', label: '개인정보', active: true },
            { icon: '🔔', label: '알림' },
            { icon: '🎨', label: '모양새' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '5px 8px',
                borderRadius: 5,
                margin: '0 4px',
                background: item.active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: item.active ? '#fff' : '#888',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                fontSize: 14,
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: 9, lineHeight: 1 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
          {/* 상단 경로 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, color: '#888', fontSize: 10.5 }}>
            <span>개인정보 보호 및 보안</span>
            <span style={{ color: '#555' }}>›</span>
            <span style={{ color: '#ccc', fontWeight: 600 }}>캘린더</span>
          </div>

          {/* 캘린더 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🗓</span>
            <span style={{ color: '#eee', fontSize: 13, fontWeight: 600 }}>캘린더</span>
          </div>

          {/* 앱 목록 */}
          <div
            style={{
              background: '#2a2a2a',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #3a3a3a',
            }}
          >
            {[
              { name: '카카오톡', on: false },
              { name: 'Bento', on: false, highlight: true },
              { name: 'Fantastical', on: true },
            ].map((app, i, arr) => (
              <div
                key={app.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: i < arr.length - 1 ? '1px solid #3a3a3a' : 'none',
                  background: app.highlight ? 'rgba(100,180,255,0.12)' : 'transparent',
                  position: 'relative',
                }}
              >
                <AppIcon name={app.name} />
                <span style={{ flex: 1, color: app.highlight ? '#6ab4ff' : '#ccc', fontSize: 11.5, marginLeft: 8, fontWeight: app.highlight ? 600 : 400 }}>
                  {app.name}
                </span>
                <Toggle on={app.on} highlight={app.highlight} />
                {app.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#6ab4ff',
                      color: '#000',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ← 여기를 켜세요
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, color: '#666', fontSize: 10, lineHeight: 1.5 }}>
            앱이 캘린더 데이터에 접근하도록 허용합니다.
          </div>
        </div>
      </div>
    </div>
  );
}

function AppIcon({ name }: { name: string }) {
  const colors: Record<string, string> = {
    '카카오톡': '#FAE100',
    'Bento': '#6ab4ff',
    'Fantastical': '#E05C5C',
  };
  const bg = colors[name] ?? '#555';
  const initial = name.charAt(0);
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: name === '카카오톡' ? '#000' : '#fff',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function Toggle({ on, highlight }: { on: boolean; highlight?: boolean }) {
  const trackBg = on ? '#34c759' : highlight ? '#3a3a3a' : '#3a3a3a';
  return (
    <div
      style={{
        width: 34,
        height: 20,
        borderRadius: 10,
        background: trackBg,
        position: 'relative',
        flexShrink: 0,
        border: highlight && !on ? '1.5px solid #6ab4ff' : '1.5px solid transparent',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(160deg, #4fc3f7 0%, #1565c0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.55,
        flexShrink: 0,
      }}
    >
      🗓
    </div>
  );
}
