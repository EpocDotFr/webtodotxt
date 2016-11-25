var app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        loading: false,
        todoTextBackup: null,
        todoBeingEdited: null,
        todos: []
    },
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodoTxt();
        });
    },
    methods: {
        editTodo: function (todo) {
            this.todoTextBackup = todo.text;
            this.todoBeingEdited = todo;
        },
        doneEdit: function (todo) {
            if (!this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = null;

            todo.text = todo.text.trim();

            if (!todo.text) {
                this.removeTodo(todo);
            }
        },
        cancelEdit: function (todo) {
            todo.text = this.todoTextBackup;

            this.todoTextBackup = null;
            this.todoBeingEdited = null;
        },
        removeTodo: function (todo) {
            this.todos.splice(this.todos.indexOf(todo), 1);
        },
        loadTodoTxt: function() {
            this.loading = true;

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

                    alert('Error while loading the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        },
        saveTodoTxt: function() {
            this.loading = true;

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
                    
                    alert('Error while updating the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        }
    }
});