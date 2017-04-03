export const parametric = casesFactory => (assert) => {
  const cases = casesFactory() || [];
  const [expected, actual] = cases
    .reduce((lists, value) => lists.map((list, i) => [
      ...list, value[i]
    ]), [[], []]);

  assert.deepEqual(expected, actual);
};


export const pair = list =>
  list
    .map((v1, i, arr) => {
      const j = (i + 1) % arr.length;
      const v2 = arr[j];
      return [v1, v2];
    });


export const permute = additional => list =>
  list
    .reduce((flattened, v) => [...flattened, ...additional.map(x => [...v, x])], []);
