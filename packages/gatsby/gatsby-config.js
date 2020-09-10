const fs = require('fs');
const path = require('path');

const { name, description, author } = JSON.parse(
  fs.readFileSync(path.resolve(`package.json`), `utf8`),
);

module.exports = {
  siteMetadata: {
    title: `maptalks deckgl demo` || name,
    description: `a maptalks deckgl website` || description,
    author: author,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `rgba(0, 61, 112, 0.6)`,
        theme_color: `rgba(0, 162, 229, 0.95)`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    `gatsby-plugin-typescript`,
    {
      resolve: 'gatsby-plugin-less',
      options: {
        lessOptions: {
          javascriptEnabled: true,
          modifyVars: {
            'primary-color': 'rgba(41,60,85,0.4)',
            'text-color': '#fff',
            'heading-color': '#0D1A26',
            'menu-item-color': '#314659',
            'font-family': `Avenir, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif`,
          },
        },
      },
    },
    {
      resolve: `gatsby-plugin-layout`,
      options: {
        component: require.resolve(`./src/layouts/layout.tsx`),
      },
    },
    {
      resolve: `gatsby-plugin-nprogress`,
      options: {
        // Setting a color is optional.
        color: `linear-gradient(
      -90deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(137, 140, 141, 0) 100%
    )`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `json`,
        path: path.resolve('./src/assets/json'),
        ignore: [`**/.*`],
      },
    },
    {
      resolve: 'gatsby-plugin-copy-files',
      options: {
        source: path.resolve('./src/assets/json'),
        destination: `/json`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `public-images`,
        path: path.resolve('./src/assets/images'),
        ignore: [`**/.*`],
      },
    },
    {
      resolve: 'gatsby-plugin-copy-files',
      options: {
        source: path.resolve('./src/assets/images'),
        destination: `/images`,
      },
    },
  ],
}
