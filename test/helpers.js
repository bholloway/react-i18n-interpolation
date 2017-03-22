
export const parametric = casesFactory => (assert) => {
  const cases = casesFactory();
  const [expected, actual] = cases
    .reduce((lists, value) => lists.map((list, i) => [
      ...list, value[i]
    ]), [[], []]);
  assert.deepEqual(expected, actual);
};
