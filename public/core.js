var myTodoList = angular.module('myTodoList', []);

function mainController($scope, $http) {
    $scope.formData = {};
    $scope.showedit = {};

    // V3 API
    $scope.apiUrl = 'http://api.acesso.io/v1'
    $scope.config = {
        headers: {
            'Tenant-Id': '00000000-0000-0000-0000-000000000001',
            'Authorization': 'Basic djNkYXk6djNkYXlAMTIz',
            'X-Requested-With': undefined
        },
        processVersion: 1,
        processId: 'ac3b750d-e682-4fac-aed7-674814097dfb', // Obter ID após criar o processo pelo script "create_process.http"
        stepId: '81ac0f26-3a4d-42cd-843c-177aff5ff22f'
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
                console.log(result);
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
                    { 'fieldId': 'b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9', 'value': item.text }
                ]
            };

            $http.put($scope.apiUrl + '/objects/' + item.id, objectFormData, { headers: $scope.config.headers } )
                .success(function(result) {
                    console.log(result);
                })
                .error(function(err) {
                    console.log('Error: ' + err);
                });

            $http.delete($scope.apiUrl + '/objects/' + item.id + '/locks/' + r._id, {"lockType": "step"}, { headers: $scope.config.headers } )
                .success(function(result) {
                    console.log(result);
                })
                .error(function(err) {
                    console.log('Error: ' + err);
                });

            $scope.showedit[item.id] = false;
        });   
    }

    // Altera a exibição da tarefa na exibição
    $scope.editTodo  = function(item) {
        $scope.showedit[item.id] = true;
    };

}