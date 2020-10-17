import *  as xml_scribe from '@graphy/content.xml.scribe'
import { Readable,  Transform } from 'stream';
import { Quad, Stream } from 'rdf-js';
import { BaseParser, Parser } from './parser.base';


export class QuadsToRdfXmlParser extends BaseParser{

  options = {
    prefixes: {
      dbr: 'http://dbpedia.org/resource/',
      ex: 'http://ex.org/',
    },
  }


  streamToStream(input: Stream<Quad>): Transform{
    const scriber = xml_scribe.default(this.options);
    scriber.import(input);
    return  scriber;
  }


  arrayToStream (input: Quad[]): Transform {
    const scriber = xml_scribe.default(this.options);
    input.forEach(quad => scriber.write(quad));
    scriber.end();
    return  scriber;
  }

  arrayToText(input: Quad[]): Promise<string> {
    const scriber = xml_scribe.default(this.options);
    input.forEach(quad => scriber.write(quad));
    scriber.end();
    return this.readStream(scriber);
  }

  streamToText(input: Stream<Quad>): Promise<string> {
    const scriber = xml_scribe.default(this.options);
    scriber.import(input);
    return  this.readStream(scriber);
  }
}