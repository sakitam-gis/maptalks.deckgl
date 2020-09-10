import React, { useEffect } from 'react';
import { useStaticQuery, graphql, withPrefix } from 'gatsby';
import Seo from '../components/Seo';
import Header from '../components/Header';
import PageLoading from '../components/PageLoading';
import styles from './layout.module.less';

interface LayoutProps {
  children: React.ReactElement<any>;
  location: Location;
  pageContext: any;
}

function parseNulltoUndefined<T>(value: T) {
  if (value === null) {
    return undefined;
  }
  return value;
}

const Layout: React.FC<LayoutProps> = ({ children, location }) => {
  // https://github.com/gatsbyjs/gatsby/issues/13867#issuecomment-489481343
  if (location.pathname.includes('offline-plugin-app-shell-fallback')) {
    return <PageLoading />;
  }
  const query = graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `;
  const { site, locales } = useStaticQuery(query);
  const {
    siteMetadata: {
      title,
      logoUrl = '',
    },
  } = site;

  let resources = {};
  try {
    resources = JSON.parse(locales.internal.content);
  } catch (e) {
    // empty
  }
  const pathPrefix = withPrefix('/').replace(/\/$/, '');
  const path = location.pathname.replace(pathPrefix, '');

  useEffect(() => {
    console.log(path);
  }, []);

  if (
    location.pathname === pathPrefix ||
    (children && children.type && (children as any).type.noLayout)
  ) {
    return children;
  }

  const logoProps = logoUrl
    ? {
      logo: {
        img: <img src={logoUrl} alt="logo" />,
      },
    }
    : {};

  return (
    <>
      <Seo
        title={title}
      />
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.org">sakitam-gis</a>
      </footer>
    </>
  );
};

export default Layout;
