import describe from 'tape-bdd';
import {calculateCollisions} from '../src/token';

describe('token validation', (it) => {
  it('should allow colliding values', assert =>
    assert.deepEqual(
      calculateCollisions([
        {label: 'a', key: 'x', name: '__a__', value: 10},
        {label: 'b', key: 'x', name: '__b__', value: 10},
        {label: 'c', key: 'y', name: '__c__', value: 10},
        {label: 'd', key: 'z', name: '__c__', value: 10},
        {label: 'e', key: 'x', name: '__a__', value: 10},
        {label: 'e', key: 'x', name: '__b__', value: 10},
        {label: 'e', key: 'y', name: '__c__', value: 10},
        {label: 'e', key: 'z', name: '__c__', value: 10}
      ]),
      []
    )
  );

  it('should detect colliding names (same name different value)', assert =>
    assert.deepEqual(
      calculateCollisions([
        {label: 'a', key: 'x', name: '__a__', value: 10},
        {label: 'b', key: 'y', name: '__a__', value: 11},
        {label: 'c', key: 'z', name: '__a__', value: 12}
      ]),
      ['a vs b vs c']
    )
  );

  it('should allow colliding keys (same key different value)', assert =>
    assert.deepEqual(
      calculateCollisions([
        {label: 'a', key: 'x', name: '__a__', value: 10},
        {label: 'b', key: 'x', name: '__b__', value: 11},
        {label: 'c', key: 'x', name: '__c__', value: 12}
      ]),
      []
    )
  );

  it('should allow colliding labels (same label different value)', assert =>
    assert.deepEqual(
      calculateCollisions([
        {label: 'a', key: 'x', name: '__a__', value: 10},
        {label: 'a', key: 'y', name: '__b__', value: 11},
        {label: 'a', key: 'z', name: '__c__', value: 12}
      ]),
      []
    )
  );
});
