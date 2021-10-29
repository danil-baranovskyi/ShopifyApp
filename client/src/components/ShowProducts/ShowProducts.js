import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Card,
  ResourceList,
  Thumbnail,
  Stack,
  TextStyle,
  Pagination,
  ResourceItem,
  Avatar,
  TextField,
  Button,
  Filters,
  Frame,
  Loading,
  Page
} from "@shopify/polaris";
import {gql} from "graphql-tag";
import {useLazyQuery, useMutation, useQuery} from "react-apollo";
import {useMemoizedQuery} from "../../hooks/useMemoizedQuery";
import pick from "lodash/pick"
import pickBy from "lodash/pickBy"
import debounce from "lodash/debounce";
import createQueryVariables from "../../helpers/createQueryVariables.js"
import {useParams, withRouter} from "react-router";
import qs from "query-string";
import isNull from "lodash/isNull";
import omitBy from "lodash/omitBy";
import {getIdFromGid} from "../../helpers/getIdfromGid";
import {getSortOptions} from "../../helpers/getSortOptions";

const GET_PRODUCTS = gql`
  query getProducts(
    $first: Int,
    $last: Int,
    $after: String,
    $before: String,
    $search: String,
    $sortKey: ProductSortKeys,
    $reverse: Boolean
  ){
    products(
      first: $first,
      after: $after,
      last: $last,
      before: $before,
      query: $search,
      sortKey: $sortKey
      reverse: $reverse
    ){
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          title
          createdAt
          updatedAt
          priceRange {
            maxVariantPrice {
              amount
            }
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`

const DELETE_PRODUCT = gql`
  mutation productDelete($id: ID!){
      productDelete(input: {id: $id}) {
        userErrors {
          message
        }
      }
  }
`

export const SORT_OPTIONS = [
  {
    label: 'Product Title A-Z',
    value: "title",
    query: {
      reverse: false,
      sortKey: 'TITLE'
    }
  },
  {
    label: 'Product Title Z-A',
    value: "titleReversed",
    query: {
      reverse: true,
      sortKey: 'TITLE'
    }
  },
  {
    label: 'Created (oldest first)',
    value: "createdOldest",
    query: {
      reverse: false,
      sortKey: 'CREATED_AT'
    }
  },
  {
    label: 'Created (newest first)',
    value: "createdNewest",
    query: {
      reverse: true,
      sortKey: 'CREATED_AT'
    }
  },
  {
    label: 'Update (oldest first)',
    value: "updateOldest",
    query: {
      reverse: false,
      sortKey: 'UPDATED_AT'
    }
  },
  {
    label: 'Update (newest first)',
    value: "updateNewest",
    query: {
      reverse: true,
      sortKey: 'UPDATED_AT'
    }
  },
];

