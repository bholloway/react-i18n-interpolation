export const getTemplate = (strings, tokens) => {
  const [names, values] = tokens
    .reduce(([n, v], {name, value}) => (
      [[...n, name], [...v, value]]
    ), [[], []]);

  const msgid = strings
    .map((v, i) => ((i < names.length) ? `${v}${names[i]}` : v))
    .join('')
    .replace(/\s{2,}/g, ' ');

  return {names, values, msgid};
};


export const makeSubstitutions = ({msgstr, names, values}) => {
  const substituted = names
    .reduce((reduced, name, i) => {
      const completed = reduced.slice(0, -1);
      const split = reduced[reduced.length - 1].split(name);
      const unsplit = split.slice(1).join(name);
      return [...completed, split[0], i, unsplit];
    }, [msgstr])
    .map((v, i) => ((i % 2) ? values[(i - 1) / 2] : v))
    .filter(v => (typeof v !== 'string') || v.length);

  const isText = substituted
    .every(v => (typeof v === 'string'));

  return {substituted, isText};
};
