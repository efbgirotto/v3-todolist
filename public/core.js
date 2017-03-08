var myTodoList = angular.module('myTodoList', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // V3 API
    $scope.apiUrl = 'http://api.acesso.io/v1'
    $scope.config = {
        headers: {
            'Tenant-Id': '00000000-0000-0000-0000-000000000001',
            'Authorization': 'Basic djNkYXk6djNkYXlAMTIz',
            'X-Requested-With': undefined
        },
        processVersion: 1,
        processId: '356d5c07-da32-4b6a-9535-758f9d40d813', // Obter ID após criar o processo pelo script "create_process.http"
        stepId: '81ac0f26-3a4d-42cd-843c-177aff5ff22f'
    }

    // Página incial, obtemos e mostramos todas as tarefas
    function listTodo () {
        $http.get($scope.apiUrl + '/processes/' + $scope.config.processId + '/objects', { headers: $scope.config.headers })
            .success(function (result) {
                var data = [];

                if (result.success && result.data.size > 0) {
                    result.data.items.forEach(function (item, key) {

                        var fields = {};
                        if (Array.isArray(item.fields)) {
                            item.fields.forEach(function (field, i) {
                                fields[field.fieldId] = field.value;
                            })
                        }

                        data.push({
                            '_id': item._id,
                            'step': item.protected.currentSteps[0].stepId,
                            'text': fields['b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9'],
                            'dueDate': fields['b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9']
                        });
                    })
                }

                $scope.todos = data;
                console.log(data);
            }).error(function (result) {
                console.log('Error: ' + result);
            });
    };

    listTodo();

    // Cria uma nova tarefa, enviando o texto para a V3 API
    $scope.createTodo = function() {
        var objectFormData = {
            'processVersion': $scope.config.processVersion,
            'processId': $scope.config.processId,
            'stepId': $scope.config.stepId,
            'fields': [
                { 'fieldId': 'b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9', 'value': $scope.formData.text },
                { 'fieldId': 'a8642860-2296-4a9d-94bf-2397ffefe733', 'value': null }
            ]
        };

        $http.post($scope.apiUrl + '/objects', objectFormData, { headers: $scope.config.headers })
            .success(function (data) {
                $scope.formData = {};
                listTodo();
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    // Exclui uma tarefa
    $scope.deleteTodo = function(id) {
        $http.delete($scope.apiUrl + '/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

}