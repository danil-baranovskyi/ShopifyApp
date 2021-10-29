import React from 'react';
import {Route, Switch} from "react-router-dom";
import ShowProducts from "../ShowProducts/ShowProducts.js";
import Test from "../Test/Test.js";
import EditProduct from "../Edit/EditProduct";
import AddProduct from "../AddProduct/AddProduct";
import Home from "../Home/Home";

const Routes = () => {
  return (
    <Switch>
      <Route exact path="/">
        <Home/>
      </Route>
      <Route path="/products">
        <ShowProducts/>
      </Route>
      <Route path="/edit/:id">
        <EditProduct/>
      </Route>
      <Route path="/add">
        <AddProduct/>
      </Route>
    </Switch>
  );
};

export default Routes;
