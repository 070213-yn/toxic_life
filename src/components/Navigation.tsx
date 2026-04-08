'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import AvatarUpload from '@/components/AvatarUpload'
import SettingsPanel from '@/components/SettingsPanel'

// アバター表示ヘルパー
function AvatarDisplay({ avatar, size = 40 }: { avatar: string | null; size?: number }) {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
  return (
    <div
      className="rounded-full bg-primary-light/50 flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {isImage ? (
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>{avatar || '😊'}</span>
      )}
    </div>
  )
}

// ナビゲーションのタブ定義
const tabs = [
  {
    label: 'ホーム',
    href: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: '貯金',
    href: '/savings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
  },
  {
    label: 'クエスト',
    href: '/quests',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: '買い物',
    href: '/shopping',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    label: '料理',
    href: '/cooking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    label: '下見',
    href: '/scouting',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'マップ',
    href: '/map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: '履歴',
    href: '/activity',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: '物件ヒント',
    href: '/tips',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21h6m-3-3v3m-4-8a4 4 0 1 1 8 0c0 1.5-.8 2.5-2 3.5-.4.3-.7.7-.9 1.1H11c-.2-.4-.5-.8-.9-1.1C8.8 15.5 8 14.5 8 13z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // ユーザー名編集の状態管理
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // ユーザー名編集を開始
  const startEditingName = useCallback(() => {
    setEditName(profile?.display_name ?? '')
    setIsEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [profile?.display_name])

  // ユーザー名を保存
  const saveDisplayName = useCallback(async () => {
    if (!editName.trim() || !profile) return
    setIsSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: editName.trim() })
      .eq('id', profile.id)
    setIsSavingName(false)
    if (error) {
      alert('名前の保存に失敗しました: ' + error.message)
      return
    }
    setIsEditingName(false)
    window.location.reload()
  }, [editName, profile])

  // Enter で保存、Escape でキャンセル
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      saveDisplayName()
    }
    if (e.key === 'Escape') {
      setIsEditingName(false)
    }
  }, [saveDisplayName])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* モバイル: 画面下部の固定フッタータブ（主要5タブ + その他） */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-card/95 backdrop-blur-md border-t border-primary-light/50 safe-area-bottom">
        <div className="flex justify-around items-center h-14 px-1">
          {tabs.slice(0, 5).map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 ${
                  active ? 'text-primary' : 'text-text-sub'
                }`}
              >
                <span className="w-5 h-5">{tab.icon}</span>
                <span className={`text-[9px] leading-tight mt-0.5 ${active ? 'font-medium' : ''}`}>{tab.label}</span>
              </Link>
            )
          })}
          {/* その他メニュー */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 ${
              showMobileMenu || tabs.slice(5).some((t) => isActive(t.href)) ? 'text-primary' : 'text-text-sub'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
            <span className="text-[9px] leading-tight mt-0.5">その他</span>
          </button>
        </div>
      </nav>

      {/* モバイル: その他メニュー（スライドアップ） */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute bottom-14 left-0 right-0 bg-bg-card/95 backdrop-blur-md border-t border-primary-light/30 rounded-t-2xl shadow-lg safe-area-bottom" style={{ animation: 'fade-slide-up 0.2s ease-out' }}>
            <div className="p-3 space-y-1">
              {/* 残りのタブ */}
              {tabs.slice(5).map((tab) => {
                const active = isActive(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active ? 'bg-primary-light/40 text-primary font-medium' : 'text-text-sub hover:bg-primary-light/20'
                    }`}
                  >
                    <span className="w-5 h-5">{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </Link>
                )
              })}

              <div className="border-t border-primary-light/20 my-1.5" />

              {/* プロフィール */}
              {profile && (
                <div className="flex items-center gap-3 px-3 py-2">
                  <button onClick={() => { setShowMobileMenu(false); setShowAvatarUpload(true) }} className="shrink-0">
                    <AvatarDisplay avatar={profile.avatar_emoji} size={32} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{profile.display_name}</p>
                    <p className="text-[10px] text-text-sub">タップでアイコン変更</p>
                  </div>
                </div>
              )}

              {/* 設定 */}
              <button
                onClick={() => { setShowMobileMenu(false); setShowSettings(true) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-sub hover:bg-primary-light/20 w-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <span className="text-sm">設定</span>
              </button>

              {/* ログアウト */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-sub hover:text-accent hover:bg-accent/10 w-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-sm">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PC: 左サイドバー */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-56 flex-col bg-bg-card border-r border-primary-light/30 shadow-sm">
        {/* ロゴエリア */}
        <div className="px-5 py-6 border-b border-primary-light/30">
          <h1 className="text-xl font-bold text-primary font-[family-name:var(--font-quicksand)]">
            卍Toxic Life卍
          </h1>
        </div>

        {/* ナビゲーションリンク */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary-light/50 text-primary font-medium'
                    : 'text-text-sub hover:bg-primary-light/20 hover:text-primary/80'
                }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ユーザープロフィール */}
        {profile && (
          <div className="px-3 py-4 border-t border-primary-light/30">
            <div className="flex items-center gap-3 px-2">
              {/* アバターアイコン（クリックで画像アップロード） */}
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                title="アイコンを変更"
              >
                <AvatarDisplay avatar={profile.avatar_emoji} size={40} />
              </button>

              {/* 名前（インライン編集対応） */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      maxLength={20}
                      disabled={isSavingName}
                      className="w-full px-1.5 py-0.5 text-sm rounded-md border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <button
                      onClick={saveDisplayName}
                      disabled={isSavingName || !editName.trim()}
                      className="shrink-0 p-0.5 text-primary hover:text-primary/80 disabled:opacity-40"
                      title="保存"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                      className="shrink-0 p-0.5 text-text-sub hover:text-text disabled:opacity-40"
                      title="キャンセル"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-text truncate">
                      {profile.display_name}
                    </p>
                    {/* 編集ボタン（鉛筆アイコン） */}
                    <button
                      onClick={startEditingName}
                      className="shrink-0 p-0.5 text-text-sub/40 hover:text-primary transition-colors"
                      title="名前を変更"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-text-sub">ログイン中</p>
              </div>
            </div>

            {/* 設定ボタン */}
            <button
              onClick={() => setShowSettings(true)}
              className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-sub hover:text-primary hover:bg-primary-light/20 transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              設定
            </button>

            {/* ログアウトボタン */}
            <button
              onClick={handleLogout}
              className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs text-text-sub hover:text-accent hover:bg-accent/10 transition-colors text-left"
            >
              ログアウト
            </button>
          </div>
        )}

        {/* アバターアップロードモーダル */}
        {showAvatarUpload && profile && (
          <AvatarUpload
            userId={profile.id}
            currentAvatar={profile.avatar_emoji}
            onComplete={() => {
              setShowAvatarUpload(false)
              window.location.reload()
            }}
            onCancel={() => setShowAvatarUpload(false)}
          />
        )}

        {/* 設定パネルモーダル */}
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </aside>
    </>
  )
}
