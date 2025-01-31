// File: pages/_app.js

import Layout from '../components/Layout';
import '../styles/globals.css'; // ensures .section, .result, etc. are loaded globally

export default function App({ Component, pageProps }) {
  // Wrap every page in <Layout> so the navbar is always present
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
