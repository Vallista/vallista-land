const profile = require('./config/profile.json')

module.exports = {
  flags: {
    FAST_DEV: true
  },
  siteMetadata: {
    title: profile.title,
    titleTemplate: profile.titleTemplate,
    siteUrl: profile.siteUrl,
    description: profile.description,
    author: profile.author,
    url: profile.siteUrl,
    image: profile.placeholder,
    twitterUsername: ''
  },
  plugins: [
    `gatsby-plugin-pnpm`,
    {
      resolve: 'gatsby-plugin-google-gtag',
      options: {
        // The property ID; the tracking code won't be generated without it
        trackingIds: ['UA-143764638-1'],
        gtagConfig: {
          anonymize_ip: true,
          cookie_expires: 0,
          cookie_name: 'vallista.kr',
          sample_rate: 5
        },
        pluginConfig: {
          // Defines where to place the tracking script - `true` in the head and `false` in the body
          head: false,
          // Setting this parameter is also optional
          respectDNT: true,
          // Delays sending pageview hits on route update (in milliseconds)
          delayOnRouteUpdate: 0,
          origin: 'vallista.kr'
        }
      }
    },
    'gatsby-plugin-emotion',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-mdx',
    'gatsby-plugin-typescript',
    `gatsby-plugin-sharp`,
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: './src/pages/'
      },
      __key: 'pages'
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `posts`,
        path: `${__dirname}/content/posts`
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1024,
              linkImagesToOriginal: false,
              withWebp: true
            }
          },
          `gatsby-remark-gifs`,
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: 'Dark+ (default dark)'
            }
          }
        ]
      }
    },
    {
      resolve: `gatsby-plugin-nprogress`,
      options: {
        // Setting a color is optional.
        color: `#ff0080`,
        // Disable the loading spinner.
        showSpinner: false
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: profile.description,
        short_name: profile.author,
        start_url: `/`,
        icon: `static/favicons/favicon-96x96.png`,
        icons: [
          {
            src: '/favicons/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png'
          },
          {
            src: '/favicons/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/favicons/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/favicons/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/favicons/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/favicons/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    }
  ]
}
