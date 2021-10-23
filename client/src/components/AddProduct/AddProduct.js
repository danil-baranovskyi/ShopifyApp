import React, {useCallback, useState} from 'react';
import {Button, Card, ContextualSaveBar, Frame, Stack, TextField} from "@shopify/polaris";
import {useMutation} from "react-apollo";
import gql from "graphql-tag";
import {withRouter} from "react-router";
import {getIdFromGid} from "../../helpers/getIdfromGid";

const ADD_PRODUCT = gql`
  mutation addProduct($title: String!, $price: Money!) {
    productCreate(input: {title: $title, variants: {price: $price}}){
      product {
        id
      }
    }
  }
`

const AddProduct = ({history}) => {
  const [hasChanges, setHasChanges] = useState(true);
  const [newProductData, setNewProductData] = useState({
    title: null,
    price: null
  });

  const [addProduct, {data: addedData, loading: addedLoading}] = useMutation(ADD_PRODUCT)

  const handleTitle = useCallback((newValue) => {
    setHasChanges(false)
    setNewProductData((state) => {
        return {
          ...state,
          title: newValue
        };
      }
    )
  }, []);

  const handlePrice = useCallback((newValue) => {
    setNewProductData((state) => {
        return {
          ...state,
          price: newValue
        };
      }
    )
  }, []);

  const handleAddProduct = useCallback(() => {
    addProduct({
      variables: {...newProductData}
    }).then((res) => {
      history.push(`/edit/${getIdFromGid(res.data.productCreate.product.id)}`)
    })
  }, [newProductData])

  const handleGoBack = useCallback(() => {
    history.push("/products")
  }, [])

  return (
      <Frame>
        <ContextualSaveBar
          message="Unsaved changes"
          saveAction={{
            onAction: handleAddProduct,
            loading: addedLoading,
            disabled: hasChanges,
          }}
          discardAction={{
            onAction: () => {
              setHasChanges(false)
            },
          }}
        />
        <Card title="Product Edit" sectioned>
          <Button onClick={handleGoBack}>Go back</Button>
          <Stack>
            <TextField
              label="Title"
              value={newProductData.title}
              onChange={handleTitle}
              autoComplete="off"
            />
            <TextField
              label="Price"
              value={newProductData.price}
              onChange={handlePrice}
              autoComplete="off"
              type="number"
            />
          </Stack>
        </Card>
      </Frame>
  )
    ;
};

export default withRouter(AddProduct);
