export { parseRange, makeContentRange };

type Range =
  { offset: number; length?: number }
| { offset?: number; length: number };

// Parse the range header into the Ranged Reads format expected by R2.
// Returns 'undefined' if the range header is invalid.
//
// There are 3 variations of arguments that can be used in a range:
//
// * An offset with an optional length.
// * An optional offset with a length.
// * A suffix.
//
// https://developers.cloudflare.com/r2/data-access/workers-api/workers-api-reference/#ranged-reads
// https://www.rfc-editor.org/rfc/rfc7233
function parseRange(str: string): R2Range | undefined {
  const rangeRequest = str.split('bytes=')[1] ?? '';
  // Invalid range format or unsupported range unit
  if (rangeRequest === '') {
    return;
  }

  const ranges = rangeRequest.split(',');
  // Multiple ranges are not supported by R2.
  if (ranges.length > 1) {
    return;
  }

  const range = ranges[0].split('-');
  // Invalid range format
  if (range.length !== 2) {
    return;
  }

  const [firstByte, lastByte] = range;

  // Invalid range 'bytes=-'
  if (firstByte === '' && lastByte === '') {
    return;
  }

  // Return the last n bytes from the end
  // bytes=-100
  if (firstByte === '') {
    return { suffix: parseInt(lastByte, 10) };
  }

  // Return the first n bytes from the start
  // bytes=100-
  if (lastByte === ''){
    return { offset: parseInt(firstByte, 10) };
  }

  const offset = parseInt(firstByte, 10);
  const end = parseInt(lastByte, 10);
  if (isNaN(offset) || isNaN(end)) {
    return;
  }

  // Check that the offset is strictly greater than the last byte
  // bytes=200-100 is invalid
  const length = end - offset + 1;
  if (length <= 0) {
    return;
  }

  // Return a range
  // bytes=1-100
  return { offset, length };
}

function makeContentRange(file: R2Object): string {
  const range = file.range as Range;

  if (!range) {
    return '';
  }

  const offset = range.offset ?? 0;
  const length = range.offset ?? 0;
  return `${offset}-${offset + length - 1}/${file.size}`;
}
