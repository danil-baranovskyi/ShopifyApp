import ApolloClient from "apollo-boost";
import {ApolloProvider} from "react-apollo";
import {
  AppProvider,
  Frame,
  ContextualSaveBar
} from "@shopify/polaris";
import {Provider, useAppBridge} from "@shopify/app-bridge-react";
import {authenticatedFetch} from "@shopify/app-bridge-utils";
import {Redirect} from "@shopify/app-bridge/actions";
import translations from "@shopify/polaris/locales/en.json";
import React from "react";
import ReactDOM from "react-dom"
import "@shopify/polaris/dist/styles.css";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import RoutePropagator from "./components/Routing/RoutePropagator";
import Routes from "./components/Routing/Routes";

function userLoggedInFetch(app) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);
    console.log("RESPONSE")
    console.log(response)
    console.log("RESPONSE")
    if (
      response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
    ) {
      const authUrlHeader = response.headers.get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url"
      );

      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }

    return response;
  };
}


const Index = () => {
  const app = useAppBridge();
  const client = new ApolloClient({
    fetch: userLoggedInFetch(app),
    fetchOptions: {
      credentials: "include",
    },
  });

  return (
    <Router basename="/">
      <ApolloProvider client={client}>
        <AppProvider i18n={{
          ...translations,
          Polaris: {
            Frame: {
              skipToContent: 'Skip to content',
            },
            ContextualSaveBar: {
              save: 'Save',
              discard: 'Discard',
            },
          },
        }}>
          <RoutePropagator/>
          <Routes/>
        </AppProvider>
      </ApolloProvider>
    </Router>
  )
}

export default Index;

ReactDOM.render(
  <Provider
    config={{
      apiKey: "c214e210172e7b984776f132df74873a",
      host: "dGVzdHNob3BjaGlraS5teXNob3BpZnkuY29tL2FkbWlu", // TODO: host from query params
      forceRedirect: true,
    }}
  >
    <Index/>
  </Provider>,
  document.getElementById("root")
);


