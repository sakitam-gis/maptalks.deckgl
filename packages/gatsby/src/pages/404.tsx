import React from 'react';
import { Link } from 'gatsby';
import SEO from '../components/Seo';

const NotFoundPage = () => (
  <>
    <SEO title="404: Not found" />
    <Link to="/">
      Back Home
    </Link>
  </>
);

export default NotFoundPage;
