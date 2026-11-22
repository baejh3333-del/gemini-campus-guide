"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PlatformKind = "ios" | "android" | "mac" | "windows";

function detectPlatform(): PlatformKind {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent;
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  if (/Android/i.test(ua)) {
    return "android";
  }
  if (/Mac/i.test(navigator.platform || ua)) {
    return "mac";
  }
  return "windows";
}

function downloadDesktopShortcut(platform: PlatformKind) {
  const url = `${window.location.origin}/`;
  const isMac = platform === "mac";
  const content = isMac
    ? `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${url}</string>\n</dict>\n</plist>\n`
    : `[InternetShortcut]\r\nURL=${url}\r\n`;
  const blob = new Blob([content], { type: "application/octet-stream" });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = isMac ? "AI 프롬프트 저장소.webloc" : "AI 프롬프트 저장소.url";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformKind>("windows");
  const [downloadedFile, setDownloadedFile] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as { standalone?: boolean }).standalone);
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("install-banner-dismissed") === "1";
    } catch {}

    const timer = dismissed
      ? undefined
      : window.setTimeout(() => {
          setBannerVisible(true);
        }, 1200);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setModalOpen(false);
      setBannerVisible(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function dismissBanner() {
    setBannerVisible(false);
    try {
      sessionStorage.setItem("install-banner-dismissed", "1");
    } catch {}
  }

  async function handleInstallClick() {
    dismissBanner();
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    setDownloadedFile(false);
    setModalOpen(true);
  }

  const isMobile = platform === "ios" || platform === "android";

  if (installed) return null;

  return (
    <>
      {bannerVisible && !modalOpen && (
        <aside className="install-banner" role="region" aria-label="앱 바로가기 설치 안내">
          <div className="install-banner-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12m0 0-4-4m4 4 4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </div>

          <div className="install-banner-content">
            <div className="install-banner-text">
              <strong>홈 화면에 바로가기 추가</strong>
              <p>앱처럼 한 번에 열고 바로 프롬프트를 찾으세요.</p>
            </div>
            <div className="install-banner-actions">
              <button
                type="button"
                className="install-banner-cta"
                onClick={handleInstallClick}
              >
                {deferredPrompt ? "바로 설치" : "추가하기"}
              </button>
              <button
                type="button"
                className="install-banner-later"
                onClick={dismissBanner}
              >
                닫기
              </button>
            </div>
          </div>

          <button
            type="button"
            className="install-banner-close"
            onClick={dismissBanner}
            aria-label="설치 안내 닫기"
          >
            ✕
          </button>
        </aside>
      )}

      {modalOpen && (
        <div
          className="skill-guide-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="skill-guide-modal install-guide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="skill-guide-header">
              <div>
                <span className="skill-guide-badge">SHORTCUT &amp; APP INSTALL</span>
                <h3 id="install-guide-title">바로가기 추가 방법</h3>
                <p>
                  홈 화면이나 바탕화면에 저장해 두면 언제든 한 번에 열 수 있어요.
                </p>
              </div>
              <button
                type="button"
                className="skill-guide-close"
                onClick={() => setModalOpen(false)}
                aria-label="바로가기 안내 닫기"
              >
                ✕
              </button>
            </div>

            {!isMobile && (
              <div className="install-shortcut-box">
                <p>
                  아래 버튼으로 바탕화면 바로가기 파일(
                  {platform === "mac" ? ".webloc" : ".url"})을 저장할 수 있어요.
                </p>
                <button
                  type="button"
                  className="skill-download-cta"
                  onClick={() => {
                    downloadDesktopShortcut(platform);
                    setDownloadedFile(true);
                  }}
                >
                  {downloadedFile ? "바로가기 파일 저장됨 ✓" : "바로가기 파일 다운로드 ↓"}
                </button>
              </div>
            )}

            <ol className="skill-guide-steps">
              {platform === "ios" ? (
                <>
                  <li>
                    <span className="step-num">01</span>
                    <div>
                      <strong>하단 공유(□↑) 버튼 누르기</strong>
                      <p>카카오톡·인스타 앱 안이라면 먼저 &apos;Safari로 열기&apos;를 눌러 주세요.</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-num">02</span>
                    <div>
                      <strong>&apos;홈 화면에 추가&apos; 선택</strong>
                      <p>메뉴를 아래로 내려 &apos;홈 화면에 추가&apos; → 오른쪽 위 &apos;추가&apos;를 누르면 완료됩니다.</p>
                    </div>
                  </li>
                </>
              ) : platform === "android" ? (
                <>
                  <li>
                    <span className="step-num">01</span>
                    <div>
                      <strong>브라우저 우측 상단 ⋮ 메뉴 열기</strong>
                      <p>카카오톡·인스타 인앱 브라우저라면 먼저 &apos;다른 브라우저(Chrome)로 열기&apos;를 눌러 주세요.</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-num">02</span>
                    <div>
                      <strong>&apos;앱 설치&apos; 또는 &apos;홈 화면에 추가&apos;</strong>
                      <p>메뉴에서 선택하면 홈 화면에 바로가기 아이콘이 추가됩니다.</p>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <span className="step-num">01</span>
                    <div>
                      <strong>Chrome 주소창 오른쪽 설치 아이콘 클릭</strong>
                      <p>또는 우측 상단 ⋮ → &apos;전송, 저장 및 공유&apos; → &apos;바로가기 만들기&apos;를 누르세요.</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-num">02</span>
                    <div>
                      <strong>다운로드한 바로가기 파일 바탕화면에 두기</strong>
                      <p>더블 클릭만으로 바로 사이트가 열립니다.</p>
                    </div>
                  </li>
                </>
              )}
            </ol>

            <div className="skill-guide-footer">
              <button
                type="button"
                className="skill-close-cta"
                onClick={() => setModalOpen(false)}
              >
                확인했어요
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
