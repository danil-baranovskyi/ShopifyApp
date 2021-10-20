import React from 'react';
import ShowProducts from "./ShowProducts/ShowProducts.js";
import {Page} from "@shopify/polaris"

const App = () => {
  return (
    <Page
      title="Invoice"
      subtitle="Statement period: May 3, 2019 to June 2, 2019"
      secondaryActions={[{content: 'Download'}]}
    >
      <ShowProducts/>
    </Page>
  );
};

export default App;
