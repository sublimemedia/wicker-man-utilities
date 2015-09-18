'use strict';

const expect = require("chai").expect;
const utilities = require("../dist/wmutilities");

describe("#objToArray", function() {
  const testObj = {
      0: 'test',
      1: 1,
      2: true
    },
    converted = utilities.objToArray(testObj);

  it("Can convert array like objects to actual arrays", function() {
    expect(converted).to.be.instanceOf(Array);
  });

  // Converted values match
});
