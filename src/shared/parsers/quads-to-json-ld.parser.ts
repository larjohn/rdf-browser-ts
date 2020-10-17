import { PassThrough, Readable, Transform } from 'stream';
import { Quad, Stream } from 'rdf-js';
import { BaseParser, Parser } from './parser.base';
import {JsonLdSerializer} from "jsonld-streaming-serializer";
import { DataFactory } from 'n3';


export class QuadsToJsonLdParser extends BaseParser{

  options = {
    prefixes: {
      dbr: 'http://dbpedia.org/resource/',
      ex: 'http://ex.org/',
    },
  }


  streamToStream(input: Stream<Quad> & Readable): Transform{
    const serializer = new JsonLdSerializer({
    });
    const readable = new PassThrough({emitClose: true});
    (input)
      .pipe(serializer)
      .pipe(readable);

    return  readable;
  }


  arrayToStream (input: Quad[]): Transform {
    const serializer = new JsonLdSerializer();
    input.forEach(quad => serializer.write(quad))
    serializer.end();
    return  serializer;
  }

  arrayToText(input: Quad[]): Promise<string> {
    const serializer = new JsonLdSerializer();
    input.forEach(quad => serializer.write(quad))
    serializer.end();
    return this.readStream(serializer);
  }

  streamToText(input: Stream<Quad> & Readable): Promise<string> {
    const serializer = new JsonLdSerializer({ });
    const readable = new PassThrough({emitClose: true});
    (input)
      .pipe(serializer)
      .pipe(readable);

    return this.readStream(readable);
  }
}