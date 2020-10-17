import { BaseParser, Parser } from './parser.base';
import { Quad, Stream } from 'rdf-js';
import { PassThrough, Readable, Transform } from 'stream';
import { Parser as N3Parser, Store, Writer, StreamWriter, StreamParser } from 'n3';

export class QuadsToTuplesParser extends BaseParser {

  constructor(private format: string) {
    super();
  }

  arrayToStream(input: Quad[]): Readable {
    const readable = new PassThrough({emitClose: true});
    const writer = new Writer(readable, { format: this.format, end: false, prefixes: { c: 'http://example.org/cartoons#' } });
    writer.addQuads(input);
    writer.end();
    readable.end();
    return readable;
  }

  streamToStream(input: Stream<Quad> & Readable): Readable {
    const streamWriter = new StreamWriter({format: this.format, prefixes: { c: 'http://example.org/cartoons#' } });
    (<Readable> input).pipe(streamWriter);
    return streamWriter;
  }

  arrayToText(input: Quad[]): Promise<string> {
    const readable = new PassThrough({emitClose: true});
    const writer = new Writer(readable, { format: this.format , end: false, prefixes: { c: 'http://example.org/cartoons#' } });
    writer.addQuads(input);
    writer.end();
    readable.end();
    return this.readStream(readable);
  }

  streamToText(input: Stream<Quad>): Promise<string> {
    const streamWriter = new StreamWriter({format: this.format, prefixes: { c: 'http://example.org/cartoons#' } });
    (<Readable> input).pipe(streamWriter);
    return this.readStream(streamWriter);
  }

}

export class QuadsToNTriplesParser extends QuadsToTuplesParser{
  constructor() {
    super('N-Triples');
  }

}


export class QuadsToNQuadsParser extends QuadsToTuplesParser{
  constructor() {
    super('n-quads');
  }

}

export class QuadsToTurtleParser extends QuadsToTuplesParser{
  constructor() {
    super('turtle');
  }

}


export class QuadsToTrigParser extends QuadsToTuplesParser{
  constructor() {
    super('trig');
  }

}


export class QuadsToN3Parser extends QuadsToTuplesParser{
  constructor() {
    super('n3');
  }

}

