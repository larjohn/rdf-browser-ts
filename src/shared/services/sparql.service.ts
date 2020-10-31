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
      `
PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
CONSTRUCT {
  <${resourceUri}> ?p ?o. 
  ?o ?bnp ?bnv.
  ?s1 ?p1 <${resourceUri}> . 
  ?s2 <${resourceUri}> ?o2. 
  
  ?actual rdf:first ?first.
  ?actual rdf:rest ?rest.
  ?first ?elp ?val.
  ?oo ?lp2 ?list.
 <${resourceUri}> ?lp ?list.
 
 
  ?p ?pLabelProperty ?pLabel.
  ?o ?oLabelProperty ?oLabel.
  ?bnp ?bnpLabelProperty ?bnpLabel.
  ?bnv ?bnvLabelProperty ?bnvLabel.
  ?p1 ?p1LabelProperty ?p1Label.
  ?s1 ?s1LabelProperty ?s1Label.
  ?s2 ?s2LabelProperty ?s2Label.
  ?o2 ?o2LabelProperty ?o2Label.
  ?elp ?elpLabelProperty ?elpLabel.
  ?val ?valLabelProperty ?valLabel.

} WHERE {
  { 
    <${resourceUri}> ?p ?o.
    OPTIONAL {
      FILTER (isBlank(?o)) .
      ?o ?bnp ?bnv.
      
      OPTIONAL {
        ?bnp ?bnpLabelProperty ?bnpLabel.
        ?bnpLabelProperty rdfs:subPropertyOf* rdfs:label
      }
      
          
      OPTIONAL {
        ?bnv ?bnvLabelProperty ?bnvLabel.
        ?bnvLabelProperty rdfs:subPropertyOf* rdfs:label
      }
    }
    
    OPTIONAL {
      ?p ?pLabelProperty ?pLabel.
      ?pLabelProperty rdfs:subPropertyOf* rdfs:label
    }
    
        
    OPTIONAL {
      ?o ?oLabelProperty ?oLabel.
      ?oLabelProperty rdfs:subPropertyOf* rdfs:label
    }
        

    
  } 
  UNION { 
    ?s1 ?p1 <${resourceUri}>.
    
    OPTIONAL {
      ?p1 ?p1LabelProperty ?p1Label.
      ?p1LabelProperty rdfs:subPropertyOf* rdfs:label
    }
    
        
    OPTIONAL {
      ?s1 ?s1LabelProperty ?s1Label.
      ?s1LabelProperty rdfs:subPropertyOf* rdfs:label
    }
     
    
  } 
  UNION { 
    ?s2 <${resourceUri}> ?o2.
    
    OPTIONAL {
      ?s2 ?s2LabelProperty ?s2Label.
      ?s2LabelProperty rdfs:subPropertyOf* rdfs:label
    }
    
        
    OPTIONAL {
      ?o2 ?o2LabelProperty ?o2Label.
      ?o2LabelProperty rdfs:subPropertyOf* rdfs:label
    }
     
  }
  UNION {
    { 
      <${resourceUri}> ?lp ?list.
    } UNION {
    
      <${resourceUri}> ?op ?oo.
      ?oo ?lp2 ?list.

    }
    ?list (rdf:rest*)/rdf:first ?first.
    ?actual rdf:first ?first.
    OPTIONAL {?actual rdf:rest ?rest.}
    ?first ?elp ?val.  
    
    OPTIONAL {
      ?elp ?elpLabelProperty ?elpLabel.
      ?elpLabelProperty rdfs:subPropertyOf* rdfs:label
    }
    
        
    OPTIONAL {
      ?val ?valLabelProperty ?valLabel.
      ?valLabelProperty rdfs:subPropertyOf* rdfs:label
    }
     
    
  }  
} `
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