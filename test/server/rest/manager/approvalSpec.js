'use strict';


describe('Approval on absence request', function() {


    /**
     * @var {mockServer}
     */
    var server;

    /**
     * @var {mockApproval}
     */
    var approval;

    var departments1;
    var collection1;

    var requests = [];

    var managersByDepartment;

    var async = require('async');

    var request_from_d6;

    /**
     * Callback from async
     */
    function getDepartmentUsers(department, callback) {
        department.getUsers(callback);
    }



    beforeEach(function(done) {
        var mockServerModule = require('../mockServer');
        var mockApproval = require('./mockApproval');

        mockServerModule.mockServer('managerApproval', function(_mockServer) {
            server = _mockServer;

            approval = new mockApproval(server);
            done();
        });
    });


    it('verify the mock objects', function(done) {
        expect(server.app).toBeDefined();
        expect(approval).toBeDefined();
        done();
    });


    it('create collection', function(done) {
        approval.createCollection('Test collection').then(function(collection) {
            collection1 = collection;
            collection.getRights().then(function(arr) {
                expect(arr.length).toEqual(4);
                done();
            });
        });
    });


    it('create departments', function(done) {
        approval.createDepartments(server.app).then(function(departments) {
            expect(departments).toBeDefined();
            departments1 = departments;
            departments[7].getAncestors(function(err, ancestors) {
                expect(err).toEqual(null);
                expect(ancestors.length).toEqual(3);
                managersByDepartment = approval.managersByDepartment;
                done();
            });
        });
    });



    it('set collection on accounts', function(done) {


        function userSetCollection(user, callback) {

            if (user.roles.account === undefined) {
                return callback();
            }

            user.roles.account.setCollection(collection1).then(function(accountCollection) {
                callback();
            }, callback);

        }

        async.concat(departments1, getDepartmentUsers, function(err, users) {
            async.each(users, userSetCollection, done);
        });

    });


    it('create one request per user in each department', function(done) {



        function userCreateRequest(user, callback) {

            if (user.roles.account === undefined) {
                return callback();
            }

            approval.createRequest(user).then(function(request) {
                requests.push(request);
                callback(undefined, request);
            }).catch(callback);
        }

        async.concat(departments1, getDepartmentUsers, function(err, users) {
            async.each(users, userCreateRequest, function(err) {
                expect(err).toBe(undefined);



                done();
            });
        });
    });


    it('contain at least one approval step per request', function() {

        for(var i=0; i< requests.length; i++) {
            expect(requests[i].approvalSteps.length).toBeGreaterThan(0);
        }
    });


    it('contain at least one approver in each approval steps', function() {

        var steps;

        for(var i=0; i< requests.length; i++) {

            steps = requests[i].approvalSteps;
            for(var j=0; j<steps.length; j++) {

                // at least one approver in each steps
                expect(steps[j].approvers.length).toBeGreaterThan(0);
            }
        }
    });


    /**
     * Verify requests created by account from a department
     *
     * @param {String} departmentName
     * @param {Object} expectations
     *                  Number of requests
     *                  number of approval steps
     *                  Number of approvers for each approval steps in the treatment sequence
     * @param {function} done
     *
     */
    function departmentRequestsExpect(departmentName, expectations, done) {

        var approvalSteps, approvers;

        approval.getRequests(departmentName).then(function(requests) {
            expect(requests.length+' requests').toEqual(expectations.requests+' requests');



            for(var i=0; i<requests.length; i++) {
                expect(requests[i].approvalSteps.length+' approval steps').toEqual(expectations.approvalSteps+' approval steps');

                approvalSteps = requests[i].approvalSteps;
                approvers = expectations.approvers.slice();

                expect(approvalSteps.length).toEqual(approvers.length);

                for(var j=0; j<approvalSteps.length; j++) {
                    expect(approvalSteps[j].approvers.length+' approvers (step '+j+', on '+approvalSteps[j].department+')').toEqual(approvers.pop()+' approvers (step '+j+', on '+approvalSteps[j].department+')');
                }
            }

            done();

        }, function(err) {
            expect(err).toBe(null);
            done();
        });
    }


    it('verify d0 approval steps', function(done) {
        departmentRequestsExpect('d0', {
            requests: 1,
            approvalSteps: 1,
            approvers: [1]
        }, done);
    });

    it('verify d1 approval steps', function(done) {
        departmentRequestsExpect('d1', {
            requests: 0,
            approvalSteps: 0,
            approvers: []
        }, done); // no requests
    });

    it('verify d2 approval steps', function(done) {
        departmentRequestsExpect('d2', {
            requests: 2,
            approvalSteps: 1,
            approvers: [1]
        }, done);
    });

    it('verify d3 approval steps', function(done) {
        departmentRequestsExpect('d3', {
            requests: 3,
            approvalSteps: 3,
            approvers: [1, 2, 1]
        }, done);
    });

    it('verify d4 approval steps', function(done) {
        departmentRequestsExpect('d4', {
            requests: 1,
            approvalSteps: 2,
            approvers: [2, 1]
        }, done);
    });


    it('verify d5 approval steps', function(done) {
        departmentRequestsExpect('d5', {
            requests: 1,
            approvalSteps: 1,
            approvers: [1]
        }, done);
    });

    it('verify d6 approval steps', function(done) {
        departmentRequestsExpect('d6', {
            requests: 1,
            approvalSteps: 3,
            approvers: [2, 2, 1]
        }, done);
    });

    it('verify d7 approval steps', function(done) {
        departmentRequestsExpect('d7', {
            requests: 1,
            approvalSteps: 2,
            approvers: [2, 1]
        }, done);
    });


    it('Login with the first approver from d6', function(done) {
        expect(managersByDepartment.d6[0]).toBeDefined();
        server.post('/rest/login', {
            'username': managersByDepartment.d6[0].user.email,
            'password': managersByDepartment.d6[0].password
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('Get list of waiting requests', function(done) {
        server.get('/rest/manager/waitingrequests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            request_from_d6 = body[0];
            done();
        });
    });

    it('Accept request from d6', function(done) {

        var steps = request_from_d6.approvalSteps;
        var firstStep = steps[steps.length-1];

        server.put('/rest/manager/waitingrequests/'+request_from_d6._id, {
            approvalStep: firstStep._id,
            action: 'wf_accept'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('Get list of waiting requests once the request has been accepted', function(done) {
        server.get('/rest/manager/waitingrequests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('Login with the first approver from d4', function(done) {
        expect(managersByDepartment.d4[0]).toBeDefined();
        server.post('/rest/login', {
            'username': managersByDepartment.d4[0].user.email,
            'password': managersByDepartment.d4[0].password
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('Get list of waiting requests (d4)', function(done) {
        server.get('/rest/manager/waitingrequests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(3); // one request from d4 and the request from d6
                                            // and one request from d7 (no managers in d7)

            var expected = ['d4', 'd6', 'd7'];

            var i, dep = {};
            for(i=0; i<departments1.length; i++) {
                dep[departments1[i]._id] = departments1[i].name;
            }

            for(i=0; i<body.length; i++) {
                expect(expected).toContain(dep[body[i].user.id.department]);
            }

            done();
        });
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
