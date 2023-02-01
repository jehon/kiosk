'use strict';

// import secureRandom from 'secure-random-uniform';

/**
 * @param {object} weightedList with weight
 * @returns {any} taken in random
 */
function takeOne(weightedList) {

  const sum = Object.values(weightedList).reduce((n, i) => n + i, 0);

  if (sum == 0) {
    return Object.keys(weightedList).pop();
  }

  const r = Math.random() * sum;
  // const r = secureRandom(sum);

  let s = 0;
  for (const k of Object.keys(weightedList)) {
    s += weightedList[k];
    if (r < s) {
      return k;
    }
  }

  return Object.keys(weightedList).pop();
}


/**
 * @param {object} weightedList with weight
 * @returns {Array} weighted (top priority first => .shift())
 */
export default function shuffle(weightedList) {
  const keys = Object.keys(weightedList);

  const res = [];
  const N = keys.length;
  for (var i = 0; i < N; i++) {
    const k = takeOne(weightedList);
    delete weightedList[k];
    res.push(k);
  }

  return res;
}


/**
 * @param {Array} arr to be shuffled
 * @returns {Array} not wiehgted
 */
export function shuffleArray(arr) {
  return shuffle(
    arr.reduce((acc, v) => { acc[v] = 1; return acc; }, {})
  );
}
