
import shuffle from '../../server/shuffle.js';
import { fn } from './helper-main.js';

describe(fn(import.meta.url), () => {

  const arrLength = 10;
  const arr = {};
  for (let i = 1; i <= arrLength; i++) {
    arr['k' + i] = i - 1;
  }
  const iter = 1000;

  it('should get all randomly', () => {
    const res = {};
    for (const k of Object.keys(arr)) {
      res[k] = 0;
    }

    for (let i = 0; i < iter; i++) {
      const arr2 = { ...arr };
      const arr3 = shuffle(arr2);
      const k = arr3.shift();
      res[k]++;
    }
    console.log('shuffle result:', res);

    expect(res['k1']).toBe(0);
    expect(res['k10']).toBeGreaterThan(100); // 1 of 10th => should be that!
  });
});
