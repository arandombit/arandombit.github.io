// @ts-check
const { defineConfig, createNotesQuery } = require('./.app/app-config');

module.exports = defineConfig({
  title: 'A Random Bit',
  description: 'Some random thoughts',
  customProperties: {
    properties: [
      {
        path: 'props',
        options: {
          date: {
            locale: 'en-US',
          },
        },
      },
    ],
  },
  sidebar: {
    links: [
      {
        url: 'https://github.com/arandombit',
        label: 'GitHub',
        icon: 'github',
      },
    ],
    sections: [
      {
        label: 'Posts',
        groups: [
          {
            query: createNotesQuery({
              pattern: '^/Post/'
            })
          }
        ]
      },
    ],
  },
  tags: {
    map: {
      'dynamic-content': 'dynamic content',
    },
  },
});
