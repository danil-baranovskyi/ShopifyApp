import ApolloClient from "apollo-boost";
import {ApolloProvider} from "react-apollo";
import {AppProvider} from "@shopify/polaris";
import {Provider, useAppBridge} from "@shopify/app-bridge-react";
import {authenticatedFetch} from "@shopify/app-bridge-utils";
import {Redirect} from "@shopify/app-bridge/actions";
import translations from "@shopify/polaris/locales/en.json";
import React, {useEffect} from "react";
import ReactDOM from "react-dom"
import "@shopify/polaris/dist/styles.css";
import ShowProducts from "./components/ShowProducts/ShowProducts";
import {BrowserRouter as Router} from "react-router-dom";

function userLoggedInFetch(app) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);

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
  useEffect(() => {
    console.log("serfsdfsdffsdfsdfff")
  }, [])
  const app = useAppBridge();
  const client = new ApolloClient({
    fetch: userLoggedInFetch(app),
    fetchOptions: {
      credentials: "include",
    },
  });

  return (
    <Router>
      <ApolloProvider client={client}>
        <AppProvider i18n={translations}>

          <ShowProducts/>
          {/*<RoutePropagator/>*/}
          REACT ROUTER SHOULD BE HERE
          FUCKAgdg
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


