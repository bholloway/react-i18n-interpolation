
export const calculateDelimiters = delimiter => ({strings, msgstr, names, values}) => {
  // untranslated
  const delimIndices = strings
    .reduce((reduced, v, i) => {
      const count = v.split(delimiter).length - 1;
      return reduced.concat((new Array(count)).fill(i));
    }, []);
  const lengthUntranslated = delimIndices.length + 1;

  // translated
  const splitTranslated = msgstr.split(delimiter);
  const lengthTranslated = splitTranslated.length;

  // collate by delimited text
  const groups = splitTranslated
    .map((element, i) => {
      const start = ((i - 1) in delimIndices) ? delimIndices[i - 1] : 0;
      const end = (i in delimIndices) ? delimIndices[i] : Number.MAX_SAFE_INTEGER;
      return {
        msgid: element,
        names: names.slice(start, end),
        values: values.slice(start, end)
      };
    });

  return {lengthUntranslated, lengthTranslated, groups};
};


export const defaultNgettext = (singular, plural, quantity) =>
  ((typeof quantity !== 'number') || isNaN(quantity) || (quantity === 1) ? singular : plural);


export const defaultSplitPlural = msgid =>
  msgid.split('|');


export const assertPluralForms = (expected, actual, message) => {
  if (!isNaN(expected) && (expected > 0) && (actual !== expected)) {
    throw new Error(`${message}: expected ${expected} plural forms, saw ${actual}`);
  }
};
