import { parseRange } from '../src/index.js';

// Range Request spec:
// https://www.rfc-editor.org/rfc/rfc7233
//
// API for R2 ranged reads:
// https://developers.cloudflare.com/r2/data-access/workers-api/workers-api-reference/#ranged-reads

const successCases = [
  { testCase: 'bytes=0-', expected: { offset: 0 } },
  { testCase: 'bytes=-100', expected: { suffix: 100 } },
  { testCase: 'bytes=0-99', expected: { offset: 0, length: 100 } },
  { testCase: 'bytes=100-200', expected: { offset: 100, length: 101 } },
];

successCases.map(({ testCase, expected } ) => {
  it(`parses '${testCase}'`, () => {
    expect(parseRange(testCase)).toStrictEqual(expected);
  });
});


const failureCases = [
  '',
  '=',
  'unknown=0-100',
  '1-100',
  'bytes=-',
  'bytes=-1-1',
  'bytes=200-100',
  'bytes=x-100',
  'bytes=100-x',
  'bytes=x-x',
  'bytes=0-99,100-199',
];

failureCases.map((testCase) => {
  it(`fails to parse '${testCase}'`, () => {
    expect(parseRange(testCase)).toBeUndefined();
  });
});

