import React from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import PolarisProvider from "./providers/PolarisProvider.js";
import ApolloProvider from "./providers/ApolloProvider.js";
import "@shopify/polaris/dist/styles.css";
import Routes from "./Routing/Routes";
import RoutePropagator from "./Routing/RoutePropagator";

const App = () => (
  <Router basename={"/"}>
    <PolarisProvider>
      <ApolloProvider>
        <RoutePropagator />
        <Routes/>
      </ApolloProvider>
    </PolarisProvider>
  </Router>
);

export default App;
