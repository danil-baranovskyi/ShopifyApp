const setQueryParams = (params) => {
  for (let propName in params) {
    if (params[propName] === null || params[propName] === undefined) {
      delete params[propName];
    }
  }
  return params
}

export default setQueryParams;
