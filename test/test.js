var request = require('supertest')
    , express = require('express');

var app = require('../index.js');

describe('GET', function(){
    it('should send ok by 404', function(done){
        request(app)
            .get('/')
            .expect(404)
            .end(done)
    })
})