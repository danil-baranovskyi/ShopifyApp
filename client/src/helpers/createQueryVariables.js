import {SORT_OPTIONS} from "../components/ShowProducts/ShowProducts";

const createQueryVariables = (
  {
    search = null,
    after = null,
    before = null,
    limit = 5,
    sort = null,
    reverse = null
  } = {}) => {
  let variables = {};

  if (before) {
    variables.before = before;
    variables.last = limit;
  } else {
    variables.after = after;
    variables.first = limit;
  }

  if (search) {
    variables.search = search;
  }

  if (sort) {
    const option = SORT_OPTIONS.find((option) => option.value === sort);

    if (option) {
      variables = {...variables, ...option.query};
    }
  }

  if (reverse) {
    variables.reverse = reverse;
  }

  return variables;
}

export default createQueryVariables;
