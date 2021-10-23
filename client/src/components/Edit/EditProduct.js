import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams, withRouter} from "react-router";
import {
  Card,
  TextField,
  Stack,
  ContextualSaveBar,
  Frame,
  Button,
  Loading,
  Page
} from "@shopify/polaris"
import gql from "graphql-tag";
import {useMutation, useQuery} from "react-apollo";
import {useMemoizedQuery} from "../../hooks/useMemoizedQuery";
import isEqual from "lodash/isEqual";

const GET_PRODUCT = gql`
  query getProduct($id: ID!){
    product(id: $id){
      title
      priceRangeV2 {
        maxVariantPrice {
          amount
        }
      }
    }
  }
`
// , variants : {price: $price}
const UPDATE_PRODUCT = gql`
    mutation MyMutation($id: ID!, $title: String, $price: Money) {
      productUpdate(input: {id: $id, title: $title, variants: {price: $price}}){
        product {
          title
        }
      }
  }
`

const EditProduct = ({match: {params}, history}) => {
  const [productData, setProductData] = useState(null)
  const [getProduct, {data, loading}] = useMemoizedQuery(GET_PRODUCT)
  const [updateProduct, {updatedData, loading: updateLoading}] = useMutation(UPDATE_PRODUCT)
  const [hasChanges, setHasChanges] = useState(false);

  const handleGoBack = useCallback(() => {
    history.push("/products")
  }, [])

  const handleUpdateProduct = useCallback(() => {
    updateProduct({
      variables: {
        id: "gid://shopify/Product/" + params.id,
        title: productData.title,
        price: productData.priceRangeV2.maxVariantPrice.amount
      }
    }).then(() => {
      setHasChanges(false)
    })
  }, [updateProduct, productData])

  const handleTitle = useCallback((newValue) => {
    setHasChanges(true)
    setProductData((state) => {
        return {
          ...state,
          title: newValue
        };
      }
    )
    setHasChanges(!isEqual(data.product, {...productData, title: newValue}))
  }, [productData, data]);
  const handlePrice = useCallback((newValue) => {
    setHasChanges(true)

    setProductData((state) => {
        return {
          ...state,
          priceRangeV2: {
            maxVariantPrice: {
              amount: newValue
            }
          }
        };
      }
    )
    setHasChanges(!isEqual(data.product, {...productData, priceRangeV2: {maxVariantPrice: {amount: newValue}}}))
  }, [data, productData]);

  useEffect(() => {
    getProduct({
      variables: {
        id: "gid://shopify/Product/" + params.id
      }
    });

    if (data !== undefined) {
      setProductData({...data.product})
    }
  }, [data]);

  return (
    data && productData
      ?
      <Frame>
        <Page
          breadcrumbs={[{content: 'Products', onAction: () => history.push('/products')}]}
          title="Edit"
          primaryAction={{
            content: "Go to Products",
            onAction: handleGoBack

          }}>
          <Card title="Product Edit" sectioned>
            {(hasChanges || updateLoading) &&
            <ContextualSaveBar
              message="Unsaved changes"
              saveAction={{
                onAction: handleUpdateProduct,
                loading: updateLoading,
                disabled: false,
              }}
              discardAction={{
                onAction: () => {
                  setHasChanges(false)
                },
              }}
            />}
            <Stack>
              <TextField
                label="Title"
                value={productData.title}
                onChange={handleTitle}
                autoComplete="off"
              />
              <TextField
                label="Price"
                value={productData.priceRangeV2.maxVariantPrice.amount}
                onChange={handlePrice}
                autoComplete="off"
                type="number"
              />
            </Stack>
          </Card>
        </Page>
      </Frame>
      :
      <Frame>
        <Loading/>
      </Frame>
  )
    ;
};

export default withRouter(EditProduct);
