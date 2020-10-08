export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  sparqlEndpoint: {
    uri: process.env.SPARQL_ENDPOINT
  },
  resourceBaseUri: process.env.RESOURCE_BASE_URL,
  resourceNegotiation: [
/*    {
      pattern: '(http:\/\/data.nlg.gr\/)(resource|data|page)\/(.*)',
      human: '$1page/$3',
      machine: '$1data/$3',
      resource: '$&',
    },*/

    {
      pattern: '(http:\/\/localhost:3000\/)(resource|data|page)\/(.*)',
      human: '$1page/$3',
      machine: '$1data/$3',
      resource: 'http://data.nlg.gr/resource/$3',
    }
  ],
});