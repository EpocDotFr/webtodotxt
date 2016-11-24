var app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        loading: false,
        todos: []
    },
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodoTxt();
        });
    },
    methods: {
        loadTodoTxt: function() {
            app.loading = true;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response, status, xhr) {
                    if (response.status == 'success') {
                        app.todos = response.data;
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }

                    alert('Network error while loading the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        },
        saveTodoTxt: function() {
            app.loading = true;

            $.ajax({
                type: 'POST',
                url: ROOT_URL + 'todo.txt',
                contentType: 'application/json',
                data: JSON.stringify(app.todos),
                success: function(response, status, xhr) {
                    if (response.status != 'success') {
                        alert(response.data.message);
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }
                    
                    alert('Network error while updating the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        }
    }
});