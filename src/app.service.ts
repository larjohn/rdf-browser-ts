import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as url from 'url';
import { ConstructQuery, Generator, Parser } from 'sparqljs';
import * as SparqlClient from 'sparql-http-client';
import { streamToRx } from 'rxjs-stream';
import { map, toArray } from 'rxjs/operators';


export enum MatchType {
  HUMAN = 'human',
  MACHINE = 'machine',
  RESOURCE = 'resource',
  UNKNOWN = 'unknown'
}

class ResourceAction {
  url: string;
  type: MatchType;
  humanUrl: string;
  machineUrl: string;
  resourceUri: string;
}

class ResourceMatcher {

  pattern: RegExp;
  human: string;
  machine: string;
  resource: string;

  constructor(config) {
    this.pattern = RegExp(config.pattern);
    this.human = (config.human);
    this.machine = (config.machine);
    this.resource = (config.resource);
  }


  matches(url: string): boolean {
    return this.pattern.test(url);
  }

  isHuman(url): boolean {
    return this.getHuman(url) === url;
  }

  isMachine(url): boolean {
    return this.getMachine(url) === url;
  }

  getHuman(url): string {
    return url.replace(this.pattern, this.human);
  }

  getMachine(url): string {
    return url.replace(this.pattern, this.machine);
  }


  getResource(url): string {
    return url.replace(this.pattern, this.resource);
  }

}

@Injectable()
export class AppService {
  sparqlEndpoint = this.configService.get<string>('sparqlEndpoint.uri');

  constructor(private configService: ConfigService) {
  }

  discoverMatch(url: string): ResourceAction {

    const matchers = this.configService.get('resourceNegotiation')
      .map(config => new ResourceMatcher(config))
      .filter(matcher => matcher.matches(url))


    const actions = matchers.map((matcher: ResourceMatcher) => {
      const resourceAction: ResourceAction = new ResourceAction();
      resourceAction.type = matcher.isHuman(url) ? MatchType.HUMAN : matcher.isMachine(url) ? MatchType.MACHINE : MatchType.RESOURCE;
      resourceAction.humanUrl = matcher.getHuman(url);
      resourceAction.machineUrl = matcher.getMachine(url);
      resourceAction.resourceUri = matcher.getResource(url);
      resourceAction.url = url;
      return resourceAction;
    })

    if(actions.length > 0) {
      return actions[0];
    }
    else {
      throw new NotFoundException();
    }
  }


  getFullUrl(req) {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl,
    });

  }


  async getResource(resPath) {
    const parser = new Parser();
    const parsedQuery: ConstructQuery = <ConstructQuery>parser.parse(
      `CONSTRUCT {<${resPath}> ?p ?o} WHERE { <${resPath}> ?p ?o.} `,
    );

// Regenerate a SPARQL query from a JSON object
    const generator = new Generator({ /* prefixes, baseIRI, factory, sparqlStar */ });
    // parsedQuery.variables = [DataFactory.variable('mickey')];
    const generatedQuery = generator.stringify(parsedQuery);


    const client = new SparqlClient({ endpointUrl: this.sparqlEndpoint });

    const stream = await client.query.construct(generatedQuery, { headers: { accept: 'text/rdf+n3' } });

    stream.on('data', row => {
      Object.entries(row).forEach(([key, value]: [string, any]) => {
        console.log(`${key}: ${value.value} (${value.termType})`);
      });
    });

    stream.on('error', err => {
      console.error(err);
    });

    return streamToRx(stream).pipe(map(row => {


        return row;
      }),

      toArray(),
    ).toPromise();


  }
}
