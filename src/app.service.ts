import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as url from 'url';
import { ResourceAction } from './shared/resource-action';
import { ResourceMatcher } from './shared/resource-matcher';
import { MatchType } from './shared/match-type';
import { SparqlService } from './shared/services/sparql.service';
import { QuadsToJsonLdParser } from './shared/parsers/quads-to-json-ld.parser';
import { Extensions, MediaType } from './shared/media-type';
import { Parser } from './shared/parsers/parser.base';
import { QuadsToRdfXmlParser } from './shared/parsers/quads-to-rdf-xml.parser';
import {
  QuadsToN3Parser,
  QuadsToNQuadsParser,
  QuadsToNTriplesParser,
  QuadsToTrigParser,
  QuadsToTurtleParser,
} from './shared/parsers/quads-to-tuples.parser';


@Injectable()
export class AppService {



  constructor(private configService: ConfigService, private sparqlService: SparqlService) {
  }


  negotiate(mediaTypes: string[]): MediaType {
    let selectedMediaType: MediaType = MediaType.text_html;
    const keys = Object.keys(MediaType);
    const values = Object.values(MediaType);
    const selectedType = mediaTypes.find(
      mt => values.some(v => v === mt)
    );

    if(!!selectedType) selectedMediaType = MediaType[keys.find(key => MediaType[key] === selectedType)];
    return selectedMediaType;
  }

  discoverMatch(request): ResourceAction {

    const url = this.getResUrl(request);
    const reqUrl = this.getFullUrl(request);

    const matchers = this.configService.get('resourceNegotiation')
      .map(config => new ResourceMatcher(config))
      .filter(matcher => matcher.matches(url));


    const actions = matchers.map((matcher: ResourceMatcher) => {
      const resourceAction: ResourceAction = new ResourceAction();
      resourceAction.type = matcher.isHuman(url) ? MatchType.HUMAN : matcher.isMachine(url) ? MatchType.MACHINE : MatchType.RESOURCE;
      resourceAction.humanUrl = matcher.getHuman(reqUrl);
      resourceAction.machineUrl = matcher.getMachine(reqUrl);
      resourceAction.resourceUri = matcher.getResource(url);
      resourceAction.url = reqUrl;
      return resourceAction;
    });

    if (actions.length > 0) {
      return actions[0];
    } else {
      throw new NotFoundException();
    }
  }


  getResUrl(req) {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.params[0],
    });

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


  determineExtension(ext: string): MediaType {
    let mediaType = MediaType.text_html;
    const keys = Object.keys(Extensions);
    const selectedType = keys.find(k => Extensions[k] === ext);

    if(!!selectedType) mediaType = MediaType[selectedType];

    return mediaType;

  }
}
