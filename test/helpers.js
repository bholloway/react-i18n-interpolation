import path from 'path';

export const times = minimum => ({
  times: minimum * (parseInt(process.env.TIMES, 10) || 1.0)
});

export const safeIsNaN = v =>
  ((typeof v === 'number') && isNaN(v));

export const requireSrc = filename =>
  require(path.join('..', process.env.SRC, filename)); // eslint-disable-line global-require, import/no-dynamic-require
