
export const calculateDelimiters = ({delimiter, strings, translated, keys, substitutions}) => {
  // untranslated
  const delimIndices = strings
    .reduce((reduced, v, i) => {
      const count = v.split(delimiter).length - 1;
      return reduced.concat((new Array(count)).fill(i));
    }, []);
  const lengthUntranslated = delimIndices.length + 1;

  // translated
  const splitTranslated = translated.split(delimiter);
  const lengthTranslated = splitTranslated.length;

  // collate by delimited text
  const collated = splitTranslated
    .map((text, i) => {
      const start = ((i - 1) in delimIndices) ? delimIndices[i - 1] : 0;
      const end = (i in delimIndices) ? delimIndices[i] : Number.MAX_SAFE_INTEGER;
      return {
        text,
        keys: keys.slice(start, end),
        substitutions: substitutions.slice(start, end)
      };
    });

  return {lengthUntranslated, lengthTranslated, collated};
};
