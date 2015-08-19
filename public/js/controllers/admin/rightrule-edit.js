define([], function() {
    
    'use strict';

	return [
        '$scope',
        '$location',
        'Rest',
        'setSubDocument', function($scope, $location, Rest, setSubDocument) {

            
        var rightResource = Rest.admin.rights.getResource();
        var rightRenewal = Rest.admin.rightrenewals.getResource();
            
        function onRightLoaded(right) {

            // load last renewal for right
            rightRenewal.query({right: right._id}).$promise.then(function(renewals) {
                $scope.renewal = renewals[0];
            });

            //TODO: populate $scope.rightrule

        }
            



        // estimation for the seniority rule via $scope.estimated
        var min, max;

        $scope.$watchCollection('rightrule.interval', function onChangeInterval(interval) {
            if (undefined === interval) {
                return;
            }

            min = new Date();
            max = new Date();

            min.setFullYear(min.getFullYear() - interval.min);
            max.setFullYear(max.getFullYear() - interval.max);

            $scope.estimated = {
                min: min,
                max: max
            };
        });

            
        if ($location.search().right) {
            $scope.right = rightResource.get({id: $location.search().right});
            $scope.right.$promise.then(onRightLoaded);
        }
            

        $scope.step = 1;
        $scope.rightrule = {
            type: 'entry_date',
            title: '',
            interval: {
                min:0,
                max:0
            }
        };

        $scope.next = function() {
            $scope.step = 2;
        };

		$scope.back = function() {
			$location.url('/admin/rights/'+$scope.right._id);
		};
		
		$scope.saveRightrule = function() {
            
            $scope.right.rules = setSubDocument($scope.right.rules, $scope.rightrule);
			$scope.right.$save($scope.back);
	    };
	}];
});

