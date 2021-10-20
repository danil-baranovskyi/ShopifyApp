const createQueryVariables = ({search = null, after= null, before = null, limit = 5} = {}) => {
  const variables = {};

  if (before) {
    variables.before = before;
    variables.last = limit;
  } else {
    variables.after = after;
    variables.first = limit;
  }

  if (search) {
    variables.search = search;
    console.log("we have search")
  }

  return variables;
}

export default createQueryVariables;
