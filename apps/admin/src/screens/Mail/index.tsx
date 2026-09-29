import { useRef, useState } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import { AccountsRail } from './AccountsRail';
import { MailList } from './MailList';
import { MailDetail } from './MailDetail';

type Filter = 'all' | 'unread' | 'flagged';

export function Mail() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [effectiveFolder, setEffectiveFolder] = useState<string | null>(null);
  const [effectiveAccountId, setEffectiveAccountId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [railRefreshKey] = useState(0);
  const [msgPatch, setMsgPatch] = useState<{ uid: number; folder: string; accountId: string; changes: { seen?: boolean; flagged?: boolean } } | null>(null);
  const [removedUid, setRemovedUid] = useState<number | null>(null);
  const [unreadDelta, setUnreadDelta] = useState<{ accountId: string; folder: string; delta: number; _seq: number } | null>(null);
  const lastFolderPerAccount = useRef<Record<string, string>>({});

  const handleSelectAccount = (id: string | null) => {
    setSelectedAccountId(id);
    const remembered = id && id !== '__all__' ? (lastFolderPerAccount.current[id] ?? null) : null;
    setSelectedFolder(remembered);
    setSelectedUid(null);
    setEffectiveFolder(null);
    setEffectiveAccountId(null);
  };

  const handleSelectFolder = (folder: string | null) => {
    setSelectedFolder(folder);
    if (selectedAccountId && selectedAccountId !== '__all__' && folder) {
      lastFolderPerAccount.current[selectedAccountId] = folder;
    }
    setSelectedUid(null);
    setEffectiveFolder(null);
    setEffectiveAccountId(null);
  };

  const handleSelectMessage = (uid: number, folder?: string, accountId?: string) => {
    setSelectedUid(uid);
    setEffectiveFolder(folder ?? null);
    setEffectiveAccountId(accountId ?? null);
  };

  const handlePatch = (uid: number, changes: { seen?: boolean; flagged?: boolean }, folder: string, accountId: string) => {
    setMsgPatch({ uid, folder, accountId, changes });
  };

  const handleDeleted = (uid: number) => {
    setSelectedUid(null);
    setRemovedUid(uid);
  };

  const handleUnreadDelta = (accountId: string, folder: string, delta: number) => {
    setUnreadDelta({ accountId, folder, delta, _seq: Date.now() });
    if (delta !== 0) {
      window.dispatchEvent(new CustomEvent('bento:mail-unread-delta', { detail: { delta } }));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <AccountsRail
        selectedAccountId={selectedAccountId}
        onSelectAccount={handleSelectAccount}
        selectedFolder={selectedFolder}
        onSelectFolder={handleSelectFolder}
        refreshKey={railRefreshKey}
        unreadDelta={unreadDelta}
      />

      <MailList
        accountId={selectedAccountId}
        folder={selectedFolder}
        filter={filter}
        onFilterChange={setFilter}
        selectedUid={selectedUid}
        onSelect={handleSelectMessage}
        patch={msgPatch}
        removedUid={removedUid}
        onUnreadDelta={handleUnreadDelta}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {selectedUid &&
        (effectiveAccountId ?? selectedAccountId) &&
        (effectiveFolder ?? selectedFolder) ? (
          <MailDetail
            key={`${effectiveAccountId ?? selectedAccountId}:${effectiveFolder ?? selectedFolder}:${selectedUid}`}
            accountId={(effectiveAccountId ?? selectedAccountId)!}
            folder={(effectiveFolder ?? selectedFolder)!}
            uid={selectedUid}
            onDeleted={handleDeleted}
            onPatch={handlePatch}
            onUnreadDelta={handleUnreadDelta}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--ink-mute)',
            }}
          >
            <span style={{ fontSize: 32, fontFamily: 'var(--font-mono)' }}>✉</span>
            <Mono style={{ fontSize: 12 }}>
              {!selectedAccountId
                ? '계정을 선택하세요'
                : selectedAccountId !== '__all__' && !selectedFolder
                  ? '폴더를 선택하세요'
                  : '메일을 선택하세요'}
            </Mono>
          </div>
        )}
      </div>
    </div>
  );
}
