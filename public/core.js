var myTodoList = angular.module('myTodoList', []);

myTodoList.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

myTodoList.controller('mainController', ['$scope', '$http', function($scope, $http) {
    $scope.formData = {};
    $scope.showedit = {};

    $scope.formData.true = "a706e433-8fae-451c-8dc9-7ea61b894ada";
    $scope.formData.false = "81ac0f26-3a4d-42cd-843c-177aff5ff22f";

    // V3 API
    $scope.apiUrl = 'http://api.acesso.io/v1'
    $scope.config = {
        headers: {
            'Tenant-Id': '00000000-0000-0000-0000-000000000001',
            'Authorization': 'Basic djNkYXk6djNkYXlAMTIz',
            'X-Requested-With': undefined
        },
        headersFile : {
            'Content-Type': undefined,
            'Tenant-Id': '00000000-0000-0000-0000-000000000001',
            'Authorization': 'Basic djNkYXk6djNkYXlAMTIz',
            'X-Requested-With': undefined
        },                
        processVersion: 1,
        processId: 'ac3b750d-e682-4fac-aed7-674814097dfb', // Obter ID após criar o processo pelo script "create_process.http"
        stepId: '81ac0f26-3a4d-42cd-843c-177aff5ff22f'
    }

    function uploadFile(item)
    {    
        var file = $scope.formData.file;
        var fd = new FormData();
        fd.append("file", file);

        var fieldId = "eb9552b5-b435-4b60-a3a2-b7790567ea46";

        $http.post($scope.apiUrl + '/objects/' + item._id + '/locks', {"lockType": "step"}, { headers: $scope.config.headers } )
        .success(function(res) {

            $http.post($scope.apiUrl + '/objects/' + item._id + '/fields/' + fieldId + '/files', fd, { headers: $scope.config.headersFile })
            .success(function(result) {
                $http.delete($scope.apiUrl + '/objects/' + item._id + '/locks/' + r.data._id, { headers: $scope.config.headers })
                .success(function(r) {
                    console.log(r);
                })
                .error(function(e) {
                    console.log(e);
                });
            })
            .error(function(err) {
                console.log(err);
            });
        });        
    }    

    function transform(object) {
        var fields = {};
        if (Array.isArray(object.fields)) {
            object.fields.forEach(function (field, i) {
                fields[field.fieldId] = field.value;
            })
        }
        
        return {
            'id': object._id,
            'step': object.protected.currentSteps[0].stepId,
            'text': fields['b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9'],
            'dueDate': fields['a8642860-2296-4a9d-94bf-2397ffefe733']
        };
    }

    // Página incial, obtemos e mostramos todas as tarefas
    $http.get($scope.apiUrl + '/processes/' + $scope.config.processId + '/objects?limit=50', { headers: $scope.config.headers })
        .success(function (result) {
            $scope.todos = [];

            if (result.success && result.data.size > 0) {
                result.data.items.forEach(function (item, key) {
                    $scope.todos.push(transform(item));
                })
            }
            console.log(result);
        }).error(function (err) {
            console.log('Error: ' + err);
        });

    // Cria uma nova tarefa, enviando o texto para a V3 API
    $scope.createTodo = function() {
        var objectFormData = {
            'processVersion': $scope.config.processVersion,
            'processId': $scope.config.processId,
            'stepId': $scope.config.stepId,
            'fields': [
                { 'fieldId': 'b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9', 'value': $scope.formData.text },
                { 'fieldId': 'a8642860-2296-4a9d-94bf-2397ffefe733', 'value': $scope.formData.date }
            ]
        };

        $http.post($scope.apiUrl + '/objects', objectFormData, { headers: $scope.config.headers })
            .success(function (result) {
                if (result.success) {
                    $scope.todos.push(transform(result.data));
                }
                
                $scope.formData.text = "";
                $scope.formData.date = "";

                uploadFile(result.data);

                console.log(result);
            })
            .error(function (err) {
                console.log('Error: ' + err);
            });
    };

    // Alterna a completude de uma tarefa
    $scope.changeCompleteness = function(item) {
        $http.put($scope.apiUrl + '/objects/' + item.id + '/steps/' + item.step, {}, { headers: $scope.config.headers } )
            .success(function(result) {
                console.log(result);
            })
            .error(function(err) {
                console.log('Error: ' + err);
            });
    }

    // Exclui uma tarefa
    $scope.deleteTodo = function(id) {
        $http.delete($scope.apiUrl + '/objects/' + id, { headers: $scope.config.headers })
            .success(function(result) {
                for (var i = 0; i < $scope.todos.length; i++) {
                    if ($scope.todos[i].id == id) {
                        $scope.todos.splice(i, 1);
                        break;
                    }
                }
            })
            .error(function(err) {
                console.log('Error: ' + err);
            });
    };

    // Altera a tarefa selecionada
    $scope.alterTodo = function(item){
        $http.post($scope.apiUrl + '/objects/' + item.id + '/locks', {"lockType": "step"}, { headers: $scope.config.headers } )
        .success(function(r) {
            var objectFormData = {
                'processVersion': $scope.config.processVersion,
                'processId': $scope.config.processId,
                'stepId': $scope.config.stepId,
                'fields': [
                    { 'fieldId': 'b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9', 'value': item.text },
                    { 'fieldId': 'a8642860-2296-4a9d-94bf-2397ffefe733', 'value': item.dueDate }
                ]
            };

            $http.put($scope.apiUrl + '/objects/' + item.id, objectFormData, { headers: $scope.config.headers } )
                .success(function(result) {
                    $http.delete($scope.apiUrl + '/objects/' + item.id + '/locks/' + r.data._id, { headers: $scope.config.headers })
                    .success(function(result) {
                        console.log(result);
                    })
                    .error(function(err) {
                        console.log(err);
                    });
                    //console.log(result);
                })
                .error(function(err) {
                    console.log(err);
                });

            $scope.showedit[item.id] = false;
        });   
    }

    // Altera a exibição da tarefa na exibição
    $scope.editTodo  = function(item) {
        $scope.showedit[item.id] = true;
    };

}]);