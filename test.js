'use strict';

/* eslint-disable max-params */

var path = require('path');
var test = require('tape');
var vfile = require('to-vfile');
var removePosition = require('unist-util-remove-position');
var remark = require('remark');
var rules = require('./script/util/rules');
var rule = require('./script/util/rule');
var lint = require('./packages/remark-lint');
var noHeadingPunctuation = require('./packages/remark-lint-no-heading-punctuation');
var noMultipleToplevelHeadings = require('./packages/remark-lint-no-multiple-toplevel-headings');
var finalNewline = require('./packages/remark-lint-final-newline');

test('core', function (t) {
  t.test('should work', function (st) {
    var doc = [
      '# A heading',
      '',
      '# Another main heading.',
      '',
      '<!--lint ignore-->',
      '',
      '# Another main heading.'
    ].join('\n');

    st.plan(4);

    remark()
      .use(noHeadingPunctuation)
      .use(noMultipleToplevelHeadings)
      .use(lint)
      .process(vfile({path: 'virtual.md', contents: doc}), function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(
          file.messages.map(String),
          [
            'virtual.md:3:1-3:24: Don’t add a trailing `.` to headings',
            'virtual.md:3:1-3:24: Don’t use multiple top level headings (3:1)'
          ],
          'should support `remark-lint` last'
        );
      });

    remark()
      .use(lint)
      .use(noHeadingPunctuation)
      .use(noMultipleToplevelHeadings)
      .process(vfile({path: 'virtual.md', contents: doc}), function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(
          file.messages.map(String),
          [
            'virtual.md:3:1-3:24: Don’t add a trailing `.` to headings',
            'virtual.md:3:1-3:24: Don’t use multiple top level headings (3:1)'
          ],
          'should support `remark-lint` first'
        );
      });
  });

  t.test('should support no rules', function (st) {
    st.plan(2);

    remark().use(lint).process('.', function (err, file) {
      st.ifErr(err, 'should not fail');
      st.deepEqual(
        file.messages.map(String),
        [],
        'should warn for missing new lines'
      );
    });
  });

  t.test('should support successful rules', function (st) {
    st.plan(2);

    remark()
      .use(finalNewline)
      .process('', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(file.messages, [], 'should support successful rules');
      });
  });

  t.test('should support a list with a severity', function (st) {
    st.plan(3);

    remark()
      .use(finalNewline, [2])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should trigger fatally (1)'
        );
        st.equal(file.messages[0].fatal, true, 'should trigger fatally (2)');
      });
  });

  t.test('should support a boolean (`true`)', function (st) {
    /* Note! This is handled by unified. */
    st.plan(2);

    remark()
      .use(finalNewline, true)
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should trigger'
        );
      });
  });

  t.test('should support a boolean (`false`)', function (st) {
    /* Note! This is handled by unified. */
    st.plan(2);

    remark()
      .use(finalNewline, false)
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(file.messages, [], 'should not trigger');
      });
  });

  t.test('should support a list with a boolean severity (true, for on)', function (st) {
    st.plan(2);

    remark()
      .use(finalNewline, [true])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should trigger'
        );
      });
  });

  t.test('should support a list with a boolean severity (false, for off)', function (st) {
    st.plan(2);

    remark()
      .use(finalNewline, [false])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(file.messages, [], 'should not trigger');
      });
  });

  t.test('should support a list with a string severity (`error`)', function (st) {
    st.plan(3);

    remark()
      .use(finalNewline, ['error'])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should trigger fatally (1)'
        );
        st.equal(file.messages[0].fatal, true, 'should trigger fatally (2)');
      });
  });

  t.test('should support a list with a string severity (`on`)', function (st) {
    st.plan(3);

    remark()
      .use(finalNewline, ['on'])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should message'
        );
        st.equal(file.messages[0].fatal, false, 'should *not* trigger fatally');
      });
  });

  t.test('should support a list with a string severity (`warn`)', function (st) {
    st.plan(3);

    remark()
      .use(finalNewline, ['warn'])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.equal(
          file.messages.join(),
          '1:1: Missing newline character at end of file',
          'should message'
        );
        st.equal(file.messages[0].fatal, false, 'should *not* trigger fatally');
      });
  });

  t.test('should support a list with a string severity (`off`)', function (st) {
    st.plan(2);

    remark()
      .use(finalNewline, ['off'])
      .process('.', function (err, file) {
        st.ifErr(err, 'should not fail');
        st.deepEqual(file.messages, [], 'should disable `final-newline`');
      });
  });

  t.test('should fail on invalid severities', function (st) {
    st.throws(
      function () {
        remark().use(finalNewline, [3]).freeze();
      },
      /^Error: Invalid severity `3` for `final-newline`, expected 0, 1, or 2$/,
      'should throw when too high'
    );

    st.throws(
      function () {
        remark().use(finalNewline, [-1]).freeze();
      },
      /^Error: Invalid severity `-1` for `final-newline`, expected 0, 1, or 2$/,
      'should throw too low'
    );

    st.end();
  });

  t.end();
});

test('rules', function (t) {
  var root = path.join(process.cwd(), 'packages');
  var all = rules(root);

  t.plan(all.length);

  all.forEach(each);

  function each(basename) {
    var base = path.resolve(root, basename);
    var info = rule(base);
    var fn = require(base);

    t.test(info.ruleId, one);

    function one(sst) {
      assertRule(sst, fn, info);
    }
  }
});

/* Assert a rule. */
function assertRule(t, rule, info) {
  var tests = info.tests;

  Object.keys(tests).forEach(function (setting) {
    var fixture = tests[setting];
    var config = JSON.parse(setting);

    t.test(setting, function (st) {
      Object.keys(fixture).forEach(function (name) {
        st.test(name, function (sst) {
          assertFixture(sst, rule, info, fixture[name], name, config);
        });
      });
    });
  });

  t.end();
}

function assertFixture(t, rule, info, fixture, basename, setting) {
  var ruleId = info.ruleId;
  var file = vfile(basename);
  var expected = fixture.output;
  var positionless = fixture.config.positionless;

  file.contents = preprocess(fixture.input || '');

  t.plan(positionless ? 1 : 2);

  remark()
    .use(rule, setting)
    .data('settings', fixture.config)
    .processSync(file, function (err) {
      if (err && err.source !== 'remark-lint') {
        throw err;
      }
    });

  t.deepEqual(
    normalize(file.messages),
    expected,
    'should equal with position'
  );

  file.messages.forEach(function (message) {
    if (message.ruleId !== ruleId) {
      throw new Error(
        'Expected `' + ruleId + '`, not `' +
        message.ruleId + '` as `ruleId` for ' +
        message
      );
    }
  });

  if (!positionless) {
    file.messages = [];

    try {
      remark()
        .use(function () {
          return removePosition;
        })
        .use(rule, setting)
        .processSync(file);
    } catch (err) {
      console.log('err: ', err);
    }

    t.deepEqual(
      normalize(file.messages),
      [],
      'should equal without position'
    );
  }

  file.messages = [];
}

function normalize(messages) {
  return messages.map(function (message) {
    var value = String(message);
    return value.slice(value.indexOf(':') + 1);
  });
}

function preprocess(value) {
  return value.replace(/»/g, '\t').replace(/·/g, ' ');
}
