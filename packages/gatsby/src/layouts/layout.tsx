import React, { useEffect } from 'react';
import { withPrefix } from 'gatsby';
import Header from '../components/Header';
import PageLoading from '../components/PageLoading';
import styles from './layout.module.less';

interface LayoutProps {
  children: React.ReactElement<any>;
  location: Location;
  pageContext: any;
}

const Layout: React.FC<LayoutProps> = ({ children, location }) => {
  // https://github.com/gatsbyjs/gatsby/issues/13867#issuecomment-489481343
  if (location.pathname.includes('offline-plugin-app-shell-fallback')) {
    return <PageLoading />;
  }

  try {
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
  return (
    <>
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.org">gatsbyjs</a>
      </footer>
    </>
  );
};

export default Layout;
