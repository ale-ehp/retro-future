import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TRON_SOUNDTRACK_FALLBACK_URL,
  TRON_SOUNDTRACK_URL,
  createTronSoundtrackElement,
  resolveTronSoundtrackUrl,
} from './audio.js';

test('soundtrack uses the opus source by default', () => {
  assert.equal(TRON_SOUNDTRACK_URL, 'audio/music/retro-future.opus');
});

test('soundtrack uses m4a fallback when opus cannot play but aac can', () => {
  const audio = {
    canPlayType(type) {
      if (type === 'audio/ogg; codecs="opus"') return '';
      if (type === 'audio/mp4; codecs="mp4a.40.2"') return 'probably';
      return '';
    },
  };

  assert.equal(resolveTronSoundtrackUrl(audio), TRON_SOUNDTRACK_FALLBACK_URL);
});

test('soundtrack element stores the selected url for diagnostics', () => {
  const previousAudio = globalThis.Audio;
  const created = [];
  globalThis.Audio = class AudioStub {
    constructor() {
      this.src = '';
      this.preload = '';
      this.loop = true;
      this.playsInline = false;
      this.duration = 0;
      this.error = null;
      created.push(this);
    }

    canPlayType(type) {
      if (type === 'audio/ogg; codecs="opus"') return '';
      if (type === 'audio/mp4; codecs="mp4a.40.2"') return 'maybe';
      return '';
    }

    addEventListener() {}
  };

  try {
    const soundtrack = {};
    const audio = createTronSoundtrackElement(soundtrack);
    assert.equal(audio, created[0]);
    assert.equal(audio.src, TRON_SOUNDTRACK_FALLBACK_URL);
    assert.equal(soundtrack.url, TRON_SOUNDTRACK_FALLBACK_URL);
  } finally {
    globalThis.Audio = previousAudio;
  }
});
