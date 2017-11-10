import React from 'react';
import PropTypes from 'prop-types';


/**
 * This portion leads to underlying translation
 * 4. msgid  "one more"
 *    msgid_plural "__num__ more"
 */
const More = ({ngettext, num, onClick}) => (
  <a href="" onClick={onClick}>{ngettext(num)`one more|${{num}} more`}</a>
);
More.propTypes = {
  ngettext: PropTypes.func.isRequired,
  num: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};


/**
 * This portion leads to underlying translation
 * 5. msgid  "one less"
 *    msgid_plural "__num__ less"
 */
const Less = ({ngettext, num, onClick}) => (
  <a href="" onClick={onClick}>{ngettext(num)`one less|${{num}} less`}</a>
);
Less.propTypes = {
  ngettext: PropTypes.func.isRequired,
  num: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};


/**
 * Pagination control for progressively expanding to more items or then contract to fewer.
 *
 * This example has 5 underlying translations
 * 1. msgid  "Show __numMoreItems__ or __numLessItems__"
 * 2. msgid  "Show __numMoreItems__"
 * 3. msgid  "Show __numLessItems__"
 * 4. msgid  "one more"
 *    msgid_plural "__num__ more"
 * 5. msgid  "one less"
 *    msgid_plural "__num__ less"
 */
export const PaginationControl = ({
  gettext, ngettext, currentSize, totalSize, pageSize, minSize, onMore, onLess
}) => {
  const numMore = Math.min(totalSize - currentSize, pageSize);
  const numLess = Math.max(0, Math.min(currentSize - (minSize || pageSize), pageSize));

  switch (true) {
    case (numMore > 0) && (numLess > 0):
      return (<div>{
        gettext`Show ${{
          numMoreItems: <More num={numMore} onClick={onMore} {...{ngettext}} />
        }} or ${{
          numLessItems: <Less num={numLess} onClick={onLess} {...{ngettext}} />
        }}`
      }</div>);

    case (numMore > 0):
      return (<div>{
        gettext`Show ${{
          numMoreItems: <More num={numMore} onClick={onMore} {...{ngettext}} />
        }}`
      }</div>);

    case (numLess > 0):
      return (<div>{
        gettext`Show ${{
          numLessItems: <Less num={numLess} onClick={onLess} {...{ngettext}} />
        }}`
      }</div>);

    default:
      return null;
  }
};
PaginationControl.propTypes = {
  gettext: PropTypes.func.isRequired,
  ngettext: PropTypes.func.isRequired,
  currentSize: PropTypes.number,
  totalSize: PropTypes.number,
  pageSize: PropTypes.number.isRequired,
  minSize: PropTypes.number,
  onMore: PropTypes.func,
  onLess: PropTypes.func
};
PaginationControl.defaultProps = {
  currentSize: NaN,
  totalSize: NaN,
  minSize: NaN,
  onMore: () => {},
  onLess: () => {}
};
