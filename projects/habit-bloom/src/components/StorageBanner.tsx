// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Opt-in storage banner (spec interaction: "LocalStorage opt-in banner giải
// thích dữ liệu chỉ ở thiết bị"). Shown only while consent is unset; either
// choice is one tap, the explanation is honest, and nothing is written
// before the user answers.

interface Props {
  onKeepOnDevice: () => void;
  onSessionOnly: () => void;
}

export function StorageBanner({ onKeepOnDevice, onSessionOnly }: Props) {
  return (
    <aside className="storage-banner" aria-label="Where your garden lives">
      <p className="storage-banner__lead">
        Your garden can stay on this device.
      </p>
      <p className="storage-banner__body">
        Habit Bloom keeps everything in your browser — no account, no cloud,
        nothing sent anywhere. Allow local storage and your leaves survive a
        refresh; choose the session and they stay only until you close the tab.
      </p>
      <div className="storage-banner__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onKeepOnDevice}
        >
          Keep on this device
        </button>
        <button type="button" className="btn" onClick={onSessionOnly}>
          Just this session
        </button>
      </div>
    </aside>
  );
}