const ShowProducts = ({location, history}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortValue, setSortValue] = useState(getSortOptions(pick(qs.parse(location.search).sort), ["value"]) || '');
  const [taggedWith, setTaggedWith] = useState('VIP');
  const [searchValue, setSearch] = useState(null);
  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    [],
  );

  const handleTaggedWithRemove = useCallback(() => setTaggedWith(null), []);

  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [handleTaggedWithRemove]);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const promotedBulkActions = [
    {
      content: 'Edit customers',
      onAction: () => {
        history.push(`/edit/${getIdFromGid(selectedItems[0])}`)
      }
    },
  ];

  const bulkActions = [
    {
      content: 'Delete products',
      onAction: async () => {
        await Promise.all(selectedItems.map(async (el) => {
          await deleteProduct({
            variables: {
              id: el
            }
          })
        }))
        await getProducts({
          variables: createQueryVariables()
        })
        await setSelectedItems([])
        history.push({search: qs.stringify(pick(qs.parse(location.search), ["sort"]))})
      },
    },
  ];

  const filters = [
    {
      key: 'taggedWith3',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = !isEmpty(taggedWith)
    ? [
      {
        key: 'taggedWith3',
        label: disambiguateLabel('taggedWith3', taggedWith),
        onRemove: handleTaggedWithRemove,
      },
    ]
    : [];

  const [getProducts, {data, loading}] = useMemoizedQuery(GET_PRODUCTS, {
    fetchPolicy: "network-only",
  });
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const handleAddProduct = useCallback(() => {
    history.push("/add")
  }, [])

  const handleQueryValueRemove = useCallback(() => {
    const {after = null, before = null, search = null, sort = null} = {};
    handleLoadProduct(
      createQueryVariables({after, before, search})
    )
    setSearch(null);
    history.push({search: ""});
  }, []);

  const handleLoadProduct = useCallback((params) => {
    const {sort = null} = qs.parse(location.search) || {...params};
    params = {
      ...params,
      sort
    }

    setSelectedItems([]);
    getProducts({variables: createQueryVariables(params)});
    history.push({search: qs.stringify(pick(omitBy(params, isNull), ["after", "before", "search", "sort"]))})
  }, [getProducts, data, sortValue]);

  const debouncedFetchData = useCallback(debounce((query) => {
    handleLoadProduct(query.variables);
    history.push({search: query.variables.search})
  }, 1000), [getProducts, handleLoadProduct]);

  const handleSortChange = useCallback((selected) => {
    selected = getSortOptions(selected);
    setSortValue(selected.query.sortKey);
    handleLoadProduct(selected)
    history.push({search: `sort=${selected.value}`})
  }, [])

  const handleQueryValueChange = useCallback(
    (value) => {
      value === '' ? value = null : value;
      setSearch(value)
      debouncedFetchData({
        variables: {
          search: value,
          first: 5
        }
      })
    }, [])

  const handlePrevProducts = useCallback(() => {
    handleLoadProduct(
      createQueryVariables({before: data.products.edges[0].cursor})
    )
  }, [data]);

  const handleNextProducts = useCallback(() => {
    handleLoadProduct(
      createQueryVariables({after: data.products.edges[data.products.edges.length - 1].cursor})
    )
  }, [data]);

  useEffect(() => {
    const {after = null, before = null, search = null, sort = null} = qs.parse(location.search) || {};

    getProducts({
      variables: createQueryVariables({after, before, search, sort})
    })
  }, [sortValue]);

  const filterControl = (
    <Filters
      queryValue={searchValue}
      filters={filters}
      appliedFilters={appliedFilters}
      onQueryChange={handleQueryValueChange}
      onQueryClear={handleQueryValueRemove}
      onClearAll={handleClearAll}
    >
      <div style={{paddingLeft: '8px'}}>
        <Button onClick={() => console.log('New filter saved')}>Save</Button>
      </div>
    </Filters>
  );
  return (
    <Frame>
      {loading && <Loading/>}
      {
        data &&
        <Page title="Products" primaryAction={{
          content: "Add Product",
          onAction: handleAddProduct

        }}>
          <Card>
            <ResourceList
              loading={loading}
              resourceName={resourceName}
              items={data.products.edges}
              idForItem={item => item.node.id}
              renderItem={renderItem}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              promotedBulkActions={promotedBulkActions}
              bulkActions={bulkActions}
              sortValue={sortValue}
              sortOptions={SORT_OPTIONS}
              onSortChange={(selected) => {
                selected = getSortOptions(selected);
                setSortValue(selected.value);
                handleLoadProduct(selected)
                history.push({search: `sort=${selected.value}`})
              }}
              filterControl={filterControl}
            />
            <Pagination
              hasPrevious={data.products.pageInfo.hasPreviousPage}
              onPrevious={handlePrevProducts}
              hasNext={data.products.pageInfo.hasNextPage}
              onNext={handleNextProducts}
            />
          </Card>
        </Page>
      }
    </Frame>
  );

  function renderItem(item) {
    const {id, title} = item.node;
    const media = <Thumbnail alt={""} source={""} customer size="medium" name={title}/>;

    return (
      <ResourceItem
        id={id}
        media={media}
        accessibilityLabel={`View details for ${title}`}
        persistActions
      >
        <h3>
          <TextStyle variation="strong">{title}</TextStyle>
        </h3>
        <div>lslllal</div>
      </ResourceItem>
    );
  }

  function disambiguateLabel(key, value) {
    switch (key) {
      case 'taggedWith3':
        return `Tagged with ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === '' || value == null;
    }
  }
};

export default withRouter(ShowProducts);
