import React from 'react';
import PropTypes from 'prop-types';

/**
 * Heading with selective semantics or formatting.
 *
 * This example has 2 underlying translations
 * 1. msgid  "This has some __important__ text"
 * 2. msgid  "important"
 */
export const StrongText = ({gettext}) => (
  <h1>
    {gettext`This heading has some ${{important: <strong>{gettext`important`}</strong>}} text`}
  </h1>
);
StrongText.propTypes = {
  gettext: PropTypes.func.isRequired
};

/**
 * Paragraph with a link in it.
 *
 * This example has 2 underlying translations
 * 1. msgid  "Click __link__"
 * 2. msgid  "here"
 */
export const AnchorText = ({gettext}) => (
  <p>
    {gettext`Click ${{link: <a href="http://google.com">{gettext`here`}</a>}}`}
  </p>
);
AnchorText.propTypes = {
  gettext: PropTypes.func.isRequired
};
