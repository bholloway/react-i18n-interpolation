
export const getTemplate = (strings, substitutions) => {
  const keys = substitutions
    .map((v) => {
      const key = v && (typeof v === 'object') && (typeof v.key === 'string') && v.key;
      return key ? `__${key}__` : '____';
    });

  const untranslated = strings
    .map((v, i) => ((i < keys.length) ? `${v}${keys[i]}` : v))
    .join('')
    .replace(/\s{2,}/g, ' ');

  return {keys, untranslated};
};


export const makeSubstitutions = ({text, keys, substitutions}) => {
  const substituted = keys
    .reduce((reduced, key, i) => {
      const completed = reduced.slice(0, -1);
      const split = reduced[reduced.length - 1].split(key);
      const unsplit = split.slice(1).join(key);
      return [...completed, split[0], i, unsplit];
    }, [text])
    .map((v, i) => ((i % 2) ? substitutions[(i - 1) / 2] : v));

  const isText = substituted
    .every(v => (typeof v === 'string'));

  return {substituted, isText};
};
