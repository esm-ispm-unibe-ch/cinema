(function () {
  'use strict';

  describe('Read Middleton.json into an Array of intervensions', function () {
    it('should find 40 intervensions' ,function (done) {
      var json = httpGet('Middleton.json')
      .then(
        function (value) {
          try{
            JSON.parse(value).should.have.length(40);
            console.log('Contents: ' + value);
            done();
          }catch (e){
            done(e);
          }
      },
      function (reason) {
          done(reason);
      });
    });
  });
})();
