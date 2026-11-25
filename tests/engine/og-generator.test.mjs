import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_COLORS,
  PRESET_ICONS,
  RATIO_DIMENSIONS,
} from '../../app/og-generator/constants.ts';

test('PRESET_COLORS：所有預設主題皆包含完整亮暗漸層與強調色 Hex 色碼', () => {
  const hexRe = /^#[0-9a-fA-F]{6}$/;
  assert.ok(PRESET_COLORS.length >= 6);
  const ids = new Set();
  for (const preset of PRESET_COLORS) {
    assert.ok(!ids.has(preset.id), `重複的 preset id: ${preset.id}`);
    ids.add(preset.id);
    assert.ok(preset.name.length > 0 && preset.nameZh.length > 0);
    assert.match(preset.color1, hexRe);
    assert.match(preset.color2, hexRe);
    assert.match(preset.lightColor1, hexRe);
    assert.match(preset.lightColor2, hexRe);
    assert.match(preset.accent, hexRe);
  }
});

test('PRESET_ICONS：每組向量圖示具備唯一 id 與非空 SVG path', () => {
  assert.ok(PRESET_ICONS.length >= 6);
  const ids = new Set();
  for (const icon of PRESET_ICONS) {
    assert.ok(!ids.has(icon.id));
    ids.add(icon.id);
    assert.ok(icon.path.startsWith('M'), `SVG path 應以 M 開頭: ${icon.id}`);
  }
});

test('RATIO_DIMENSIONS：涵蓋 5 大社群平台標準尺寸且長寬皆為正整數', () => {
  const expectedKeys = ['og', 'twitter', 'square', 'story', 'linkedin'];
  assert.deepEqual(Object.keys(RATIO_DIMENSIONS), expectedKeys);
  assert.equal(RATIO_DIMENSIONS.og.width, 1200);
  assert.equal(RATIO_DIMENSIONS.og.height, 630);
  for (const dim of Object.values(RATIO_DIMENSIONS)) {
    assert.ok(Number.isInteger(dim.width) && dim.width >= 1080);
    assert.ok(Number.isInteger(dim.height) && dim.height >= 627);
  }
});
