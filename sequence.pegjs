
start
    = (block/interaction)*

interaction
    = (_ left:participant _ signal:signal _ right:participant _ desc:description _ eol? {
        return {
            left: left,
            signal: signal,
            right: right,
            desc:desc,
            type: 'interaction'
        }
    })

block_start
    = _ type:('group'/'opt') _ eol {
        return type;
    }

block_end
    = _ 'end' _ eol?

block
    = type:block_start _ body:(interaction/block)+ _ block_end {
        return {
            body: body,
            type: 'block'
        };
    }

description
    = ':' desc:([A-Za-z \t])* {
        return desc.join('');
    }

signal
    = bi:[<]? tail:('-''-'?) head:[>] _ activate:[+-]? {
        const signal = {};
        if (bi && bi.length) {
            signal.head = 'double';
        } else {
            signal.head = 'filled';
        }

        signal.tail = tail[1] ? 'dotted' : 'normal';

        switch(activate) {
            case '+':
                signal.activate = true;
                break;
            case '-':
                signal.deactivate = true;
                break;
        }
        
        return signal;
    }

participant
    = word:[A-Za-z]+ {
        return word.join('');
    }

eol
    = [\n\r]+
    
_ "whitespace"
  = [ \t]*
  