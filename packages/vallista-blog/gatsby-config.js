module.exports = {
  siteMetadata: {
    title: "'Vallista's Log",
    titleTemplate: '%s · Vallista',
    siteUrl: 'https://vallista.kr',
    description: 'Vallista의 블로그',
    author: `@vallista`,
    url: 'https://vallista.kr',
    image: '/images/profile.jpg',
    twitterUsername: ''
  },
  plugins: [
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        // The property ID; the tracking code won't be generated without it
        trackingId: 'UA-143764638-1',
        // Defines where to place the tracking script - `true` in the head and `false` in the body
        head: false,
        // Setting this parameter is optional
        anonymize: true,
        // Setting this parameter is also optional
        respectDNT: true,
        // Delays sending pageview hits on route update (in milliseconds)
        pageTransitionDelay: 0,
        defer: false,
        // Any additional optional fields
        sampleRate: 5,
        siteSpeedSampleRate: 10,
        cookieDomain: 'vallista.kr'
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
              maxWidth: 1000,
              linkImagesToOriginal: false
            }
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: 'Dark+ (default dark)'
            }
          }
        ]
      }
    }
  ]
  //   {
  //     resolve: `gatsby-transformer-remark`,
  //     options: {
  //       plugins: [
  //         {
  //           resolve: `gatsby-remark-images`,
  //           options: {
  //             maxWidth: 1000,
  //             linkImagesToOriginal: false
  //           }
  //         },
  //         {
  //           resolve: 'gatsby-remark-copy-linked-files'
  //         }
  //       ]
  //     }
  //   }
  // ]
}
