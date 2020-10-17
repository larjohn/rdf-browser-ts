import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ParsingClient from 'sparql-http-client/ParsingClient';
import StreamClient from 'sparql-http-client/StreamClient';
import { ConstructQuery, Generator, Parser } from 'sparqljs';
import { Quad, Stream } from 'rdf-js';
import { Readable } from 'stream';

@Injectable()
export class SparqlService {



  constructor(private configService: ConfigService) {
  }


  private sparqlEndpoint = this.configService.get<string>('sparqlEndpoint.uri');

  private parsingClient = new ParsingClient  (  {endpointUrl: this.sparqlEndpoint});
  private streamClient = new StreamClient  (  {endpointUrl: this.sparqlEndpoint});
  private parser = new Parser();
  private generator = new Generator({ /* prefixes, baseIRI, factory, sparqlStar */ });

  private generateResourceConstructQuery(resourceUri: string): ConstructQuery {
    return <ConstructQuery>this.parser.parse(
      `CONSTRUCT {<${resourceUri}> ?p ?o. ?s1 ?p1 <${resourceUri}> . ?s2 <${resourceUri}> ?o2.} WHERE 
        {{ <${resourceUri}> ?p ?o.} UNION { ?s1 ?p1 <${resourceUri}>.} UNION { ?s2 <${resourceUri}> ?o2.}} `,
    );
  }


  resourceStream(resourceUri: string): Promise<Stream<Quad> & Readable> {

    const generatedQuery = this.generator.stringify(this.generateResourceConstructQuery(resourceUri));

    return this
      .streamClient
      .query
      .construct(generatedQuery,
        { headers: { accept: 'text/rdf+n3' } });
  }

  resourceParse(resourceUri: string): Promise<Quad[]> {
    const generatedQuery = this.generator.stringify(this.generateResourceConstructQuery(resourceUri));

    return this
      .parsingClient
      .query
      .construct(generatedQuery,
        { headers: { accept: 'text/rdf+n3' } });
  }

}