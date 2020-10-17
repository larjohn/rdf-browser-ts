import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as url from 'url';
import { ResourceAction } from './shared/resource-action';
import { ResourceMatcher } from './shared/resource-matcher';
import { MatchType } from './shared/match-type';
import { SparqlService } from './shared/services/sparql.service';
import { QuadsToJsonLdParser } from './shared/parsers/quads-to-json-ld.parser';
import { MediaType } from './shared/media-type';
import { Parser } from './shared/parsers/parser.base';
import { QuadsToRdfXmlParser } from './shared/parsers/quads-to-rdf-xml.parser';
import {
  QuadsToN3Parser,
  QuadsToNQuadsParser,
  QuadsToNTriplesParser,
  QuadsToTrigParser, QuadsToTurtleParser,
} from './shared/parsers/quads-to-tuples.parser';


@Injectable()
export class AppService {



  constructor(private configService: ConfigService, private sparqlService: SparqlService) {
  }

  discoverMatch(url: string): ResourceAction {

    const matchers = this.configService.get('resourceNegotiation')
      .map(config => new ResourceMatcher(config))
      .filter(matcher => matcher.matches(url));


    const actions = matchers.map((matcher: ResourceMatcher) => {
      const resourceAction: ResourceAction = new ResourceAction();
      resourceAction.type = matcher.isHuman(url) ? MatchType.HUMAN : matcher.isMachine(url) ? MatchType.MACHINE : MatchType.RESOURCE;
      resourceAction.humanUrl = matcher.getHuman(url);
      resourceAction.machineUrl = matcher.getMachine(url);
      resourceAction.resourceUri = matcher.getResource(url);
      resourceAction.url = url;
      return resourceAction;
    });

    if (actions.length > 0) {
      return actions[0];
    } else {
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


  async getResource(resPath, mediaType: MediaType = MediaType.rdf_xml ) {
    const resourceStream = await this.sparqlService.resourceStream(resPath);
    let parser: Parser;
    switch (mediaType) {
      case MediaType.json:
      case MediaType.json_ld:
        parser = new QuadsToJsonLdParser();
        break;
      case MediaType.rdf_xml:
        parser = new QuadsToRdfXmlParser();
        break;
      case MediaType.n3:
        parser = new QuadsToN3Parser();
        break;
      case MediaType.n_quads:
        parser = new QuadsToNQuadsParser();
        break;
      case MediaType.n_triples:
        parser = new QuadsToNTriplesParser();
        break;
      case MediaType.trig:
        parser = new QuadsToTrigParser();
        break;
      case MediaType.turtle:
        parser = new QuadsToTurtleParser();
        break;
      default:
        throw new NotAcceptableException();


    }

    return parser.streamToStream(resourceStream);


  }
  async getResourceRaw(resPath) {
    return await this.sparqlService.resourceParse(resPath);
  }



}
