export const times = minimum => ({
  times: minimum * (parseInt(process.env.TIMES, 10) || 1.0)
});

export const safeIsNaN = v =>
  ((typeof v === 'number') && isNaN(v));
