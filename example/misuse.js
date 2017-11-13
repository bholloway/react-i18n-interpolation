import React from 'react';
import PropTypes from 'prop-types';

/**
 * The user of ngettext forgets to invoke the function before using the template literal.
 * DO NOT DO THIS!
 */
export const IncorrectUse = ({ngettext, num}) => (
  <span>
    {ngettext`We forgot to invoke ngettext() function|with the quantity of ${{num}}`}
  </span>
);
IncorrectUse.propTypes = {
  ngettext: PropTypes.func.isRequired,
  num: PropTypes.number.isRequired
};

/**
 * The user of ngettext remembers to invoke the function before using the template literal.
 */
export const CorrectUse = ({ngettext, num}) => (
  <span>
    {ngettext(num)`We remembered to invoke ngettext() function|with the quantity of ${{num}}`}
  </span>
);
CorrectUse.propTypes = {
  ngettext: PropTypes.func.isRequired,
  num: PropTypes.number.isRequired
};
