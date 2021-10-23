import last from "lodash/last";

export const getIdFromGid = (gid) => {
  return last(gid.split("/"));
}
