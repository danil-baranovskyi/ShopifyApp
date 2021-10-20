import React from "react";
import {RoutePropagator as AppBridgeRoutePropagator} from "@shopify/app-bridge-react";
import {withRouter} from "react-router-dom";

const RoutePropagator = ({router}) => {
  console.log("PROPAGATOR" + router)
  return (
    <AppBridgeRoutePropagator location={router}/>
  )
}

export default withRouter(RoutePropagator);
