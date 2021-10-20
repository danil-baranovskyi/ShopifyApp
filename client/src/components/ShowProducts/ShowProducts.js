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
  Frame, Loading
} from "@shopify/polaris";
import {gql} from "graphql-tag";
import {useLazyQuery, useMutation, useQuery} from "react-apollo";
import {useMemoizedQuery} from "../../hooks/useMemoizedQuery";
import pick from "lodash/pick"
import debounce from "lodash/debounce";
import createQueryVariables from "../../helpers/createQueryVariables.js"
import {useHistory, withRouter} from "react-router-dom";

const GET_PRODUCTS = gql`
  query getProduct($first: Int, $last: Int, $after: String, $before: String, $search: String){
    products(first: $first, after: $after, last: $last, before: $before, query: $search){
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          title
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

const ShowProducts = () => {
  const router = useHistory();
  console.log(router)
  console.log("showproducts" + router)
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortValue, setSortValue] = useState('DATE_MODIFIED_DESC');
  const [taggedWith, setTaggedWith] = useState('VIP');
  // const [search, setSearch] = useState(null);
  // const [search, setSearch] = useState(router.query.search || null);

  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    [],
  );

  const handleTaggedWithRemove = useCallback(() => setTaggedWith(null), []);

  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [ handleTaggedWithRemove]);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const promotedBulkActions = [
    {
      content: 'Edit customers',
      onAction: () => console.log('Todo: implement bulk edit'),
    },
  ];

  const bulkActions = [
    {
      content: 'Add tags',
      onAction: () => console.log('Todo: implement bulk add tags'),
    },
    {
      content: 'Remove tags',
      onAction: () => console.log('Todo: implement bulk remove tags'),
    },
    {
      content: 'Delete customers',
      onAction: async () => {
        await Promise.all(selectedItems.map(async (el) => {
          await deleteProduct({
            variables: {
              id: el
            }
          })
          await console.log("deleted")
        }))
        await getProducts({
          variables: createQueryVariables()
        })
        await setSelectedItems([])
        router.push({query: {}})
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

  const [getProducts, {data, loading}] = useMemoizedQuery(GET_PRODUCTS);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);


  const handleQueryValueRemove = useCallback(() => {
    router.push({query: {}});
    // setSearch(null);
    const {after = null, before = null, search = null} = {};
    // const {after = null, before = null, search = null} = router.query;

    handleLoadProduct(
      createQueryVariables({after, before, search})
    )
  }, []);



  const handleLoadProduct = useCallback((params) => {
    params = {

      ...params
    }
    console.log(params)
    getProducts({variables: createQueryVariables(params)});

    router.push({query: pick(params, ["after", "before", "search"])})
  }, [getProducts, data]);

  const debouncedFetchData = useCallback(debounce((query) => {
    handleLoadProduct(query.variables);
    router.push({query: {
        search: query.variables.search
      }})
  }, 1000), [getProducts, handleLoadProduct]);

  const handleQueryValueChange = useCallback(
    (value) => {
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
    const {after = null, before = null, search = null} = {};

    getProducts({
      variables: createQueryVariables({after, before, search})
    })
  }, []);

  const filterControl = (
    <Filters
      queryValue={"jjajaja"}
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
            sortOptions={[
              {label: 'Newest update', value: 'DATE_MODIFIED_DESC'},
              {label: 'Oldest update', value: 'DATE_MODIFIED_ASC'},
            ]}
            onSortChange={(selected) => {
              setSortValue(selected);
              console.log(`Sort option changed to ${selected}.`);
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
