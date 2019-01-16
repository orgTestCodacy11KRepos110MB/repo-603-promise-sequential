const expect = require("chai").expect;
const promiseq = require('../index.js');

describe('sequentially promises', () => {

  it('should throw a error if not pass an array of promises', () => {
    const func = () => {
      promiseq({});
    }
    expect(func).to.throw('First argument need to be an array of Promises');
  });

  it('should return an Array containing all promises resolved results as response', (done) => {

    const vals = [1, 2, 3]

    let promises = vals.map((item) => {

      return function (previousResponse, results, count) {
        return new Promise(resolve => {
          setTimeout(function () {
            resolve(item)
          }, 1000)
        });
      }

    });
    promiseq(promises)
      .then(res => {
        expect(res).to.be.instanceof(Array);
        expect(res).to.eql(vals);
        done();
      })
  });

  it('should be able to catch value passed on reject of a promise', (done) => {

    let promises = [1,2].map((item) => {
      return function (previousResponse) {
        return new Promise((r, reject) => {
          setTimeout(() => {
            reject(1)
          }, 1000)
        })
      }
    });

    promiseq(promises)
      .catch(err => {
        expect(err).to.equal(1);
        done();
      })
  });

  it('should handle case where input array is empty', (done) => {

    const expectedResult = [];
    promiseq([])
      .then((res) => {
        expect(res).to.deep.equal(expectedResult);
        done();
      });
  });

  it('should not keep running after one of the promises is rejected', (done) => {
    /*
      This test checks whether promise-sequential keeps executing promises after one of them
      was rejected.

      In order to test the assertions each promise will update the value of a key in the
      'resolvedPromises' object. The expectation is that the 'resolvedPromises' values should
      only be updated up until the last successful promise. E.g.
      [ () => p1,              // updates 'resolvedPromises.p1'
        () => rejectedPromise, // should not update 'resolvedPromises.p2'
        () => p3 ]             // should not update 'resolvedPromises.p3'
    */
    const resolvedPromises = { p1: false, p2: false, p3: false };
    const expectedResolvedPromises = { p1: true, p2: false, p3: false };

    function updateResolvedPromises(key) {
      return new Promise((resolve) => {
        resolvedPromises[key] = true;
        resolve();
      });
    }

    const promises = [
      () => updateResolvedPromises('p1'),

      () => Promise.reject(),

      () => updateResolvedPromises('p3'),
    ];

    promiseq(promises)
      .catch(() => {})
      .then(() => {
        expect(resolvedPromises).to.deep.equal(expectedResolvedPromises);
        done();
      })
  });

})
