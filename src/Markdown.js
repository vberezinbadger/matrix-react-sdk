/*
Copyright 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import marked from 'marked';

// replace the default link renderer function
// to prevent marked from turning plain URLs
// into links, because tits algorithm is fairly
// poor, so let's send plain URLs rather than
// badly linkified ones (the linkifier Vector
// uses on message display is way better, eg.
// handles URLs with closing parens at the end).
const renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
    if (text == href) {
        return href;
    }
    return marked.Renderer.prototype.apply(this, arguments);
}
const PARAGRAPH_SUFFIX = '<br/><br/>';
// suffix paragraphs with double line breaks instead of
// wrapping them in 'p' tags: this makes it much easier
// for us to just strip one set of these off at the end,
// leaving valid markup if there were multiple paragraphs.
renderer.paragraph = function(text) {
    return text + PARAGRAPH_SUFFIX;
}

// marked only applies the default options on the high
// level marked() interface, so we do it here.
const marked_options = Object.assign({}, marked.defaults, {
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    xhtml: true, // return self closing tags (ie. <br /> not <br>)
});

const real_parser = new marked.Parser(marked_options);

/**
 * Class that wraps marked, adding the ability to see whether
 * a given message actually uses any markdown syntax or whether
 * it's plain text.
 */
export default class Markdown {
    constructor(input) {
        const lexer = new marked.Lexer(marked_options);
        this.tokens = lexer.lex(input);
    }

    _copyTokens() {
        // copy tokens (the parser modifies it's input arg)
        const tokens_copy = this.tokens.slice();
        // it also has a 'links' property, because this is javascript
        // and why wouldn't you have an array that also has properties?
        return Object.assign(tokens_copy, this.tokens);
    }

    isPlainText() {
        // we determine if the message requires markdown by
        // running the parser on the tokens with a dummy
        // rendered and seeing if any of the renderer's
        // functions are called other than those noted below.
        // In case you were wondering, no we can't just examine
        // the tokens because the tokens we have are only the
        // output of the *first* tokenizer: any line-based
        // markdown is processed by marked within Parser by
        // the 'inline lexer'...
        let is_plain = true;

        function setNotPlain() {
            is_plain = false;
        }

        const dummyRenderer = {};
        for (const k of Object.keys(marked.Renderer.prototype)) {
            dummyRenderer[k] = setNotPlain;
        }
        // text and paragraph are just text
        dummyRenderer.text = function(t){return t;}
        dummyRenderer.paragraph = function(t){return t;}

        // ignore links where text is just the url:
        // this ignores plain URLs that markdown has
        // detected whilst preserving markdown syntax links
        dummyRenderer.link = function(href, title, text) {
            if (text != href) {
                is_plain = false;
            }
        }

        const dummyOptions = {};
        Object.assign(dummyOptions, marked_options, {
            renderer: dummyRenderer,
        });
        const dummyParser = new marked.Parser(dummyOptions);
        dummyParser.parse(this._copyTokens());

        return is_plain;
    }

    toHTML() {
        return real_parser.parse(this._copyTokens()).slice(
            0, 0 - PARAGRAPH_SUFFIX.length
        );
    }
}
