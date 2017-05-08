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

    $scope.formData.date = new Date();
    
    $scope.formData.true = "a706e433-8fae-451c-8dc9-7ea61b894ada";
    $scope.formData.false = "81ac0f26-3a4d-42cd-843c-177aff5ff22f";

    $scope.formData.page = 1;

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

    getTask(1);

    function uploadFile(item)
    {    
        var file = $scope.formData.file;
        var page = $scope.formData.page;
        var fd = new FormData();
        fd.append("file", file);

        if (file==undefined)
        {
            getTask(page);
            return;
        }

        var fieldId = "eb9552b5-b435-4b60-a3a2-b7790567ea46";

        $http.post($scope.apiUrl + '/objects/' + item._id + '/locks', {"lockType": "step"}, { headers: $scope.config.headers } )
        .success(function(responsePostLock) {

            $http.post($scope.apiUrl + '/objects/' + item._id + '/fields/' + fieldId + '/files', fd, { headers: $scope.config.headersFile })
            .success(function(responsePostFile) {

                $http.delete($scope.apiUrl + '/objects/' + item._id + '/locks/' + responsePostLock.data._id, { headers: $scope.config.headers })
                .success(function(responseDeleteLock) {

                    getTask(page);

                    /*$http.get($scope.apiUrl + '/objects/' + item._id + '/?fields=_id,protected(currentSteps(stepId)),fields(fieldId,value)', { headers: $scope.config.headers })
                    .success(function (responseGetObject) {
                        $scope.todos.push(transform(responseGetObject.data));
                    }).error(function (errorGetObject) {
                        console.log('Error: ' + errorGetObject);
                    });*/
                })
                .error(function(errorDeleteLock) {
                    console.log(errorDeleteLock);
                });
            })
            .error(function(errorPostFile) {
                console.log(errorPostFile);
            });
        })
        .error(function(errorPostLock) {
            console.log(errorPostLock);
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
            'dueDate': fields['a8642860-2296-4a9d-94bf-2397ffefe733'],
            'file': fields['eb9552b5-b435-4b60-a3a2-b7790567ea46']
        };
    }
     
    $scope.getTodo = function (page) {        
        getTask(page);
    }

    // Página incial, obtemos e mostramos todas as tarefas
    function getTask(page)
    {    
        var offset = 5*(page-1);

        $http.get($scope.apiUrl + '/processes/' + $scope.config.processId + '/objects/?limit=5&offset='+offset+'&fields=_id,protected(currentSteps(stepId)),fields(fieldId,value)', { headers: $scope.config.headers })
        .success(function (response) {
            if (response.success && response.data.size > 0) {
                $scope.formData.page = page;
                $scope.todos = [];

                response.data.items.forEach(function (item, key) {
                    $scope.todos.push(transform(item));
                })
            }            
        }).error(function (error) {
            console.log('Error: ' + error);
        });
    };    

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
            .success(function (response) {
                uploadFile(response.data);

                /*if (response.success) {
                    $scope.todos.push(transform(response.data));
                }*/
                $scope.formData.text = "";                
                $scope.formData.date = new Date();
                $scope.formData.file = undefined;
                $scope.frm.$setPristine();
                angular.element("input[type='file']").val('');
            })
            .error(function (error) {
                console.log('Error: ' + error);
            });
    };

    // Alterna a completude de uma tarefa
    $scope.changeCompleteness = function(item) {
        $http.put($scope.apiUrl + '/objects/' + item.id + '/steps/' + item.step, {}, { headers: $scope.config.headers } )
            .success(function(response) {
                //console.log(response);
            })
            .error(function(error) {
                console.log('Error: ' + error);
            });
    }

    // Exclui uma tarefa
    $scope.deleteTodo = function(id) {
        $http.delete($scope.apiUrl + '/objects/' + id, { headers: $scope.config.headers })
            .success(function(response) {
                for (var i = 0; i < $scope.todos.length; i++) {
                    if ($scope.todos[i].id == id) {
                        $scope.todos.splice(i, 1);
                        break;
                    }
                }
            })
            .error(function(error) {
                console.log('Error: ' + error);
            });
    };

    $scope.download = function(item){
        $http.get($scope.apiUrl + '/objects/' + item.id + '/fields/eb9552b5-b435-4b60-a3a2-b7790567ea46/files/'+item.file[0]._id, {responseType: 'arraybuffer', headers: $scope.config.headers })
         .success(function (response) {
            var blob = new Blob([response], {type: item.file[0].mimeType});

            var fileURL = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = fileURL;
            a.target = '_blank';
            a.download = item.file[0].localFileName;
            document.body.appendChild(a);
            a.click();
        }).error(function (error) {
            console.log('Error: ' + error);
        });
    };

    // Altera a tarefa selecionada
    $scope.alterTodo = function(item){
        $http.post($scope.apiUrl + '/objects/' + item.id + '/locks', {"lockType": "step"}, { headers: $scope.config.headers } )
        .success(function(responsePostLock) {

            $http.put($scope.apiUrl + '/objects/' + item.id + '/fields/b0d71bee-8fb1-46a2-be71-3bbb8f81ccd9', {'value': item.text}, { headers: $scope.config.headers } )
                .success(function(responsePutField) {

                    $http.delete($scope.apiUrl + '/objects/' + item.id + '/locks/' + responsePostLock.data._id, { headers: $scope.config.headers })
                    .success(function(responseDeleteLock) {
                        //console.log(responseDeleteLock);
                    })
                    .error(function(errorDeleteLock) {
                        console.log(errorDeleteLock);
                    });
                })
                .error(function(errorPutField) {
                    console.log(errorPutField);
                });
            $scope.showedit[item.id] = false;
        })
        .error(function(errorPostLock) {
            console.log(errorPostLock);
        });   
    }

    // Altera a exibição da tarefa na exibição
    $scope.editTodo  = function(item) {
        $scope.showedit[item.id] = true;
    };

}]);