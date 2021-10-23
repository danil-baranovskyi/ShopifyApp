import {SORT_OPTIONS} from "../components/ShowProducts/ShowProducts";

export const getSortOptions = (sort) => {
  return SORT_OPTIONS.find((option) => option.value === sort);
}
